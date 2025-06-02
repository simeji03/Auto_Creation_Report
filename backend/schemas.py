"""
Pydanticスキーマ定義
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# ユーザー関連スキーマ
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# 認証関連スキーマ
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    password: str = Field(..., min_length=1)

# Alias for compatibility
UserLogin = LoginRequest

# 月報関連スキーマ
class MonthlyReportBase(BaseModel):
    report_month: str = Field(..., pattern=r'^\d{4}-\d{2}$')
    current_phase: Optional[str] = Field(None, max_length=200)
    family_status: Optional[str] = Field(None, max_length=200)

    # 稼働時間データ
    total_work_hours: float = Field(0.0, ge=0)
    coding_hours: float = Field(0.0, ge=0)
    meeting_hours: float = Field(0.0, ge=0)
    sales_hours: float = Field(0.0, ge=0)

    # 営業結果
    sales_emails_sent: int = Field(0, ge=0)
    sales_replies: int = Field(0, ge=0)
    sales_meetings: int = Field(0, ge=0)
    contracts_signed: int = Field(0, ge=0)

    # 収入データ
    received_amount: float = Field(0.0, ge=0)
    delivered_amount: float = Field(0.0, ge=0)

    # 定性データ
    good_points: Optional[str] = None
    challenges: Optional[str] = None
    improvements: Optional[str] = None
    next_month_goals: Optional[str] = None

    @field_validator('total_work_hours')
    @classmethod
    def validate_total_work_hours(cls, v, info):
        """総稼働時間が個別の時間の合計と一致するかチェック"""
        coding = info.data.get('coding_hours', 0)
        meeting = info.data.get('meeting_hours', 0)
        sales = info.data.get('sales_hours', 0)
        calculated_total = coding + meeting + sales

        if abs(v - calculated_total) > 0.1:  # 小数点誤差を考慮
            return calculated_total
        return v

class MonthlyReportCreate(MonthlyReportBase):
    pass

class MonthlyReportUpdate(BaseModel):
    current_phase: Optional[str] = Field(None, max_length=200)
    family_status: Optional[str] = Field(None, max_length=200)
    total_work_hours: Optional[float] = Field(None, ge=0)
    coding_hours: Optional[float] = Field(None, ge=0)
    meeting_hours: Optional[float] = Field(None, ge=0)
    sales_hours: Optional[float] = Field(None, ge=0)
    sales_emails_sent: Optional[int] = Field(None, ge=0)
    sales_replies: Optional[int] = Field(None, ge=0)
    sales_meetings: Optional[int] = Field(None, ge=0)
    contracts_signed: Optional[int] = Field(None, ge=0)
    received_amount: Optional[float] = Field(None, ge=0)
    delivered_amount: Optional[float] = Field(None, ge=0)
    good_points: Optional[str] = None
    challenges: Optional[str] = None
    improvements: Optional[str] = None
    next_month_goals: Optional[str] = None

class MonthlyReport(MonthlyReportBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# 作業時間詳細スキーマ
class WorkTimeDetailBase(BaseModel):
    task_name: str = Field(..., min_length=1, max_length=200)
    hours: float = Field(..., gt=0)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    work_date: date

class WorkTimeDetailCreate(WorkTimeDetailBase):
    report_id: int

class WorkTimeDetailUpdate(BaseModel):
    task_name: Optional[str] = Field(None, min_length=1, max_length=200)
    hours: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    work_date: Optional[date] = None

class WorkTimeDetail(WorkTimeDetailBase):
    id: int
    report_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# プロジェクト関連スキーマ
class ProjectBase(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=200)
    client_type: Optional[str] = Field(None, max_length=100)
    project_amount: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field("進行中", max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = Field(None, min_length=1, max_length=200)
    client_type: Optional[str] = Field(None, max_length=100)
    project_amount: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=50)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

class Project(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# AI支援関連スキーマ
class AIAnalysisRequest(BaseModel):
    report_data: Dict[str, Any]
    analysis_type: str = Field(..., pattern=r'^(reflection|improvement|goals)$')

class AIAnalysisResponse(BaseModel):
    analysis_type: str
    suggestions: List[str]
    summary: str

# レポートテンプレート関連スキーマ
class ReportTemplateBase(BaseModel):
    template_name: str = Field(..., min_length=1, max_length=100)
    template_content: Dict[str, Any]
    is_default: bool = False

class ReportTemplateCreate(ReportTemplateBase):
    pass

class ReportTemplateUpdate(BaseModel):
    template_name: Optional[str] = Field(None, min_length=1, max_length=100)
    template_content: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None

class ReportTemplate(ReportTemplateBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# レスポンス用統一スキーマ
class ResponseMessage(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# ページネーション用スキーマ
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(10, ge=1, le=100)

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int

# 対話型月報関連スキーマ
class ConversationSession(BaseModel):
    user_id: int
    current_category: str = ""
    current_question_index: int = 0
    answers: Dict[str, Any] = {}
    completed_categories: List[str] = []

class ConversationResponse(BaseModel):
    session_id: str
    question: Optional[str] = None
    question_type: str
    category: str
    progress: int
    total_questions: int
    session_data: ConversationSession
    is_complete: bool = False
    example: Optional[str] = None

class ConversationAnswerRequest(BaseModel):
    session_id: str
    answer: str
    session_data: ConversationSession

class QuestionResponse(BaseModel):
    question: str
    type: str
    example: Optional[str] = None
    page: int
    size: int
    pages: int

    @field_validator('pages')
    @classmethod
    def calculate_pages(cls, v, info):
        total = info.data.get('total', 0)
        size = info.data.get('size', 10)
        return (total + size - 1) // size if total > 0 else 0

# 統計情報スキーマ
class MonthlyStats(BaseModel):
    month: str
    total_hours: float
    total_income: float
    projects_count: int
    efficiency_score: float

class UserStats(BaseModel):
    total_reports: int
    total_hours: float
    total_income: float
    average_monthly_hours: float
    recent_months: List[MonthlyStats]

# ファイルアップロード関連スキーマ
class FileUploadResponse(BaseModel):
    filename: str
    file_path: str

# AI分析関連スキーマ
class AIAnalysisRequest(BaseModel):
    report_data: Dict[str, Any]
    analysis_type: str = Field(..., pattern="^(reflection|improvement|goals)$")

class AIAnalysisResponse(BaseModel):
    analysis_type: str
    suggestions: List[str]
    summary: str

class AISuggestionRequest(BaseModel):
    type: str = Field(..., pattern="^(reflection|improvement|goals)$")
    context: Dict[str, Any]

# Additional schemas for compatibility
UserResponse = User
MonthlyReportResponse = MonthlyReport
MonthlyReportSummary = MonthlyReport

class PDFGenerateRequest(BaseModel):
    template_type: str = "default"

# 対話型月報生成関連スキーマ
class ConversationSession(BaseModel):
    user_id: int
    current_category: str
    current_question_index: int
    answers: Dict[str, Any]
    completed_categories: List[str]

class QuestionResponse(BaseModel):
    session_id: str
    answer: str
    additional_context: Optional[str] = None
    session_data: Dict[str, Any]

class ConversationResponse(BaseModel):
    session_id: str
    question: Optional[str]
    question_type: str
    category: str
    progress: int
    total_questions: int
    session_data: Dict[str, Any]
    is_complete: bool = False
    example: Optional[str] = None