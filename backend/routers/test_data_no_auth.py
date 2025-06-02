"""
テストデータ生成API - 認証無効版
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db, MonthlyReport
from schemas import MonthlyReportCreate

router = APIRouter()

# 固定ユーザーID（認証無効化のため）
DEMO_USER_ID = 3

@router.post("/generate-test-report")
async def generate_test_report(
    db: Session = Depends(get_db)
):
    """
    テストデータで月報を即座に作成（認証無効版）
    """
    current_month = datetime.now().strftime("%Y-%m")
    
    # 既存の月報チェック
    existing_report = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == DEMO_USER_ID,
        MonthlyReport.report_month == current_month
    ).first()
    
    if existing_report:
        # 既存の月報を更新
        existing_report.total_work_hours = 160.0
        existing_report.coding_hours = 120.0
        existing_report.sales_emails_sent = 50
        existing_report.sales_replies = 15
        existing_report.sales_meetings = 8
        existing_report.received_amount = 750000.0
        existing_report.good_points = "新しい技術の習得ができた。効率的な開発手法を身につけた。"
        existing_report.challenges = "時間管理に苦労した。新しいフレームワークの学習に時間がかかった。"
        existing_report.next_month_goals = "より効率的なコーディングを心がける。営業活動を強化する。"
        
        db.commit()
        db.refresh(existing_report)
        
        return {
            "message": "テストデータで月報が更新されました",
            "report_id": existing_report.id,
            "report_month": existing_report.report_month
        }
    else:
        # 新規月報作成
        report_data = MonthlyReportCreate(
            report_month=current_month,
            total_work_hours=160.0,
            coding_hours=120.0,
            sales_emails_sent=50,
            sales_replies=15,
            sales_meetings=8,
            received_amount=750000.0,
            good_points="新しい技術の習得ができた。効率的な開発手法を身につけた。",
            challenges="時間管理に苦労した。新しいフレームワークの学習に時間がかかった。",
            next_month_goals="より効率的なコーディングを心がける。営業活動を強化する。"
        )
        
        new_report = MonthlyReport(
            user_id=DEMO_USER_ID,
            **report_data.model_dump()
        )
        
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        
        return {
            "message": "テストデータで月報が作成されました",
            "report_id": new_report.id,
            "report_month": new_report.report_month
        }