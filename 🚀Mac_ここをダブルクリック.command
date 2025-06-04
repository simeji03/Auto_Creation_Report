#!/bin/bash

# 月報作成支援ツール - Mac用簡単起動スクリプト

clear
echo "╔════════════════════════════════════════╗"
echo "║    🚀 月報作成支援ツール v1.0.4       ║"
echo "║                                        ║"
echo "║    起動準備を開始します...             ║"
echo "╚════════════════════════════════════════╝"
echo ""

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# 実行権限を自動で付与
echo "📝 必要な権限を設定中..."
find . -name "*.sh" -o -name "*.command" | xargs chmod +x 2>/dev/null

# Dockerチェック
echo "🐳 Docker Desktopを確認中..."
if ! command -v docker &> /dev/null; then
    echo ""
    echo "❌ Docker Desktopがインストールされていません"
    echo ""
    echo "📥 かんたんインストール方法："
    echo ""
    echo "  1. 以下のリンクをCommand+クリックで開く："
    echo "     https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "  2. 「Download for Mac」をクリック"
    echo ""
    echo "  3. ダウンロードした Docker.dmg をダブルクリック"
    echo ""
    echo "  4. Dockerアイコンを Applications にドラッグ"
    echo ""
    echo "  5. Docker.app を起動（クジラのアイコン🐳）"
    echo ""
    echo "  6. このファイルをもう一度ダブルクリック"
    echo ""
    echo "詳しくは docs フォルダの説明書をご覧ください"
    echo ""
    echo "Enterキーを押して終了..."
    read -r
    exit 1
fi

if ! docker info &> /dev/null; then
    echo ""
    echo "⚠️  Docker Desktopが起動していません"
    echo ""
    echo "🐳 起動方法："
    echo ""
    echo "  1. Finderで「アプリケーション」を開く"
    echo "  2. Docker.app をダブルクリック"
    echo "  3. メニューバーにクジラ🐳が表示されるまで待つ（約30秒）"
    echo "  4. このファイルをもう一度ダブルクリック"
    echo ""
    echo "Enterキーを押して終了..."
    read -r
    exit 1
fi

echo "✅ Docker Desktop 確認OK"
echo ""

# 起動確認
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 月報作成ツールを起動します"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "準備ができたら Enter キーを押してください"
echo "（キャンセルする場合は Control+C）"
read -r

# メインの起動スクリプトを実行
echo ""
echo "🚀 起動中..."
if [ -f "app/manual-start.sh" ]; then
    cd app && ./manual-start.sh
elif [ -f "manual-start.sh" ]; then
    ./manual-start.sh
else
    echo "❌ エラー: 起動ファイルが見つかりません"
    echo "ZIPファイルを正しく解凍したか確認してください"
    echo ""
    echo "Enterキーを押して終了..."
    read -r
    exit 1
fi