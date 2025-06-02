"""
日付関連のユーティリティ関数
"""
from datetime import datetime

def get_report_month(date: datetime = None) -> str:
    """
    15日基準で月報の月を決定する
    
    - 前月15日〜当月14日: 前月の月報
    - 当月15日〜翌月14日: 当月の月報
    
    例:
    - 5月15日〜6月14日に作成 → 5月の月報 (2024-05)
    - 6月15日〜7月14日に作成 → 6月の月報 (2024-06)
    
    Args:
        date: 基準日（指定しない場合は現在日時）
    
    Returns:
        月報の月（YYYY-MM形式）
    """
    if date is None:
        date = datetime.now()
    
    # 15日より前の場合は前月
    if date.day < 15:
        # 1月の場合は前年の12月
        if date.month == 1:
            return f"{date.year - 1}-12"
        else:
            return f"{date.year}-{date.month - 1:02d}"
    else:
        # 15日以降は当月
        return f"{date.year}-{date.month:02d}"