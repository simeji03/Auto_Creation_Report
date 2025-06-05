"""
月報関連のAPIエンドポイント - 認証無効版
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
from pdf_generator import generate_report_pdf

router = APIRouter()

# 固定ユーザーID（認証無効化のため）
DEMO_USER_ID = 3

@router.get("/")
async def get_monthly_reports(
    page: int = 1,
    size: int = 10,
    db: Session = Depends(get_db)
):
    """
    月報一覧を取得（認証無効版）
    """
    skip = (page - 1) * size
    
    # 総数を取得
    total_count = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == DEMO_USER_ID
    ).count()
    
    # ページネーション適用
    reports = db.query(MonthlyReport).filter(
        MonthlyReport.user_id == DEMO_USER_ID
    ).order_by(MonthlyReport.created_at.desc()).offset(skip).limit(size).all()
    
    # ページ数計算
    import math
    total_pages = math.ceil(total_count / size) if total_count > 0 else 0
    
    # ページネーション対応のレスポンス形式
    if page == 1 and size >= total_count:
        # 最初のページで全件取得の場合は配列で返す（後方互換性）
        return [
            MonthlyReportSummary(
                id=report.id,
                user_id=report.user_id,
                report_month=report.report_month,
                total_work_hours=report.total_work_hours or 0,
                received_amount=report.received_amount or 0,
                created_at=report.created_at,
                updated_at=report.updated_at
            )
            for report in reports
        ]
    else:
        # ページネーション情報を含むレスポンス
        from pydantic import BaseModel
        from typing import List
        
        class PaginatedReports(BaseModel):
            items: List[MonthlyReportSummary]
            total: int
            page: int
            size: int
            pages: int
        
        return PaginatedReports(
            items=[
                MonthlyReportSummary(
                    id=report.id,
                    user_id=report.user_id,
                    report_month=report.report_month,
                    total_work_hours=report.total_work_hours or 0,
                    received_amount=report.received_amount or 0,
                    created_at=report.created_at,
                    updated_at=report.updated_at
                )
                for report in reports
            ],
            total=total_count,
            page=page,
            size=size,
            pages=total_pages
        )

@router.get("/{report_id}", response_model=MonthlyReportResponse)
async def get_monthly_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    特定の月報を取得（認証無効版）
    """
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == DEMO_USER_ID
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )
    
    return MonthlyReportResponse.model_validate(report)

@router.post("/", response_model=MonthlyReportResponse, status_code=status.HTTP_201_CREATED)
async def create_monthly_report(
    report_data: MonthlyReportCreate,
    db: Session = Depends(get_db)
):
    """
    新しい月報を作成（認証無効版）
    """
    # 常に新規月報作成（重複保存を許可）

    # 月報作成
    new_report = MonthlyReport(
        user_id=DEMO_USER_ID,
        **report_data.model_dump(exclude={"work_time_details", "projects"})
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 作業時間詳細の追加
    if hasattr(report_data, 'work_time_details') and report_data.work_time_details:
        for detail_data in report_data.work_time_details:
            detail = WorkTimeDetail(
                report_id=new_report.id,
                **detail_data.model_dump()
            )
            db.add(detail)

    # プロジェクト情報の追加
    if hasattr(report_data, 'projects') and report_data.projects:
        for project_data in report_data.projects:
            project = Project(
                report_id=new_report.id,
                **project_data.model_dump()
            )
            db.add(project)

    db.commit()
    db.refresh(new_report)

    return MonthlyReportResponse.model_validate(new_report)

@router.put("/{report_id}", response_model=MonthlyReportResponse)
async def update_monthly_report(
    report_id: int,
    report_data: MonthlyReportUpdate,
    db: Session = Depends(get_db)
):
    """
    月報を更新（認証無効版）
    """
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == DEMO_USER_ID
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    # レポートデータの更新
    update_data = report_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field not in ["work_time_details", "projects"]:
            setattr(report, field, value)

    db.commit()
    db.refresh(report)

    return MonthlyReportResponse.model_validate(report)

@router.delete("/{report_id}")
async def delete_monthly_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    月報を削除（認証無効版）
    """
    try:
        print(f"削除リクエスト受信: report_id={report_id}")
        
        # まず対象月報の存在確認（ユーザーIDに関係なく）
        report = db.query(MonthlyReport).filter(
            MonthlyReport.id == report_id
        ).first()

        if not report:
            print(f"月報が見つかりません: report_id={report_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="月報が見つかりません"
            )
        
        print(f"月報を発見: report_id={report_id}, month={report.report_month}")

        try:
            # 関連する作業時間詳細を削除（Projectは月報と直接関連していない）
            work_time_count = db.query(WorkTimeDetail).filter(WorkTimeDetail.report_id == report_id).count()
            
            print(f"関連データ: work_time_details={work_time_count}")
            
            db.query(WorkTimeDetail).filter(WorkTimeDetail.report_id == report_id).delete()
            # Projectテーブルは月報と直接関連していないため、削除しない
            
            db.delete(report)
            db.commit()
            
            print(f"月報削除成功: report_id={report_id}")
            
            # 204 No Contentではなく、200 OKでレスポンスを返す
            return {"message": "月報を削除しました", "report_id": report_id}
            
        except Exception as e:
            print(f"データベース操作エラー: {type(e).__name__}: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"削除処理中にエラーが発生しました: {str(e)}"
            )
            
    except HTTPException:
        # HTTPExceptionはそのまま再発生
        raise
    except Exception as e:
        print(f"予期しないエラー: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"予期しないエラーが発生しました: {str(e)}"
        )

@router.get("/{report_id}/pdf")
async def download_report_pdf(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    月報をPDF形式でダウンロード（認証無効版）
    """
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == DEMO_USER_ID
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    # PDF生成
    # 認証なし版ではユーザー情報を取得
    user = db.query(User).filter(User.id == report.user_id).first()
    if not user:
        # ユーザーが見つからない場合はダミーユーザーを作成
        user = User(id=report.user_id, name="Unknown User", email="unknown@example.com")
    pdf_buffer = generate_report_pdf(report, user)
    
    # レスポンスとして返す
    headers = {
        'Content-Disposition': f'attachment; filename="monthly_report_{report.report_month}.pdf"',
        'Content-Type': 'application/pdf'
    }
    
    return Response(
        content=pdf_buffer.getvalue(),
        headers=headers,
        media_type='application/pdf'
    )