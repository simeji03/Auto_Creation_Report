"""
AI支援機能のAPIエンドポイント
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
from typing import List

from database import get_db, User, MonthlyReport
from schemas import AIAnalysisRequest, AIAnalysisResponse, AISuggestionRequest
from auth import get_current_active_user

router = APIRouter()

def get_openai_client():
    """OpenAIクライアントを取得"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        import openai
        return openai.OpenAI(api_key=api_key)
    except ImportError:
        return None

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_report_data(
    analysis_request: AIAnalysisRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    月報データをAIで分析し、提案を生成
    """
    client = get_openai_client()
    if not client:
        # OpenAI APIが利用できない場合はデモデータを返す
        return generate_demo_analysis(analysis_request.analysis_type)

    try:
        # 分析タイプに応じてプロンプトを作成
        prompts = {
            "reflection": create_reflection_prompt(analysis_request.report_data),
            "improvement": create_improvement_prompt(analysis_request.report_data),
            "goals": create_goals_prompt(analysis_request.report_data)
        }

        prompt = prompts.get(analysis_request.analysis_type)
        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="無効な分析タイプです"
            )

        # OpenAI APIを呼び出し
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "あなたはフリーランスのコンサルタントです。月報データを分析し、建設的で実用的なアドバイスを提供してください。"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )

        ai_response = response.choices[0].message.content

        # レスポンスを構造化
        suggestions = parse_ai_response(ai_response)

        return AIAnalysisResponse(
            analysis_type=analysis_request.analysis_type,
            suggestions=suggestions,
            summary=ai_response[:200] + "..." if len(ai_response) > 200 else ai_response
        )

    except Exception as e:
        # エラーの場合もデモデータを返す
        return generate_demo_analysis(analysis_request.analysis_type)

@router.post("/suggest-improvements/{report_id}")
async def suggest_improvements(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    指定した月報に対する改善提案を生成
    """
    # 月報を取得
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="月報が見つかりません"
        )

    # 月報データを辞書形式に変換
    report_data = {
        "稼働時間": report.total_work_hours,
        "コーディング時間": report.coding_hours,
        "営業メール数": report.sales_emails_sent,
        "返信数": report.sales_replies,
        "面談数": report.sales_meetings,
        "受注金額": report.received_amount,
        "良かった点": report.good_points,
        "課題点": report.challenges
    }

    # AI分析を実行
    analysis_request = AIAnalysisRequest(
        report_data=report_data,
        analysis_type="improvement"
    )

    return await analyze_report_data(analysis_request, current_user)

@router.post("/generate-reflection")
async def generate_reflection(
    report_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """
    月報データから振り返り内容を生成
    """
    analysis_request = AIAnalysisRequest(
        report_data=report_data,
        analysis_type="reflection"
    )

    return await analyze_report_data(analysis_request, current_user)

@router.post("/generate-goals")
async def generate_goals(
    report_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """
    月報データから来月の目標を生成
    """
    analysis_request = AIAnalysisRequest(
        report_data=report_data,
        analysis_type="goals"
    )

    return await analyze_report_data(analysis_request, current_user)

def generate_demo_analysis(analysis_type: str) -> AIAnalysisResponse:
    """
    デモ用の分析結果を生成（OpenAI APIが利用できない場合）
    """
    demo_data = {
        "reflection": {
            "suggestions": [
                "稼働時間の効率的な配分ができている点が評価できます",
                "営業活動への取り組みが積極的で、継続性が見られます",
                "コーディング時間の確保により、スキル向上が期待できます",
                "データ入力の習慣化により、振り返りの質が向上しています"
            ],
            "summary": "全体的に安定した活動ができており、特に営業とコーディングのバランスが良い状態です。"
        },
        "improvement": {
            "suggestions": [
                "営業の返信率向上のため、メール内容の見直しを検討しましょう",
                "時間管理の最適化により、さらなる効率化が期待できます",
                "継続案件の獲得に向けた戦略を立てることをお勧めします",
                "スキルアップのための学習時間の確保を検討してください"
            ],
            "summary": "現状の基盤を活かしつつ、営業効率と継続性の向上に焦点を当てることで更なる成長が期待できます。"
        },
        "goals": {
            "suggestions": [
                "来月の営業メール数を20%増加させる",
                "返信率を現在の2倍に向上させる",
                "新規案件を2件以上獲得する",
                "コーディング効率を向上させ、時間当たりの生産性を上げる",
                "継続案件の可能性を3件以上探る"
            ],
            "summary": "現在の実績を基に、営業効率の向上と案件獲得数の増加を目標とした挑戦的だが実現可能な目標設定です。"
        }
    }

    data = demo_data.get(analysis_type, demo_data["reflection"])
    return AIAnalysisResponse(
        analysis_type=analysis_type,
        suggestions=data["suggestions"],
        summary=data["summary"]
    )

def create_reflection_prompt(report_data: dict) -> str:
    """振り返り用のプロンプトを作成"""
    return f"""
以下の月報データを分析し、振り返りポイントを3-5個の項目で提案してください：

{format_report_data(report_data)}

特に以下の観点から分析してください：
1. 時間配分の効率性
2. 営業活動の成果
3. 収入と稼働のバランス
4. 成長につながった活動

各項目は簡潔で、具体的な気づきを含めてください。
"""

def create_improvement_prompt(report_data: dict) -> str:
    """改善提案用のプロンプトを作成"""
    return f"""
以下の月報データから課題を分析し、具体的な改善提案を3-5個提示してください：

{format_report_data(report_data)}

改善提案は以下の要素を含めてください：
1. 現状の課題の特定
2. 具体的な改善アクション
3. 期待される効果
4. 実行のしやすさ

実行可能で、効果が期待できる提案を優先してください。
"""

def create_goals_prompt(report_data: dict) -> str:
    """目標設定用のプロンプトを作成"""
    return f"""
以下の月報データを基に、来月の現実的で挑戦的な目標を3-5個提案してください：

{format_report_data(report_data)}

目標は以下の基準で設定してください：
1. 現在の実績に基づいた現実性
2. 成長につながる挑戦性
3. 測定可能な具体性
4. 期限の明確性

SMARTゴールの原則に従って、具体的で達成可能な目標を提案してください。
"""

def format_report_data(report_data: dict) -> str:
    """月報データを読みやすい形式にフォーマット"""
    formatted = []
    for key, value in report_data.items():
        if isinstance(value, (int, float)):
            formatted.append(f"- {key}: {value:,}")
        else:
            formatted.append(f"- {key}: {value}")
    return "\n".join(formatted)

def parse_ai_response(response: str) -> List[str]:
    """AIレスポンスを提案のリストに分割"""
    # 簡単な分割ロジック（改行や番号付きリストを基準）
    lines = response.split('\n')
    suggestions = []

    for line in lines:
        line = line.strip()
        if line and (line.startswith('-') or line.startswith('•') or
                    any(line.startswith(f"{i}.") for i in range(1, 10))):
            # リストマーカーを除去
            clean_line = line.lstrip('-•0123456789. ')
            if clean_line:
                suggestions.append(clean_line)

    # 最低1個の提案を保証
    if not suggestions and response.strip():
        suggestions = [response.strip()]

    return suggestions[:5]  # 最大5個まで

@router.post("/generate-suggestions")
async def generate_suggestions(
    request: AISuggestionRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    フロントエンドからの提案生成リクエストを処理
    """
    # AIAnalysisRequestに変換
    analysis_request = AIAnalysisRequest(
        report_data=request.context,
        analysis_type=request.type
    )
    
    return await analyze_report_data(analysis_request, current_user)