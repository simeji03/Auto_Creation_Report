#!/bin/bash

# 最後に作成されたユーザーでログイン
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test_1749012732@example.com","password":"TestPassword123!"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

echo "Token: $TOKEN"
echo ""

# PDFエンドポイントの詳細確認
echo "=== PDF Export Test ==="
PDF_RESPONSE=$(curl -s -w "\n=== Headers ===\n%{header_json}\n=== Status Code ===\n%{http_code}\n" \
    "http://localhost:8000/api/reports/1/pdf" \
    -H "Authorization: Bearer $TOKEN")

echo "$PDF_RESPONSE"
echo ""

# APIキー設定エンドポイントの確認
echo "=== API Key Settings Test ==="
API_KEY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/settings/api-key \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"api_key": "test-api-key-12345"}')

echo "Response: $API_KEY_RESPONSE"
echo ""

# users.pyで定義されているエンドポイントの確認
echo "=== User Profile Test ==="
PROFILE_RESPONSE=$(curl -s http://localhost:8000/api/users/profile \
    -H "Authorization: Bearer $TOKEN")

echo "Profile: $PROFILE_RESPONSE"