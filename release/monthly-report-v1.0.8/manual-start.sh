#!/bin/bash

echo "🚀 月報作成支援ツール - スマート起動スクリプト"
echo "============================================="
echo ""

# 実行権限チェック
if [[ ! -x "$0" ]]; then
    echo "⚠️  実行権限がありません"
    echo ""
    echo "解決方法："
    echo "1. ターミナルを開く（Finder→アプリケーション→ユーティリティ→ターミナル）"
    echo "2. 以下のコマンドを実行："
    echo "   chmod +x \"$0\""
    echo "3. このファイルをもう一度ダブルクリック"
    echo ""
    echo "または、トップフォルダの「🚀Mac_ここをダブルクリック.command」を使用してください"
    exit 1
fi

# Docker Composeコマンドの自動検出
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Composeが見つかりません"
    echo "Docker Desktopを最新版にアップデートしてください"
    exit 1
fi

# スクリプトのディレクトリに移動（どこから実行しても動作）
cd "$(dirname "$0")"

# 既存のコンテナを停止
echo "🔄 既存のコンテナを確認中..."
$DOCKER_COMPOSE -f docker-compose.prod.yml down 2>/dev/null

# ポート使用チェック
check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        echo "⚠️  ポート $1 が既に使用されています"
        echo "他のアプリケーションを停止するか、Docker Desktopで既存のコンテナを停止してください"
        return 1
    fi
    return 0
}

check_port 3456 || exit 1
check_port 8000 || exit 1

# メモリチェック（最低2GB推奨）
if [[ "$OSTYPE" == "darwin"* ]]; then
    TOTAL_MEM=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
    if (( $(echo "$TOTAL_MEM < 4" | bc -l) )); then
        echo "⚠️  メモリが少ない可能性があります（推奨: 4GB以上）"
    fi
fi

# ビルドとスタート
echo "🏗️  アプリケーションをビルド中..."
echo "（初回は5-10分かかる場合があります）"
echo ""
echo "📊 進捗状況："
echo "  1/3 📥 イメージのダウンロード中..."
$DOCKER_COMPOSE -f docker-compose.prod.yml pull
echo "  2/3 🔨 アプリケーションのビルド中..."
$DOCKER_COMPOSE -f docker-compose.prod.yml build
echo "  3/3 ✅ ビルド完了！"

echo ""
echo "🚀 アプリケーションを起動中..."
$DOCKER_COMPOSE -f docker-compose.prod.yml up -d

# ヘルスチェック
echo "⏳ サービスの起動を確認中..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3456 >/dev/null && curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo ""
        echo "✅ 起動完了！"
        echo "============================================="
        echo "🌐 ブラウザで以下のURLにアクセスしてください："
        echo "   http://localhost:3456"
        echo ""
        echo "📁 データの保存場所："
        echo "   $(pwd)/data"
        echo ""
        echo "💡 停止方法："
        echo "   $DOCKER_COMPOSE -f docker-compose.prod.yml down"
        echo ""
        echo "🔄 ログを見る："
        echo "   $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f"
        echo "============================================="
        
        # ブラウザを開く
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "http://localhost:3456"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "http://localhost:3456" 2>/dev/null
        fi
        exit 0
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 2
done

echo ""
echo "❌ 起動に失敗しました"
echo ""
echo "🔍 トラブルシューティング："
echo "1. Docker Desktopが起動しているか確認"
echo "2. 以下のコマンドでログを確認："
echo "   $DOCKER_COMPOSE -f docker-compose.prod.yml logs"
echo ""
echo "📧 サポート: コミュニティ管理者にご連絡ください"
exit 1