"""
データベース設定とモデル定義
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

# データベースURL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./monthly_reports.db")

# SQLiteの場合のエンジン設定
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

# セッションファクトリの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラス
Base = declarative_base()

# ユーザーモデル
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # リレーション
    monthly_reports = relationship("MonthlyReport", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")

# 月報モデル
class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_month = Column(String(7), nullable=False, index=True)  # YYYY-MM形式

    # 基本情報
    current_phase = Column(String(200))
    family_status = Column(String(200))

    # 定量データ
    total_work_hours = Column(Float, default=0.0)
    coding_hours = Column(Float, default=0.0)
    meeting_hours = Column(Float, default=0.0)
    sales_hours = Column(Float, default=0.0)

    # 営業結果
    sales_emails_sent = Column(Integer, default=0)
    sales_replies = Column(Integer, default=0)
    sales_meetings = Column(Integer, default=0)
    contracts_signed = Column(Integer, default=0)

    # 収入データ
    received_amount = Column(Float, default=0.0)
    delivered_amount = Column(Float, default=0.0)

    # 定性データ
    good_points = Column(Text)
    challenges = Column(Text)
    improvements = Column(Text)
    next_month_goals = Column(Text)

    # タイムスタンプ
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # リレーション
    user = relationship("User", back_populates="monthly_reports")
    work_time_details = relationship("WorkTimeDetail", back_populates="report", cascade="all, delete-orphan")

    # ユニーク制約（ユーザーごとに月報は1つ）
    __table_args__ = ({"sqlite_autoincrement": True},)

# 作業時間詳細モデル
class WorkTimeDetail(Base):
    __tablename__ = "work_time_details"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("monthly_reports.id"), nullable=False)
    task_name = Column(String(200), nullable=False)
    hours = Column(Float, nullable=False)
    category = Column(String(100))
    description = Column(Text)
    work_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # リレーション
    report = relationship("MonthlyReport", back_populates="work_time_details")

# プロジェクトモデル
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_name = Column(String(200), nullable=False)
    client_type = Column(String(100))
    project_amount = Column(Float)
    status = Column(String(50), default="進行中")
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # リレーション
    user = relationship("User", back_populates="projects")

# レポートテンプレートモデル
class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_name = Column(String(100), nullable=False)
    template_content = Column(Text, nullable=False)  # JSON文字列として保存
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# データベーステーブルの作成
def create_tables():
    """データベーステーブルを作成"""
    Base.metadata.create_all(bind=engine)

# データベースセッションの依存性注入
def get_db():
    """データベースセッションを取得"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()