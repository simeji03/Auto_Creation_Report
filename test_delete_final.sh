#!/bin/bash

echo "=== 最終削除機能テスト ==="
echo ""

# 1. 現在の月報数を確認
echo "1. 現在の月報一覧:"
REPORTS=$(curl -s "http://localhost:8000/api/reports/?page=1&size=100")
COUNT_BEFORE=$(echo $REPORTS | jq '.items | length' 2>/dev/null || echo $REPORTS | grep -o '"id":[0-9]*' | wc -l)
echo "   月報数: $COUNT_BEFORE"
echo ""

# 2. 最初の月報IDを取得
FIRST_ID=$(echo $REPORTS | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
if [ -z "$FIRST_ID" ]; then
    echo "❌ 削除対象の月報が見つかりません"
    exit 1
fi

echo "2. 月報ID $FIRST_ID を削除:"
DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:8000/api/reports/$FIRST_ID" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3456")
echo "   レスポンス: $DELETE_RESPONSE"
echo ""

# 3. 削除後の月報数を確認
echo "3. 削除後の確認:"
sleep 1
REPORTS_AFTER=$(curl -s "http://localhost:8000/api/reports/?page=1&size=100")
COUNT_AFTER=$(echo $REPORTS_AFTER | jq '.items | length' 2>/dev/null || echo $REPORTS_AFTER | grep -o '"id":[0-9]*' | wc -l)
echo "   月報数: $COUNT_AFTER (削除前: $COUNT_BEFORE)"

if [ "$COUNT_AFTER" -lt "$COUNT_BEFORE" ]; then
    echo ""
    echo "✅ 削除成功！月報が正常に削除されました。"
else
    echo ""
    echo "❌ 削除失敗: 月報数が変わっていません。"
fi