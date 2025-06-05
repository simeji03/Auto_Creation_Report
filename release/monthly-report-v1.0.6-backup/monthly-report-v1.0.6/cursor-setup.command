#!/bin/bash
# Mac用ダブルクリック起動スクリプト

cd "$(dirname "$0")"

echo "🚀 月報作成ツール - 簡単セットアップ"
echo "===================================="
echo ""

# Docker Desktopの確認
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktopが起動していません"
    echo ""
    echo "1. Docker Desktopを起動してください"
    echo "2. 起動したらEnterキーを押してください"
    read -p "続行しますか？ (Enter) "
fi

# 起動
echo "🔄 ツールを起動中..."
./quick-start.sh

echo ""
echo "✨ セットアップ完了！"
echo ""
echo "ブラウザが自動で開きます..."
sleep 2
open http://localhost:3456

echo ""
echo "このウィンドウは開いたままにしてください"
echo "終了するには Ctrl+C を押してください"

# 終了待ち
tail -f /dev/null