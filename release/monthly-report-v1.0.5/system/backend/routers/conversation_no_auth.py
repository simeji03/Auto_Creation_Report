"""
対話型月報生成 - 認証無効版
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import json
import os
from datetime import datetime

from database import get_db, MonthlyReport
from schemas import MonthlyReportCreate
from pydantic import BaseModel
from typing import Dict, Any, Optional

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

router = APIRouter()

# 固定ユーザーID（認証無効化のため）
DEMO_USER_ID = 3

# セッションストレージ（簡易実装）
conversation_sessions = {}

# 対話質問のテンプレート
CONVERSATION_QUESTIONS = [
    {
        "question": "今月の総稼働時間を教えてください。",
        "field": "total_work_hours",
        "type": "number",
        "category": "基本情報",
        "example": "例: 160時間"
    },
    {
        "question": "今月のコーディング時間を教えてください。",
        "field": "coding_hours", 
        "type": "number",
        "category": "基本情報",
        "example": "例: 120時間"
    },
    {
        "question": "今月の営業メール送信数を教えてください。",
        "field": "sales_emails_sent",
        "type": "number", 
        "category": "営業活動",
        "example": "例: 50件"
    },
    {
        "question": "今月の営業メール返信数を教えてください。",
        "field": "sales_replies",
        "type": "number",
        "category": "営業活動", 
        "example": "例: 15件"
    },
    {
        "question": "今月の営業面談数を教えてください。",
        "field": "sales_meetings",
        "type": "number",
        "category": "営業活動",
        "example": "例: 8件"
    },
    {
        "question": "今月の受領金額を教えてください（円）。",
        "field": "received_amount",
        "type": "number",
        "category": "収入",
        "example": "例: 500000円"
    },
    {
        "question": "今月良かった点を教えてください。",
        "field": "good_points",
        "type": "text",
        "category": "振り返り",
        "example": "例: 新しい技術の習得ができた、効率的な開発手法を身につけた"
    },
    {
        "question": "今月の課題や困ったことを教えてください。",
        "field": "challenges",
        "type": "text", 
        "category": "振り返り",
        "example": "例: 時間管理に苦労した、新しいフレームワークの学習に時間がかかった"
    },
    {
        "question": "来月の目標を教えてください。",
        "field": "next_month_goals",
        "type": "text",
        "category": "目標設定",
        "example": "例: より効率的なコーディングを心がける、営業活動を強化する"
    }
]

@router.post("/start")
async def start_conversation(
    request: ConversationRequest,
    db: Session = Depends(get_db)
):
    """
    対話セッションを開始（認証無効版）
    """
    session_id = f"session_{datetime.now().timestamp()}"
    
    session_data = {
        "session_id": session_id,
        "user_id": DEMO_USER_ID,
        "report_month": request.report_month,
        "questions": CONVERSATION_QUESTIONS.copy(),
        "current_question_index": 0,
        "answers": {},
        "is_complete": False
    }
    
    conversation_sessions[session_id] = session_data
    
    first_question = CONVERSATION_QUESTIONS[0]
    
    return ConversationResponse(
        session_id=session_id,
        question=first_question["question"],
        question_type=first_question["type"],
        category=first_question["category"],
        progress=1,
        total_questions=len(CONVERSATION_QUESTIONS),
        session_data=session_data,
        example=first_question.get("example"),
        is_complete=False
    )

@router.post("/answer")
async def submit_answer(
    session_id: str,
    answer: str,
    db: Session = Depends(get_db)
):
    """
    回答を送信して次の質問を取得（認証無効版）
    """
    if session_id not in conversation_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="セッションが見つかりません"
        )
    
    session = conversation_sessions[session_id]
    current_index = session["current_question_index"]
    current_question = session["questions"][current_index]
    
    # 回答を保存
    field_name = current_question["field"]
    
    # 数値型の場合は変換を試行
    if current_question["type"] == "number":
        try:
            # 数字以外の文字を除去して数値変換
            numeric_value = float(''.join(filter(str.isdigit, answer.replace('.', ''))))
            session["answers"][field_name] = numeric_value
        except (ValueError, TypeError):
            session["answers"][field_name] = 0
    else:
        session["answers"][field_name] = answer
    
    # 次の質問へ
    session["current_question_index"] += 1
    
    # 全質問完了チェック
    if session["current_question_index"] >= len(session["questions"]):
        session["is_complete"] = True
        return ConversationResponse(
            session_id=session_id,
            question=None,
            question_type="complete",
            category="完了",
            progress=len(session["questions"]),
            total_questions=len(session["questions"]),
            session_data=session,
            is_complete=True
        )
    
    # 次の質問を返す
    next_question = session["questions"][session["current_question_index"]]
    
    return ConversationResponse(
        session_id=session_id,
        question=next_question["question"],
        question_type=next_question["type"],
        category=next_question["category"],
        progress=session["current_question_index"] + 1,
        total_questions=len(session["questions"]),
        session_data=session,
        example=next_question.get("example"),
        is_complete=False
    )

@router.post("/generate-report")
async def generate_report(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    対話内容から月報を生成（認証無効版）
    """
    if session_id not in conversation_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="セッションが見つかりません"
        )
    
    session = conversation_sessions[session_id]
    
    if not session["is_complete"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="対話が完了していません"
        )
    
    # 既存の月報チェック
    existing_report = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == DEMO_USER_ID,
        MonthlyReport.report_month == session["report_month"]
    ).first()
    
    if existing_report:
        # 既存の月報を更新
        for field, value in session["answers"].items():
            if hasattr(existing_report, field):
                setattr(existing_report, field, value)
        
        db.commit()
        db.refresh(existing_report)
        
        # セッション削除
        del conversation_sessions[session_id]
        
        return {
            "message": "月報が更新されました",
            "report_id": existing_report.id,
            "report_month": existing_report.report_month
        }
    else:
        # 新規月報作成
        report_data = MonthlyReportCreate(
            report_month=session["report_month"],
            **session["answers"]
        )
        
        new_report = MonthlyReport(
            user_id=DEMO_USER_ID,
            **report_data.model_dump()
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        
        # セッション削除
        del conversation_sessions[session_id]
        
        return {
            "message": "月報が作成されました",
            "report_id": new_report.id,
            "report_month": new_report.report_month
        }

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
        "progress": session["current_question_index"],
        "total_questions": len(session["questions"]),
        "answers": session["answers"],
        "is_complete": session["is_complete"]
    }