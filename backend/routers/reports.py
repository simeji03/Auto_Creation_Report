"""
月報関連のAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
import io

from database import get_db, User, MonthlyReport, WorkTimeDetail, Project
from schemas import (
    MonthlyReportCreate, MonthlyReportUpdate, MonthlyReportResponse,
    MonthlyReportSummary, PDFGenerateRequest
)
from auth import get_current_active_user
from pdf_generator import generate_report_pdf

router = APIRouter()

@router.post("/", response_model=MonthlyReportResponse, status_code=status.HTTP_201_CREATED)
async def create_monthly_report(
    report_data: MonthlyReportCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    新しい月報を作成
    """
    # 同じ月の月報が既に存在するかチェック
    existing_report = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == current_user.id,
        MonthlyReport.report_month == report_data.report_month
    ).first()

    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{report_data.report_month}の月報は既に存在します"
        )

    # 月報作成
    new_report = MonthlyReport(
        user_id=current_user.id,
        **report_data.model_dump(exclude={"work_time_details", "projects"})
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 作業時間詳細を追加（もし存在する場合）
    if hasattr(report_data, 'work_time_details') and report_data.work_time_details:
        for detail in report_data.work_time_details:
            work_detail = WorkTimeDetail(
                report_id=new_report.id,
                **detail.model_dump()
            )
            db.add(work_detail)

    # プロジェクトを追加（もし存在する場合）
    if hasattr(report_data, 'projects') and report_data.projects:
        for project in report_data.projects:
            project_record = Project(
                user_id=current_user.id,  # user_idを使用
                **project.model_dump()
            )
            db.add(project_record)

    db.commit()
    db.refresh(new_report)

    return new_report

@router.get("/", response_model=List[MonthlyReportSummary])
async def get_user_reports(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """
    ユーザーの月報一覧を取得
    """
    reports = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == current_user.id
    ).order_by(MonthlyReport.report_month.desc()).offset(skip).limit(limit).all()

    return reports

@router.get("/{report_id}", response_model=MonthlyReportResponse)
async def get_monthly_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    指定した月報の詳細を取得
    """
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    return report

@router.put("/{report_id}", response_model=MonthlyReportResponse)
async def update_monthly_report(
    report_id: int,
    update_data: MonthlyReportUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    月報を更新
    """
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    # 更新データを適用
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(report, field, value)

    db.commit()
    db.refresh(report)

    return report

@router.delete("/{report_id}")
async def delete_monthly_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    月報を削除
    """
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    # 関連データも削除
    db.query(WorkTimeDetail).filter(WorkTimeDetail.report_id == report_id).delete()
    # Note: Projects are associated with users, not reports
    # db.query(Project).filter(Project.report_id == report_id).delete()  # This line is commented out as Project doesn't have report_id
    db.delete(report)
    db.commit()

    return {"message": "月報が削除されました"}

@router.get("/{report_id}/work-details")
async def get_work_time_details(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    作業時間詳細を取得
    """
    # 月報の所有者確認
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    details = db.query(WorkTimeDetail).filter(
        WorkTimeDetail.report_id == report_id
    ).all()

    return details

@router.get("/{report_id}/projects")
async def get_projects(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    プロジェクト一覧を取得
    """
    # 月報の所有者確認
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    # Note: Projects are associated with users, not reports
    # This query needs to be adjusted based on your actual data model
    projects = []  # Placeholder - adjust based on actual relationships

    return projects

@router.post("/{report_id}/pdf")
async def generate_pdf(
    report_id: int,
    pdf_request: PDFGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    月報のPDFを生成
    """
    # 月報の所有者確認
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    # 関連データを取得
    work_details = db.query(WorkTimeDetail).filter(
        WorkTimeDetail.report_id == report_id
    ).all()

    # Note: Projects are associated with users, not reports
    # This query needs to be adjusted based on your actual data model
    projects = []  # Placeholder - adjust based on actual relationships

    # PDFを生成
    pdf_buffer = generate_report_pdf(
        report=report,
        user=current_user,
        work_details=work_details,
        projects=projects,
        template_type=pdf_request.template_type
    )

    # PDFファイル名
    filename = f"月報_{report.report_month}_{current_user.name}.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )