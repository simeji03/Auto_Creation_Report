#!/bin/bash

# 月報作成支援ツール - クイックスタートスクリプト

echo "🚀 月報作成支援ツール - クイックスタート"
echo "========================================="
echo ""

# Dockerの確認
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker/Docker Composeが見つかりました"
    echo ""
    echo "📦 Dockerを使用してセットアップします..."
    
    # 環境変数ファイルの作成
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "✅ .envファイルを作成しました"
    fi
    
    # Dockerコンテナの起動
    echo "🔄 コンテナを起動中..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo ""
    echo "✨ セットアップ完了！"
    echo ""
    echo "🌐 ブラウザで以下のURLにアクセスしてください:"
    echo "   http://localhost:3456"
    echo ""
    echo "📝 使い方:"
    echo "   1. 設定ページでOpenAI APIキーを登録"
    echo "   2. 対話型月報作成で音声入力"
    echo "   3. AI月報生成ボタンをクリック"
    echo ""
    echo "⏹️  停止するには: docker-compose -f docker-compose.prod.yml down"
    
else
    echo "⚠️  Dockerが見つかりません"
    echo ""
    echo "📦 手動セットアップを実行します..."
    echo ""
    
    # Node.jsの確認
    if ! command -v node &> /dev/null; then
        echo "❌ Node.jsがインストールされていません"
        echo "   https://nodejs.org/ からインストールしてください"
        exit 1
    fi
    
    # Pythonの確認
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3がインストールされていません"
        echo "   https://www.python.org/ からインストールしてください"
        exit 1
    fi
    
    # セットアップスクリプトの実行
    if [ -f setup.sh ]; then
        echo "🔄 setup.shを実行中..."
        ./setup.sh
    else
        echo "❌ setup.shが見つかりません"
        echo "   手動でセットアップを行ってください:"
        echo ""
        echo "   # バックエンド"
        echo "   cd backend"
        echo "   python3 -m venv venv"
        echo "   source venv/bin/activate"
        echo "   pip install -r requirements.txt"
        echo "   python main.py &"
        echo ""
        echo "   # フロントエンド"
        echo "   cd ../frontend"
        echo "   npm install"
        echo "   npm run build"
        echo "   npx serve -s build -l 3456"
    fi
fi

echo ""
echo "💡 ヘルプ: DEPLOY.mdを参照してください"