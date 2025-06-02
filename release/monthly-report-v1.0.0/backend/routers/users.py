"""
ユーザー関連のAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database import get_db, User, MonthlyReport
from schemas import UserResponse, UserStats, MonthlyStats
from auth import get_current_active_user

router = APIRouter()

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    ユーザープロフィールを取得
    """
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ユーザープロフィールを更新
    """
    current_user.name = name
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/account")
async def delete_user_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ユーザーアカウントを削除
    """
    # ソフトデリート（非アクティブ化）
    current_user.is_active = False
    db.commit()

    return {"message": "アカウントが削除されました"}

@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ユーザーの統計情報を取得
    """
    # 総月報数
    total_reports = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == current_user.id
    ).count()
    
    # 総稼働時間と総収入
    stats = db.query(
        func.sum(MonthlyReport.total_work_hours).label('total_hours'),
        func.sum(MonthlyReport.received_amount).label('total_income')
    ).filter(
        MonthlyReport.user_id == current_user.id
    ).first()
    
    total_hours = float(stats.total_hours) if stats.total_hours else 0.0
    total_income = float(stats.total_income) if stats.total_income else 0.0
    
    # 平均月間稼働時間
    average_monthly_hours = total_hours / total_reports if total_reports > 0 else 0.0
    
    # 最近6ヶ月の統計
    six_months_ago = datetime.now() - timedelta(days=180)
    recent_reports = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == current_user.id,
        MonthlyReport.created_at >= six_months_ago
    ).order_by(MonthlyReport.report_month.desc()).limit(6).all()
    
    recent_months = []
    for report in recent_reports:
        efficiency_score = (report.received_amount / report.total_work_hours) if report.total_work_hours > 0 else 0
        recent_months.append(MonthlyStats(
            month=report.report_month,
            total_hours=report.total_work_hours,
            total_income=report.received_amount,
            projects_count=1,  # 簡略化
            efficiency_score=efficiency_score
        ))
    
    return UserStats(
        total_reports=total_reports,
        total_hours=total_hours,
        total_income=total_income,
        average_monthly_hours=average_monthly_hours,
        recent_months=recent_months
    )