#!/bin/bash

echo "=== AI生成月報の作成とレイアウト確認 ==="
echo ""

# 1. テスト用月報データを作成
echo "1. テスト用月報を作成..."
REPORT_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/reports/" \
  -H "Content-Type: application/json" \
  -d '{
    "report_month": "2025-06",
    "current_phase": "開発フェーズ",
    "family_status": "順調",
    "total_work_hours": 160,
    "coding_hours": 120,
    "meeting_hours": 20,
    "sales_hours": 20,
    "sales_emails_sent": 10,
    "sales_replies": 5,
    "sales_meetings": 2,
    "contracts_signed": 1,
    "received_amount": 800000,
    "delivered_amount": 750000,
    "good_points": "開発が順調に進んだ",
    "challenges": "テストの自動化が不十分",
    "improvements": "CI/CDパイプラインの改善",
    "next_month_goals": "テストカバレッジを80%に向上"
  }')

REPORT_ID=$(echo $REPORT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "   作成された月報ID: $REPORT_ID"

# 2. 対話型月報生成のセッション開始
echo ""
echo "2. 対話型月報生成セッションを開始..."
SESSION_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/conversation/start" \
  -H "Content-Type: application/json" \
  -d "{\"report_id\": $REPORT_ID}")

SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"session_id":"[^"]*' | cut -d'"' -f4)
echo "   セッションID: $SESSION_ID"

# 3. AI月報を生成
echo ""
echo "3. AI月報を生成（APIキーが必要）..."
echo "   注意: このステップはAPIキーが設定されていないとスキップされます"

# AI生成のテスト（モックレスポンス）
AI_CONTENT="# 2025年6月 月次活動報告書

## 📊 定量データサマリー

### 作業時間内訳（合計: 160時間）
- **開発作業**: 120時間（75%）
- **ミーティング**: 20時間（12.5%）
- **営業活動**: 20時間（12.5%）

### 営業活動実績
- メール送信数: 10件
- 返信獲得: 5件（返信率50%）
- 商談実施: 2件
- 契約成立: 1件

### 収支状況
- 受領額: ¥800,000
- 納品額: ¥750,000

## 🎯 今月の成果と振り返り

### 良かった点
開発が順調に進み、予定していた機能の実装を完了することができました。

### 課題
テストの自動化が不十分で、手動テストに多くの時間を要しています。

### 改善点
CI/CDパイプラインの改善により、デプロイプロセスを効率化する予定です。

## 📈 来月の目標
テストカバレッジを現在の60%から80%まで向上させ、品質保証体制を強化します。"

echo ""
echo "4. ブラウザでAI生成月報ページを確認..."
echo "   URL: http://localhost:3456/ai-report"
echo ""
echo "   以下の点を確認してください:"
echo "   ✓ 「従来表示」ボタンが削除されている"
echo "   ✓ リッチ表示/生データの切り替えボタンが正しく配置されている"
echo "   ✓ Notionコピーボタンが適切に表示されている"
echo "   ✓ レイアウトが崩れていない"
echo ""
echo "   ※ AI生成月報を表示するには、対話型月報作成ページから実際に生成する必要があります"