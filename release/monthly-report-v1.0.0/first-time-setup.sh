#!/bin/bash

echo "🎉 月報作成支援ツール - 初回セットアップ"
echo "========================================"
echo ""

# .envファイルの作成
if [ ! -f .env ]; then
    echo "📝 環境設定ファイルを作成中..."
    
    # ランダムなシークレットキーを生成
    SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | head -c 64)
    
    cat > .env << EOF
# 月報作成支援ツール - 環境変数設定
# 自動生成された設定ファイルです

# セキュリティ設定（自動生成されたキー）
SECRET_KEY=$SECRET_KEY

# データベース設定
DATABASE_URL=sqlite:////app/data/monthly_reports.db

# CORS設定
ALLOWED_ORIGINS=http://localhost:3456

# OpenAI API設定（アプリ内で設定してください）
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
EOF
    
    echo "✅ 環境設定ファイルを作成しました"
else
    echo "✅ 環境設定ファイルは既に存在します"
fi

# dataフォルダの作成
if [ ! -d data ]; then
    echo "📁 データ保存フォルダを作成中..."
    mkdir -p data
    echo "✅ データ保存フォルダを作成しました"
else
    echo "✅ データ保存フォルダは既に存在します"
fi

# 実行権限の付与
echo "🔧 スクリプトに実行権限を付与中..."
chmod +x docker-start.sh 2>/dev/null
chmod +x diagnose.sh 2>/dev/null
echo "✅ 実行権限を付与しました"

echo ""
echo "🎊 初回セットアップが完了しました！"
echo ""
echo "次のステップ:"
echo "1. Docker Desktopが起動していることを確認"
echo "2. ./docker-start.sh を実行してアプリを起動"
echo ""
echo "楽しい月報作成を！"