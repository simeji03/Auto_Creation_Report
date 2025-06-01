"""
対話型月報生成のAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import re
from typing import Dict, Any, Optional, Union

from database import get_db, User
from schemas import ConversationSession, ConversationResponse, QuestionResponse
from auth import get_current_active_user

router = APIRouter()

def extract_number_from_text(text: str, default: Union[int, float] = 0) -> Union[int, float]:
    """
    日本語テキストから数値を抽出する
    例: "160時間ぐらいすね" -> 160
    例: "およそ200万円です" -> 2000000
    """
    if not text or not isinstance(text, str):
        return default
    
    # 「万」「千」などの単位を先に処理
    # 例: "200万" -> 2000000
    unit_patterns = [
        (r'([0-9０-９]+(?:\.[0-9０-９]+)?)\s*万', 10000),
        (r'([0-9０-９]+(?:\.[0-9０-９]+)?)\s*千', 1000),
        (r'([0-9０-９]+(?:\.[0-9０-９]+)?)\s*百', 100),
    ]
    
    for pattern, multiplier in unit_patterns:
        match = re.search(pattern, text)
        if match:
            number_str = match.group(1)
            # 全角を半角に変換
            trans_table = str.maketrans('０１２３４５６７８９', '0123456789')
            number_str = number_str.translate(trans_table)
            try:
                base_number = float(number_str)
                result = base_number * multiplier
                return int(result) if result == int(result) else result
            except ValueError:
                continue
    
    # 通常の数値パターンを検索（全角・半角対応）
    # カンマ付き数値、小数点付き数値も対応
    patterns = [
        r'[0-9０-９]+(?:[,，][0-9０-９]+)*(?:\.[0-9０-９]+)?',  # 半角・全角数字
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            # 最初にマッチした数値を使用
            number_str = matches[0]
            
            # 全角を半角に変換
            trans_table = str.maketrans('０１２３４５６７８９，', '0123456789,')
            number_str = number_str.translate(trans_table)
            
            # カンマを除去
            number_str = number_str.replace(',', '')
            
            try:
                # 小数点があればfloat、なければint
                if '.' in number_str:
                    return float(number_str)
                else:
                    return int(number_str)
            except ValueError:
                continue
    
    return default

# 質問のテンプレート
QUESTION_FLOW = {
    "basic_info": {
        "order": 1,
        "questions": [
            {
                "id": "current_phase",
                "question": "今月のあなたの事業フェーズはどのような状況でしたか？（例：成長期、安定期、拡大期など）",
                "type": "text",
                "follow_up": "具体的にどのような点でそう感じられましたか？"
            }
        ]
    },
    "work_time": {
        "order": 2,
        "questions": [
            {
                "id": "total_work_hours",
                "question": "今月の総稼働時間はどのくらいでしたか？",
                "type": "number",
                "follow_up": "平日と休日の作業時間の配分はいかがでしたか？"
            },
            {
                "id": "coding_hours",
                "question": "そのうち、実際にコーディングや開発作業に費やした時間はどのくらいですか？",
                "type": "number",
                "follow_up": "どのような技術や言語を主に使用されましたか？"
            },
            {
                "id": "meeting_hours",
                "question": "クライアントとの打ち合わせや会議にかけた時間はどのくらいでしょうか？",
                "type": "number",
                "follow_up": "会議の内容や成果はいかがでしたか？"
            }
        ]
    },
    "sales_activities": {
        "order": 3,
        "questions": [
            {
                "id": "sales_emails_sent",
                "question": "今月、営業メールはどのくらい送信されましたか？",
                "type": "number",
                "follow_up": "どのような内容のメールが多かったですか？"
            },
            {
                "id": "sales_replies",
                "question": "そのうち、返信をいただけたのは何件くらいでしょうか？",
                "type": "number",
                "follow_up": "返信率についてはどのように感じていますか？"
            },
            {
                "id": "sales_meetings",
                "question": "実際に商談や面談に進んだのは何件ありましたか？",
                "type": "number",
                "follow_up": "商談の手応えはいかがでしたか？"
            }
        ]
    },
    "financial": {
        "order": 4,
        "questions": [
            {
                "id": "received_amount",
                "question": "今月の売上や受注金額はどのくらいでしたか？",
                "type": "number",
                "follow_up": "目標と比較していかがでしたか？"
            }
        ]
    },
    "reflection": {
        "order": 5,
        "questions": [
            {
                "id": "good_points",
                "question": "今月特に良かった点や成果について教えてください。",
                "type": "text",
                "follow_up": "その成果を生み出した要因は何だと思いますか？"
            },
            {
                "id": "challenges",
                "question": "今月の課題や困ったことがあれば教えてください。",
                "type": "text",
                "follow_up": "その課題に対してどのようなアプローチを考えていますか？"
            },
            {
                "id": "next_month_goals",
                "question": "来月の目標や重点的に取り組みたいことを教えてください。",
                "type": "text",
                "follow_up": "その目標を達成するための具体的な計画はありますか？"
            }
        ]
    }
}

@router.post("/start", response_model=ConversationResponse)
async def start_conversation(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    対話型月報作成セッションを開始
    """
    # 最初の質問を取得
    first_category = min(QUESTION_FLOW.keys(), key=lambda x: QUESTION_FLOW[x]["order"])
    first_question = QUESTION_FLOW[first_category]["questions"][0]
    
    session_data = {
        "user_id": current_user.id,
        "current_category": first_category,
        "current_question_index": 0,
        "answers": {},
        "completed_categories": []
    }
    
    return ConversationResponse(
        session_id=f"session_{current_user.id}",
        question=first_question["question"],
        question_type=first_question["type"],
        category=first_category,
        progress=1,
        total_questions=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
        session_data=session_data
    )

@router.post("/answer", response_model=ConversationResponse)
async def process_answer(
    answer_data: QuestionResponse,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ユーザーの回答を処理し、次の質問を返す
    """
    session_data = answer_data.session_data
    current_category = session_data["current_category"]
    current_question_index = session_data["current_question_index"]
    
    # 現在の質問情報を取得
    current_questions = QUESTION_FLOW[current_category]["questions"]
    current_question = current_questions[current_question_index]
    
    # 回答を保存
    session_data["answers"][current_question["id"]] = {
        "answer": answer_data.answer,
        "additional_context": answer_data.additional_context
    }
    
    # 次の質問を決定
    next_question_index = current_question_index + 1
    
    # 現在のカテゴリに次の質問があるか確認
    if next_question_index < len(current_questions):
        next_question = current_questions[next_question_index]
        session_data["current_question_index"] = next_question_index
    else:
        # 現在のカテゴリが完了、次のカテゴリへ
        session_data["completed_categories"].append(current_category)
        
        # 次のカテゴリを見つける
        remaining_categories = [
            cat for cat in QUESTION_FLOW.keys() 
            if cat not in session_data["completed_categories"]
        ]
        
        if remaining_categories:
            next_category = min(remaining_categories, key=lambda x: QUESTION_FLOW[x]["order"])
            next_question = QUESTION_FLOW[next_category]["questions"][0]
            session_data["current_category"] = next_category
            session_data["current_question_index"] = 0
        else:
            # すべての質問が完了
            return ConversationResponse(
                session_id=answer_data.session_id,
                question=None,
                question_type="completed",
                category="completed",
                progress=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
                total_questions=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
                session_data=session_data,
                is_complete=True
            )
    
    current_progress = len([
        q for cat in session_data["completed_categories"] 
        for q in QUESTION_FLOW[cat]["questions"]
    ]) + session_data["current_question_index"] + 1
    
    return ConversationResponse(
        session_id=answer_data.session_id,
        question=next_question["question"],
        question_type=next_question["type"],
        category=session_data["current_category"],
        progress=current_progress,
        total_questions=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
        session_data=session_data
    )

@router.post("/generate-report")
async def generate_report_from_conversation(
    session_data: ConversationSession,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    対話の回答から月報データを生成
    """
    from database import MonthlyReport
    from datetime import datetime
    
    answers = session_data.answers
    
    # 基本的な数値データを抽出
    # 数値型の質問については、テキストから数値を抽出
    report_data = {
        "user_id": current_user.id,
        "report_month": datetime.now().strftime("%Y-%m"),
        "current_phase": answers.get("current_phase", {}).get("answer", ""),
        "total_work_hours": extract_number_from_text(
            answers.get("total_work_hours", {}).get("answer", ""), 
            default=0.0
        ),
        "coding_hours": extract_number_from_text(
            answers.get("coding_hours", {}).get("answer", ""), 
            default=0.0
        ),
        "meeting_hours": extract_number_from_text(
            answers.get("meeting_hours", {}).get("answer", ""), 
            default=0.0
        ),
        "sales_emails_sent": int(extract_number_from_text(
            answers.get("sales_emails_sent", {}).get("answer", ""), 
            default=0
        )),
        "sales_replies": int(extract_number_from_text(
            answers.get("sales_replies", {}).get("answer", ""), 
            default=0
        )),
        "sales_meetings": int(extract_number_from_text(
            answers.get("sales_meetings", {}).get("answer", ""), 
            default=0
        )),
        "received_amount": extract_number_from_text(
            answers.get("received_amount", {}).get("answer", ""), 
            default=0.0
        ),
        "good_points": answers.get("good_points", {}).get("answer", ""),
        "challenges": answers.get("challenges", {}).get("answer", ""),
        "next_month_goals": answers.get("next_month_goals", {}).get("answer", "")
    }
    
    # 月報を作成
    new_report = MonthlyReport(**report_data)
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {
        "message": "月報が正常に生成されました",
        "report_id": new_report.id,
        "report_data": report_data
    }

@router.get("/questions/preview")
async def get_question_preview():
    """
    質問の全体構成をプレビュー表示
    """
    preview = {}
    for category, data in QUESTION_FLOW.items():
        preview[category] = {
            "order": data["order"],
            "question_count": len(data["questions"]),
            "questions": [q["question"] for q in data["questions"]]
        }
    return preview