#!/bin/bash

echo "🚀 手動起動（Docker以外）"
echo "========================"

# バックエンド起動
echo "🐍 バックエンドを起動中..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

echo "⏳ 2秒待機..."
sleep 2

# フロントエンド起動
echo "📱 フロントエンドを起動中..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 起動完了！"
echo "バックエンド: http://localhost:8000"
echo "フロントエンド: http://localhost:3456"
echo ""
echo "停止するには: Ctrl+C"

# 停止処理
trap "echo '🛑 停止中...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait