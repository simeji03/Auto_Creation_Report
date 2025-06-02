"""
月報PDF生成機能 (一時的に無効化)
"""

import io
from datetime import datetime
from typing import List

# from reportlab.lib.pagesizes import A4
# from reportlab.lib import colors
# from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.units import mm
# from reportlab.platypus import (
#     SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
#     PageBreak, KeepTogether
# )

from database import MonthlyReport, User, WorkTimeDetail, Project

def generate_report_pdf(
    report: MonthlyReport,
    user: User,
    work_details: List[WorkTimeDetail] = None,
    projects: List[Project] = None,
    template_type: str = "standard"
) -> io.BytesIO:
    """
    月報PDFを生成 (現在は仮実装)
    """
    # ReportLabが利用できない場合の仮実装
    buffer = io.BytesIO()

    # 簡単なテキストベースのレポートを生成
    content = f"""
月報レポート - {user.name}
期間: {report.report_month}
作成日: {datetime.now().strftime('%Y-%m-%d %H:%M')}

基本情報:
- 現在のフェーズ: {report.current_phase or '未設定'}
- 家族構成: {report.family_status or '未設定'}

定量データ:
- 総稼働時間: {report.total_work_hours:.1f}h
- コーディング時間: {report.coding_hours:.1f}h
- 会議時間: {report.meeting_hours:.1f}h
- 営業時間: {report.sales_hours:.1f}h

営業結果:
- 営業メール送信: {report.sales_emails_sent}件
- 返信: {report.sales_replies}件
- 面談: {report.sales_meetings}件
- 契約: {report.contracts_signed}件

収入データ:
- 受注金額: ¥{report.received_amount:,.0f}
- 納品金額: ¥{report.delivered_amount:,.0f}

定性データ:
良かった点: {report.good_points or '未記入'}
課題点: {report.challenges or '未記入'}
改善案: {report.improvements or '未記入'}
来月の目標: {report.next_month_goals or '未記入'}

※ 本格的なPDF生成機能は今後実装予定です。
"""

    # テキストをバイナリとして書き込み
    buffer.write(content.encode('utf-8'))
    buffer.seek(0)

    return buffer