#\!/bin/bash

echo "=== 月報作成支援ツール API テスト ==="
echo

# 1. ヘルスチェック
echo "1. ヘルスチェック"
curl -s http://localhost:8765/
echo -e "\n"

# 2. 新規ユーザー登録
echo "2. 新規ユーザー登録"
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@example.com"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8765/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"Test123\!\", \"name\": \"Test User $TIMESTAMP\"}")
echo "$REGISTER_RESPONSE"
echo -e "\n"

# 3. ログイン
echo "3. ログイン"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8765/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"Test123\!\"}")
echo "$LOGIN_RESPONSE"
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo "Token: ${TOKEN:0:20}..."
echo -e "\n"

# 4. ユーザー情報取得
echo "4. ユーザー情報取得"
curl -s -X GET http://localhost:8765/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 5. ダッシュボード情報取得
echo "5. ダッシュボード情報取得"
curl -s -X GET http://localhost:8765/api/reports/dashboard \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 6. 月報作成
echo "6. 月報作成"
REPORT_DATA='{
  "year": 2025,
  "month": 5,
  "name": "Test User",
  "current_phase": "成長期",
  "total_work_hours": 160,
  "coding_hours": 80,
  "meeting_hours": 20,
  "other_hours": 60,
  "sales_emails_sent": 50,
  "sales_replies": 10,
  "sales_meetings": 5,
  "received_amount": 500000,
  "good_points": "案件を順調に進めることができた",
  "challenges": "営業活動の時間確保が難しかった",
  "next_month_goals": "新規案件の獲得"
}'
REPORT_RESPONSE=$(curl -s -X POST http://localhost:8765/api/reports/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$REPORT_DATA")
echo "$REPORT_RESPONSE"
echo -e "\n"

# 7. AI分析（提案生成）
echo "7. AI分析（提案生成）"
curl -s -X POST http://localhost:8765/api/ai/generate-suggestions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reflection",
    "context": {
      "稼働時間": 160,
      "コーディング時間": 80,
      "営業メール数": 50,
      "返信数": 10,
      "良かった点": "案件を順調に進めることができた",
      "課題点": "営業活動の時間確保が難しかった"
    }
  }'
echo -e "\n"

echo "=== テスト完了 ==="
