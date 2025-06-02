#!/bin/bash
# 月報作成支援ツール - テスト起動スクリプト

echo "🚀 月報作成支援ツール テスト環境を起動します"
echo ""

# バックエンドが既に起動しているかチェック
if curl -s http://localhost:8765/health > /dev/null 2>&1; then
    echo "✅ バックエンドは既に起動しています (http://localhost:8765)"
else
    echo "🔧 バックエンドを起動しています..."
    python3 backend/simple_server.py &
    BACKEND_PID=$!

    # 起動まで待機
    echo "⏳ バックエンドの起動を待機中..."
    for i in {1..10}; do
        if curl -s http://localhost:8765/health > /dev/null 2>&1; then
            echo "✅ バックエンドが起動しました (PID: $BACKEND_PID)"
            break
        fi
        sleep 1
    done
fi

# フロントエンドが既に起動しているかチェック
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ フロントエンドは既に起動しています (http://localhost:8080)"
else
    echo "🌐 フロントエンドを起動しています..."
    python3 serve-frontend.py &
    FRONTEND_PID=$!

    # 起動まで待機
    echo "⏳ フロントエンドの起動を待機中..."
    for i in {1..10}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo "✅ フロントエンドが起動しました (PID: $FRONTEND_PID)"
            break
        fi
        sleep 1
    done
fi

echo ""
echo "🎉 テスト環境の起動が完了しました！"
echo ""
echo "📍 アクセス情報:"
echo "   🌐 フロントエンド: http://localhost:8080/test-frontend.html"
echo "   🔧 バックエンドAPI: http://localhost:8765"
echo "   📋 ヘルスチェック: http://localhost:8765/health"
echo ""
echo "🧪 テスト手順:"
echo "   1. ブラウザで http://localhost:8080/test-frontend.html を開く"
echo "   2. '全テスト実行' ボタンをクリック"
echo "   3. 各機能を手動でテスト"
echo ""
echo "🛑 停止するには Ctrl+C を押してください"

# シグナルハンドリング
trap 'echo ""; echo "🛑 サーバーを停止しています..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ テスト環境が停止しました"; exit 0' INT

# プロセスが終了するまで待機
wait