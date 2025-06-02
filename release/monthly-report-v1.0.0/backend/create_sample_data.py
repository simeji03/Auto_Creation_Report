#!/usr/bin/env python3
"""
サンプルデータを作成するスクリプト
"""
import os
import sys
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import User, MonthlyReport
from auth import get_password_hash

# データベース接続
DATABASE_URL = "sqlite:///./monthly_reports.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_sample_reports():
    """サンプル月報データを作成"""
    db = SessionLocal()
    
    try:
        # デモユーザーを取得
        demo_user = db.query(User).filter(User.email == "demo@test.com").first()
        
        if not demo_user:
            print("❌ デモユーザーが見つかりません")
            return
        
        # 既存のサンプルデータをチェック
        existing_reports = db.query(MonthlyReport).filter(
            MonthlyReport.user_id == demo_user.id
        ).count()
        
        if existing_reports > 0:
            print(f"✅ 既に {existing_reports} 件の月報データが存在します")
            return
        
        # サンプル月報データ
        sample_reports = [
            {
                "report_month": "2024-10",
                "current_phase": "成長期",
                "total_work_hours": 165,
                "coding_hours": 90,
                "meeting_hours": 25,
                "sales_emails_sent": 45,
                "sales_replies": 12,
                "sales_meetings": 6,
                "received_amount": 650000,
                "good_points": "新しいプロジェクトを獲得し、技術スキルが向上した",
                "challenges": "時間管理の最適化が必要",
                "next_month_goals": "新規クライアントとの関係構築"
            },
            {
                "report_month": "2024-11",
                "current_phase": "成長期",
                "total_work_hours": 158,
                "coding_hours": 85,
                "meeting_hours": 30,
                "sales_emails_sent": 52,
                "sales_replies": 15,
                "sales_meetings": 8,
                "received_amount": 720000,
                "good_points": "クライアントからの評価が向上し、継続案件を獲得",
                "challenges": "営業活動の効率化が課題",
                "next_month_goals": "プロジェクトの品質向上と新技術の習得"
            },
            {
                "report_month": "2024-12",
                "current_phase": "安定期",
                "total_work_hours": 152,
                "coding_hours": 95,
                "meeting_hours": 22,
                "sales_emails_sent": 38,
                "sales_replies": 18,
                "sales_meetings": 5,
                "received_amount": 850000,
                "good_points": "年末の繁忙期を乗り切り、収入が大幅に向上",
                "challenges": "ワークライフバランスの調整",
                "next_month_goals": "来年の事業計画策定"
            },
            {
                "report_month": "2025-01",
                "current_phase": "安定期",
                "total_work_hours": 148,
                "coding_hours": 88,
                "meeting_hours": 28,
                "sales_emails_sent": 42,
                "sales_replies": 14,
                "sales_meetings": 7,
                "received_amount": 780000,
                "good_points": "新年から順調なスタートを切れた",
                "challenges": "新しい技術トレンドへの対応",
                "next_month_goals": "スキルアップと業務効率化"
            }
        ]
        
        # サンプルデータを作成
        for report_data in sample_reports:
            new_report = MonthlyReport(
                user_id=demo_user.id,
                **report_data
            )
            db.add(new_report)
        
        db.commit()
        print(f"✅ {len(sample_reports)} 件のサンプル月報データを作成しました！")
        
        # 作成されたデータの概要を表示
        total_hours = sum(r["total_work_hours"] for r in sample_reports)
        total_income = sum(r["received_amount"] for r in sample_reports)
        print(f"   総稼働時間: {total_hours:,} 時間")
        print(f"   総収入: ¥{total_income:,}")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== サンプルデータ作成スクリプト ===")
    create_sample_reports()
    print("\nダッシュボードでデータを確認できます: http://localhost:3456/")