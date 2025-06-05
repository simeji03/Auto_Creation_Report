#!/bin/bash

echo "🔍 月報作成支援ツール - 診断ツール"
echo "====================================="
echo ""

# 診断結果を保存
DIAGNOSIS_FILE="diagnosis_$(date +%Y%m%d_%H%M%S).txt"
exec > >(tee -a "$DIAGNOSIS_FILE")
exec 2>&1

echo "診断開始: $(date)"
echo ""

# OS情報
echo "📱 システム情報:"
echo "-------------------"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "OS: macOS $(sw_vers -productVersion)"
    echo "アーキテクチャ: $(uname -m)"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "アーキテクチャ: $(uname -m)"
fi
echo ""

# Docker情報
echo "🐳 Docker情報:"
echo "-------------------"
if command -v docker &> /dev/null; then
    echo "Docker: $(docker --version)"
    if docker info &> /dev/null; then
        echo "Docker状態: 起動中 ✅"
        echo "コンテナ数: $(docker ps -q | wc -l) 個実行中"
    else
        echo "Docker状態: 停止中 ❌"
        echo "→ Docker Desktopを起動してください"
    fi
else
    echo "Docker: インストールされていません ❌"
    echo "→ https://www.docker.com/products/docker-desktop/ からインストール"
fi
echo ""

# Docker Compose確認
echo "📦 Docker Compose情報:"
echo "-------------------"
if command -v docker-compose &> /dev/null; then
    echo "docker-compose: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    echo "docker compose: $(docker compose version)"
else
    echo "Docker Compose: 見つかりません ❌"
fi
echo ""

# ポート確認
echo "🔌 ポート使用状況:"
echo "-------------------"
for port in 3456 8000; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "ポート $port: 使用中 ⚠️"
        lsof -i :$port | grep LISTEN | head -1
    else
        echo "ポート $port: 空き ✅"
    fi
done
echo ""

# ディスク容量
echo "💾 ディスク容量:"
echo "-------------------"
df -h . | grep -v Filesystem
echo ""

# メモリ情報
echo "🧠 メモリ情報:"
echo "-------------------"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "総メモリ: $(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}') GB"
    echo "空きメモリ: $(vm_stat | grep "Pages free" | awk '{print $3*4096/1024/1024/1024}') GB"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    free -h | grep Mem
fi
echo ""

# コンテナ状態
echo "📊 コンテナ状態:"
echo "-------------------"
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "monthly|report"; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "monthly|report"
else
    echo "月報アプリのコンテナは実行されていません"
fi
echo ""

# ネットワーク確認
echo "🌐 ネットワーク確認:"
echo "-------------------"
if ping -c 1 google.com &> /dev/null; then
    echo "インターネット接続: OK ✅"
else
    echo "インターネット接続: NG ❌"
fi

if curl -s http://localhost:3456 &> /dev/null; then
    echo "フロントエンド (localhost:3456): 応答あり ✅"
else
    echo "フロントエンド (localhost:3456): 応答なし ❌"
fi

if curl -s http://localhost:8000/health &> /dev/null; then
    echo "バックエンド (localhost:8000): 応答あり ✅"
else
    echo "バックエンド (localhost:8000): 応答なし ❌"
fi
echo ""

# ログ確認
echo "📝 最新のエラーログ:"
echo "-------------------"
if [[ -f docker-compose.prod.yml ]]; then
    docker-compose -f docker-compose.prod.yml logs --tail=20 2>&1 | grep -E "ERROR|Error|error|WARN|Warning" || echo "エラーログなし"
fi
echo ""

# 診断結果サマリー
echo "📋 診断結果サマリー:"
echo "===================="
echo "✅ 正常な項目:"
[[ -f "$DIAGNOSIS_FILE" ]] && grep "✅" "$DIAGNOSIS_FILE" | tail -10

echo ""
echo "❌ 問題のある項目:"
[[ -f "$DIAGNOSIS_FILE" ]] && grep "❌" "$DIAGNOSIS_FILE" | tail -10

echo ""
echo "⚠️  注意が必要な項目:"
[[ -f "$DIAGNOSIS_FILE" ]] && grep "⚠️" "$DIAGNOSIS_FILE" | tail -10

echo ""
echo "診断完了: $(date)"
echo "診断結果は $DIAGNOSIS_FILE に保存されました"
echo ""
echo "この診断結果をサポートに送信する場合は、"
echo "上記のファイルを添付してください。"