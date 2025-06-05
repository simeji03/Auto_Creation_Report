#!/bin/bash

# 初回起動時の署名問題を自動解決
if [[ -f ".first_run" ]]; then
    echo "🔓 初回起動の準備中..."
    # quarantine属性を削除
    xattr -cr . 2>/dev/null
    # 実行権限を付与
    find . -name "*.sh" -o -name "*.command" | xargs chmod +x 2>/dev/null
    rm -f .first_run
    echo "✅ 準備完了"
    echo ""
fi

# システムディレクトリに移動
cd "$(dirname "$0")/system"

# Docker Composeコマンドの自動検出
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Desktopがインストールされていません"
    echo ""
    echo "インストール方法："
    echo "1. https://www.docker.com/products/docker-desktop/ を開く"
    echo "2. 「Download for Mac」をクリック"
    echo "3. ダウンロードしたファイルをダブルクリック"
    echo ""
    read -p "Enterキーを押して終了..."
    exit 1
fi

# Dockerが起動しているか確認
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker Desktopが起動していません"
    echo ""
    echo "起動方法："
    echo "1. Finderでアプリケーション→Docker.appをダブルクリック"
    echo "2. メニューバーにクジラのアイコンが表示されるまで待つ"
    echo "3. このファイルをもう一度ダブルクリック"
    echo ""
    read -p "Enterキーを押して終了..."
    exit 1
fi

# 既存のコンテナを停止
$DOCKER_COMPOSE -f docker-compose.prod.yml down 2>/dev/null

# ビルドと起動
echo "🏗️  アプリケーションを準備中..."
echo "（初回は5-10分かかる場合があります）"
echo ""

$DOCKER_COMPOSE -f docker-compose.prod.yml up -d --build

# 起動確認
echo "⏳ サービスの起動を確認中..."
ATTEMPT=0
while [ $ATTEMPT -lt 30 ]; do
    if curl -s http://localhost:3456 >/dev/null && curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo ""
        echo "✅ 起動完了！"
        echo ""
        echo "ブラウザで以下のURLにアクセス："
        echo "http://localhost:3456"
        echo ""
        open "http://localhost:3456"
        exit 0
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done

echo ""
echo "❌ 起動に失敗しました"
echo "ログを確認: $DOCKER_COMPOSE -f docker-compose.prod.yml logs"
