"""
対話型月報生成 - 認証無効版（詳細版）
元のconversation.pyの機能を認証無効版として実装
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import json
import os
from datetime import datetime
import re

from database import get_db, MonthlyReport
from schemas import MonthlyReportCreate
from pydantic import BaseModel
from typing import Dict, Any, Optional, Union

class ConversationRequest(BaseModel):
    report_month: str

class ConversationResponse(BaseModel):
    session_id: str
    question: Optional[str] = None
    question_type: str
    category: str
    progress: int
    total_questions: int
    session_data: Dict[str, Any]
    is_complete: bool = False
    example: Optional[str] = None

class QuestionResponse(BaseModel):
    session_id: str
    answer: str
    additional_context: Optional[str] = None
    session_data: Dict[str, Any]

router = APIRouter()

# 固定ユーザーID（認証無効化のため）
DEMO_USER_ID = 3

# セッションストレージ（簡易実装）
conversation_sessions = {}

def extract_number_from_text(text: str, default: Union[int, float] = 0) -> Union[int, float]:
    """
    日本語テキストから数値を抽出する
    """
    if not text or not isinstance(text, str):
        return default
    
    # 「万」「千」などの単位を先に処理
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
    
    # 通常の数値パターンを検索
    patterns = [
        r'[0-9０-９]+(?:[,，][0-9０-９]+)*(?:\.[0-9０-９]+)?',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            number_str = matches[0]
            trans_table = str.maketrans('０１２３４５６７８９，', '0123456789,')
            number_str = number_str.translate(trans_table)
            number_str = number_str.replace(',', '')
            
            try:
                if '.' in number_str:
                    return float(number_str)
                else:
                    return int(number_str)
            except ValueError:
                continue
    
    return default

# 詳細な質問フロー（元のconversation.pyから）
QUESTION_FLOW = {
    "vision_values": {
        "order": 1,
        "questions": [
            {
                "id": "ideal_lifestyle",
                "question": "今、どんな暮らしや働き方を目指してる？",
                "type": "text",
                "example": "例：子どもの送迎をしながら、週4稼働で月50万円。自分の好きな仕事だけで生計を立てたい。"
            },
            {
                "id": "core_values",
                "question": "その理想を叶えるために、普段どんなことを意識している？",
                "type": "text",
                "example": "例：相手目線で動く、夜遅くまで作業しない、毎朝スケジュール確認をする。"
            },
            {
                "id": "ideal_daily_life",
                "question": "「これが理想！」と思う未来の生活を具体的に教えて！",
                "type": "text",
                "example": "例：朝はカフェで仕事、午後はのんびり。週末は家族と公園、年1回は海外旅行。仕事はAI活用で効率化。"
            }
        ]
    },
    "monthly_goals": {
        "order": 2,
        "questions": [
            {
                "id": "monthly_goals",
                "question": "今月の「これを達成しよう！」と思ってた目標は何だった？",
                "type": "text",
                "example": "例：営業50件送信、案件3件納品、ポモ部屋100時間。"
            },
            {
                "id": "goal_achievement",
                "question": "その目標、どのくらい達成できた？できたこと・できなかったことは？",
                "type": "text",
                "example": "例：営業は30件、案件は2件納品できた。ポモ部屋は80時間で少し届かなかった。"
            }
        ]
    },
    "work_activities": {
        "order": 3,
        "questions": [
            {
                "id": "monthly_activities",
                "question": "今月どんなことをやった？具体的に教えて！（作業内容や件数、学びやイベント参加など）",
                "type": "text",
                "example": "例：LPコーディング2件納品、修正案件1件、営業30件、AIセミナー1回、ポモ部屋80時間。"
            },
            {
                "id": "project_details",
                "question": "案件で特に印象に残ったことは？",
                "type": "text",
                "example": "例：初めて外注を使わずにLPを5万円で納品できた。修正のやりとりが多くて大変だったが、最後までやりきった。"
            },
            {
                "id": "sales_activities",
                "question": "営業でやったこと、反応や成果はどうだった？",
                "type": "text",
                "example": "例：新規30件送信、返信は2件、面談は1件。既存クライアントから追加案件1件受注。"
            },
            {
                "id": "learning_highlights",
                "question": "今月の学びで「これ良かった！」と思うことは？",
                "type": "text",
                "example": "例：AIでの画像生成を試した。ポモ部屋で得た情報が次の案件に役立ちそうだった。"
            }
        ]
    },
    "time_management": {
        "order": 4,
        "questions": [
            {
                "id": "work_hours",
                "question": "今月の稼働時間はどれくらい？できれば内訳も教えて。",
                "type": "text",
                "example": "例：合計230時間。案件作業180時間、営業20時間、学び30時間。"
            },
            {
                "id": "monthly_income",
                "question": "今月の収入はどれくらい？どんな案件でいくら稼げた？",
                "type": "text",
                "example": "例：合計30万円。LP1件5万円、修正案件2万円、継続案件3万円、ディレクション業務20万円。"
            }
        ]
    },
    "life_balance": {
        "order": 5,
        "questions": [
            {
                "id": "life_changes",
                "question": "家庭や生活で何か変化や大きな出来事はあった？",
                "type": "text",
                "example": "例：子どもが発熱で2日休み。夫が出張でワンオペ多めだった。健康診断で再検査の連絡がきた。"
            },
            {
                "id": "life_balance",
                "question": "家族・仕事・自分の時間のバランスはどうだった？理想に近づけた？",
                "type": "text",
                "example": "例：案件作業が多くて家族時間が減った。まだ理想のバランスには遠いけど、朝の時間は確保できた。"
            },
            {
                "id": "roles_responsibilities",
                "question": "家族や仕事、コミュニティで「自分はこういう役割だったな」と思うことは？",
                "type": "text",
                "example": "例：家庭では送迎と夕食担当、仕事では案件管理と進捗確認、コミュニティでは相談役っぽい立ち位置。"
            }
        ]
    },
    "reflection": {
        "order": 6,
        "questions": [
            {
                "id": "challenges",
                "question": "今月「これは大変だった」「困ったな」と思ったことは？",
                "type": "text",
                "example": "例：営業を後回しにしてしまい動けなかった。子どもの送迎でスケジュールが崩れた。"
            },
            {
                "id": "discoveries",
                "question": "今月「これ気づいた！」とか「こうすればよかった！」と思ったことは？",
                "type": "text",
                "example": "例：タスクは翌日に持ち越さず、その日のうちに終わらせた方が楽だった。外注を使うと負担が減ると気づいた。"
            },
            {
                "id": "growth_points",
                "question": "今月「これできるようになった！」と思えた成長や変化は？",
                "type": "text",
                "example": "例：外注にタスクを振るのが前よりスムーズになった。コーディングのスピードが上がった。営業の文章作成が早くなった。"
            },
            {
                "id": "happy_moments",
                "question": "今月嬉しかったこと・自分を褒めたいと思ったことは？",
                "type": "text",
                "example": "例：初めて自力で5万円の案件を納品できた。夜作業を減らせた。子どもの行事に参加できた。"
            }
        ]
    },
    "next_month": {
        "order": 7,
        "questions": [
            {
                "id": "next_month_goals",
                "question": "来月の目標は何？どんなことに力を入れたい？",
                "type": "text",
                "example": "例：営業50件送信、案件3件納品、家庭時間を増やす、外注活用を1件以上試す。"
            },
            {
                "id": "things_to_stop",
                "question": "来月「これはもうやらない！」と決めたこと・やめたいことはある？",
                "type": "text",
                "example": "例：夜遅くまでの作業をやめたい。お客さんの要望を何でも聞きすぎない。無理して全部自分でやらない。"
            }
        ]
    }
}

@router.post("/start")
async def start_conversation(
    request: ConversationRequest,
    db: Session = Depends(get_db)
):
    """
    対話セッションを開始（認証無効版）
    """
    session_id = f"session_{datetime.now().timestamp()}"
    
    # 最初の質問を取得
    first_category = min(QUESTION_FLOW.keys(), key=lambda x: QUESTION_FLOW[x]["order"])
    first_question = QUESTION_FLOW[first_category]["questions"][0]
    
    session_data = {
        "session_id": session_id,
        "user_id": DEMO_USER_ID,
        "report_month": request.report_month,
        "current_category": first_category,
        "current_question_index": 0,
        "answers": {},
        "completed_categories": []
    }
    
    conversation_sessions[session_id] = session_data
    
    return ConversationResponse(
        session_id=session_id,
        question=first_question["question"],
        question_type=first_question["type"],
        category=first_category,
        progress=1,
        total_questions=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
        session_data=session_data,
        example=first_question.get("example", None),
        is_complete=False
    )

@router.post("/answer")
async def submit_answer(
    answer_data: QuestionResponse,
    db: Session = Depends(get_db)
):
    """
    回答を送信して次の質問を取得（認証無効版）
    """
    session_id = answer_data.session_id
    
    if session_id not in conversation_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="セッションが見つかりません"
        )
    
    session = conversation_sessions[session_id]
    current_category = session["current_category"]
    current_question_index = session["current_question_index"]
    
    # 現在の質問情報を取得
    current_questions = QUESTION_FLOW[current_category]["questions"]
    current_question = current_questions[current_question_index]
    
    # 回答を保存
    session["answers"][current_question["id"]] = {
        "answer": answer_data.answer,
        "additional_context": answer_data.additional_context
    }
    
    # 次の質問を決定
    next_question_index = current_question_index + 1
    
    # 現在のカテゴリに次の質問があるか確認
    if next_question_index < len(current_questions):
        next_question = current_questions[next_question_index]
        session["current_question_index"] = next_question_index
    else:
        # 現在のカテゴリが完了、次のカテゴリへ
        session["completed_categories"].append(current_category)
        
        # 次のカテゴリを見つける
        remaining_categories = [
            cat for cat in QUESTION_FLOW.keys() 
            if cat not in session["completed_categories"]
        ]
        
        if remaining_categories:
            next_category = min(remaining_categories, key=lambda x: QUESTION_FLOW[x]["order"])
            next_question = QUESTION_FLOW[next_category]["questions"][0]
            session["current_category"] = next_category
            session["current_question_index"] = 0
        else:
            # すべての質問が完了
            session["is_complete"] = True
            return ConversationResponse(
                session_id=session_id,
                question=None,
                question_type="completed",
                category="completed",
                progress=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
                total_questions=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
                session_data=session,
                is_complete=True
            )
    
    current_progress = len([
        q for cat in session["completed_categories"] 
        for q in QUESTION_FLOW[cat]["questions"]
    ]) + session["current_question_index"] + 1
    
    return ConversationResponse(
        session_id=session_id,
        question=next_question["question"],
        question_type=next_question["type"],
        category=session["current_category"],
        progress=current_progress,
        total_questions=sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
        session_data=session,
        example=next_question.get("example", None),
        is_complete=False
    )

@router.post("/generate-report")
async def generate_report(
    session_data: Dict[str, Any],
    db: Session = Depends(get_db),
    x_openai_api_key: Optional[str] = Header(None)
):
    """
    対話内容から月報を生成（認証無効版）
    """
    # セッションIDからセッションデータを取得
    if isinstance(session_data, dict) and "session_id" in session_data:
        session_id = session_data["session_id"]
        if session_id in conversation_sessions:
            session = conversation_sessions[session_id]
        else:
            session = session_data
    else:
        session = session_data
    
    answers = session.get("answers", {})
    
    # AI生成を試みる
    try:
        if x_openai_api_key or os.getenv("OPENAI_API_KEY"):
            import openai
            
            # OpenAI APIキーの設定
            openai.api_key = x_openai_api_key or os.getenv("OPENAI_API_KEY")
            
            # 質問と回答を整理してプロンプトを作成
            current_date = datetime.now()
            year_month = current_date.strftime("%Y年%m月")
            
            # 回答データを整理
            qa_text = ""
            
            # 1. ビジョン・価値観
            qa_text += "【目指しているゴール・理想の生活】\n"
            qa_text += f"理想の暮らし・働き方: {answers.get('ideal_lifestyle', {}).get('answer', '')}\n"
            qa_text += f"普段大事にしていること: {answers.get('core_values', {}).get('answer', '')}\n"
            qa_text += f"理想の未来像: {answers.get('ideal_daily_life', {}).get('answer', '')}\n\n"
            
            # 2. 目標と実績
            qa_text += "【今月の目標と実績】\n"
            qa_text += f"今月の目標: {answers.get('monthly_goals', {}).get('answer', '')}\n"
            qa_text += f"目標達成状況: {answers.get('goal_achievement', {}).get('answer', '')}\n\n"
            
            # 3. 業務内容
            qa_text += "【今月の業務内容・取り組み・学び】\n"
            qa_text += f"今月やったこと: {answers.get('monthly_activities', {}).get('answer', '')}\n"
            qa_text += f"案件で印象に残ったこと: {answers.get('project_details', {}).get('answer', '')}\n"
            qa_text += f"営業活動と反応: {answers.get('sales_activities', {}).get('answer', '')}\n"
            qa_text += f"学びで良かったこと: {answers.get('learning_highlights', {}).get('answer', '')}\n\n"
            
            # 4. 時間・収入
            qa_text += "【稼働時間・収入】\n"
            qa_text += f"稼働時間: {answers.get('work_hours', {}).get('answer', '')}\n"
            qa_text += f"収入: {answers.get('monthly_income', {}).get('answer', '')}\n\n"
            
            # 5. 生活バランス
            qa_text += "【今月の状況・家庭のこと】\n"
            qa_text += f"家庭や生活の変化: {answers.get('life_changes', {}).get('answer', '')}\n"
            qa_text += f"生活バランス: {answers.get('life_balance', {}).get('answer', '')}\n"
            qa_text += f"役割: {answers.get('roles_responsibilities', {}).get('answer', '')}\n\n"
            
            # 6. 振り返り
            qa_text += "【課題・改善点・気づき・成果】\n"
            qa_text += f"大変だったこと・困ったこと: {answers.get('challenges', {}).get('answer', '')}\n"
            qa_text += f"気づいたこと・改善点: {answers.get('discoveries', {}).get('answer', '')}\n"
            qa_text += f"成長したこと: {answers.get('growth_points', {}).get('answer', '')}\n"
            qa_text += f"嬉しかったこと: {answers.get('happy_moments', {}).get('answer', '')}\n\n"
            
            # 7. 来月
            qa_text += "【来月の目標・取り組み予定】\n"
            qa_text += f"来月の目標: {answers.get('next_month_goals', {}).get('answer', '')}\n"
            qa_text += f"やらないと決めたこと: {answers.get('things_to_stop', {}).get('answer', '')}\n"
            
            # AI生成プロンプト
            prompt = f"""
あなたは優秀な月報作成アシスタントです。以下の質問と回答から、読みやすく実用的な月報を生成してください。

## 回答データ:
{qa_text}

## 出力要件:
- 文字数: 2000-3000文字
- 形式: Markdown
- 語調: 丁寧で親しみやすい
- 構成: 実績、気づき、改善点、来月の取り組みを含む

## 出力フォーマット:

# {year_month} 月報

お疲れ様です。{year_month}の月報をお送りします。

## 📊 今月の実績概要

| 項目 | 実績 | 備考 |
|------|------|------|
| 稼働時間 | XX時間 | 案件作業/営業/学習の内訳 |
| 収入 | XX万円 | 前月比・目標達成率 |
| 営業活動 | XX件 | 送信/返信/面談の数 |

## 🎯 目標達成状況

**今月の目標:** [月初の目標を記載]

**達成状況:** [具体的な達成度と感想を記載]

## 💼 業務内容・取り組み

### 主な案件・プロジェクト
- [具体的な業務内容と成果]

### 営業・マーケティング活動
- [営業活動の詳細と反応]

### 学習・スキルアップ
- [新しく学んだこと、習得したスキル]

## 🏠 生活・家庭の状況

[家庭や生活での変化、バランスについて具体的に記載]

## 💡 今月の気づき・学び

### 良かったこと・成長ポイント
- [具体的な成果や成長を箇条書きで]

### 課題・改善点
- [困ったことや改善が必要な点]
- [具体的な改善策も含める]

## 🚀 来月の目標・計画

### 重点取り組み項目
- [来月注力したいこと]

### 新しく始めること
- [新規の取り組みや挑戦]

### やめること・減らすこと
- [効率化のためにやめる/減らすこと]

---

以上、{year_month}の活動報告でした。来月もよろしくお願いいたします！

この条件で、回答データをもとに2000-3000文字の読みやすい月報を作成してください。数字は具体的に、感情や体験も含めて人間味のある内容にしてください。
"""
            
            # OpenAI APIを呼び出し
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "あなたは優秀な月報作成アシスタントです。与えられた情報をもとに、2000-3000文字の読みやすく質の高い月報を作成してください。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000,
                temperature=0.7
            )
            
            ai_generated_report = response.choices[0].message.content
        else:
            # AIキーがない場合はフォールバック
            ai_generated_report = await generate_fallback_report(answers)
            
    except Exception as e:
        print(f"AI生成エラー: {e}")
        ai_generated_report = await generate_fallback_report(answers)
    
    # 数値データの抽出
    work_hours_text = answers.get("work_hours", {}).get("answer", "")
    total_hours = extract_number_from_text(work_hours_text, default=160.0)
    
    income_text = answers.get("monthly_income", {}).get("answer", "")
    received_amount = 0.0
    for match in re.findall(r'(\d+(?:\.\d+)?)\s*万円', income_text):
        received_amount += float(match) * 10000
    if received_amount == 0:
        received_amount = extract_number_from_text(income_text, default=350000.0)
    
    sales_text = answers.get("sales_activities", {}).get("answer", "")
    sales_nums = re.findall(r'\d+', sales_text)
    sales_emails = int(sales_nums[0]) if len(sales_nums) > 0 else 40
    sales_replies = int(sales_nums[1]) if len(sales_nums) > 1 else 0
    sales_meetings = int(sales_nums[2]) if len(sales_nums) > 2 else 0
    
    # 既存の月報チェック
    existing_report = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == DEMO_USER_ID,
        MonthlyReport.report_month == session.get("report_month", datetime.now().strftime("%Y-%m"))
    ).first()
    
    report_data = {
        "user_id": DEMO_USER_ID,
        "report_month": session.get("report_month", datetime.now().strftime("%Y-%m")),
        "current_phase": answers.get("ideal_lifestyle", {}).get("answer", ""),
        "family_status": answers.get("life_changes", {}).get("answer", ""),
        "total_work_hours": total_hours,
        "coding_hours": 0.0,
        "meeting_hours": 0.0,
        "sales_hours": 0.0,
        "sales_emails_sent": sales_emails,
        "sales_replies": sales_replies,
        "sales_meetings": sales_meetings,
        "contracts_signed": 0,
        "received_amount": received_amount,
        "delivered_amount": received_amount,
        "good_points": ai_generated_report,
        "challenges": answers.get("challenges", {}).get("answer", ""),
        "improvements": "",
        "next_month_goals": answers.get("next_month_goals", {}).get("answer", "")
    }
    
    if existing_report:
        # 既存の月報を更新
        for field, value in report_data.items():
            if field != "user_id" and hasattr(existing_report, field):
                setattr(existing_report, field, value)
        
        db.commit()
        db.refresh(existing_report)
        
        # セッション削除
        if session_id in conversation_sessions:
            del conversation_sessions[session_id]
        
        return {
            "message": "月報が更新されました",
            "report_id": existing_report.id,
            "report_month": existing_report.report_month,
            "ai_generated_content": ai_generated_report
        }
    else:
        # 新規月報作成
        new_report = MonthlyReport(**report_data)
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        
        # セッション削除
        if session_id in conversation_sessions:
            del conversation_sessions[session_id]
        
        return {
            "message": "月報が作成されました",
            "report_id": new_report.id,
            "report_month": new_report.report_month,
            "ai_generated_content": ai_generated_report
        }

async def generate_fallback_report(answers: Dict[str, Any]) -> str:
    """
    フォールバック月報生成（AIキーがない場合）
    """
    current_date = datetime.now()
    year_month = current_date.strftime("%Y年%m月")
    
    # 数値データの抽出
    work_hours_text = answers.get("work_hours", {}).get("answer", "")
    total_hours = extract_number_from_text(work_hours_text, default=160.0)
    
    income_text = answers.get("monthly_income", {}).get("answer", "")
    received_amount = 0.0
    for match in re.findall(r'(\d+(?:\.\d+)?)\s*万円', income_text):
        received_amount += float(match) * 10000
    if received_amount == 0:
        received_amount = extract_number_from_text(income_text, default=350000.0)
    
    sales_text = answers.get("sales_activities", {}).get("answer", "")
    sales_nums = re.findall(r'\d+', sales_text)
    sales_emails = int(sales_nums[0]) if len(sales_nums) > 0 else 40
    
    return f"""# {year_month} 月報

お疲れ様です。{year_month}の月報をお送りします。

## 📊 今月の実績概要

| 項目 | 実績 | 備考 |
|------|------|------|
| 稼働時間 | {total_hours}時間 | 案件作業中心の活動 |
| 収入 | {received_amount/10000:.0f}万円 | 目標に向けた着実な進歩 |
| 営業活動 | {sales_emails}件 | 新規開拓への取り組み |

## 🎯 目標達成状況

**今月の目標:** {answers.get('monthly_goals', {}).get('answer', '目標設定なし')}

**達成状況:** {answers.get('goal_achievement', {}).get('answer', '詳細な振り返りを実施中')}

## 💼 業務内容・取り組み

### 主な案件・プロジェクト
{answers.get('monthly_activities', {}).get('answer', '継続的な業務改善に取り組んでいます')}

### 営業・マーケティング活動
{answers.get('sales_activities', {}).get('answer', '営業活動を継続的に実施')}

### 学習・スキルアップ
{answers.get('learning_highlights', {}).get('answer', '新しい技術や手法の学習を継続')}

## 🏠 生活・家庭の状況

{answers.get('life_changes', {}).get('answer', '家庭と仕事のバランスを大切に過ごしています')}

生活バランス: {answers.get('life_balance', {}).get('answer', '適切なワークライフバランスを心がけています')}

## 💡 今月の気づき・学び

### 良かったこと・成長ポイント
- {answers.get('growth_points', {}).get('answer', '継続的な成長を実感')}
- {answers.get('happy_moments', {}).get('answer', '充実した時間を過ごすことができました')}

### 課題・改善点
- {answers.get('challenges', {}).get('answer', '今月の課題を整理中')}
- {answers.get('discoveries', {}).get('answer', '新たな発見と改善策を模索中')}

## 🚀 来月の目標・計画

### 重点取り組み項目
- {answers.get('next_month_goals', {}).get('answer', '来月の目標を具体的に設定予定')}

### やめること・減らすこと
- {answers.get('things_to_stop', {}).get('answer', '効率化のための見直しを継続')}

---

以上、{year_month}の活動報告でした。来月もよろしくお願いいたします！
"""

@router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """
    セッション情報を取得（認証無効版）
    """
    if session_id not in conversation_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="セッションが見つかりません"
        )
    
    session = conversation_sessions[session_id]
    
    return {
        "session_id": session_id,
        "progress": len([
            q for cat in session["completed_categories"] 
            for q in QUESTION_FLOW[cat]["questions"]
        ]) + session["current_question_index"],
        "total_questions": sum(len(cat["questions"]) for cat in QUESTION_FLOW.values()),
        "answers": session["answers"],
        "is_complete": session.get("is_complete", False)
    }