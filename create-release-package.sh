#!/bin/bash

echo "📦 リリースパッケージを作成します..."
echo ""

# リリースディレクトリの作成
RELEASE_DIR="release/monthly-report-v1.0.0"
mkdir -p "$RELEASE_DIR"

echo "📂 必要なファイルをコピー中..."

# 起動スクリプト
cp cursor-setup.command "$RELEASE_DIR/"
cp cursor-setup.bat "$RELEASE_DIR/"
cp quick-start.sh "$RELEASE_DIR/"

# Docker設定
cp docker-compose.prod.yml "$RELEASE_DIR/"
cp Dockerfile.frontend "$RELEASE_DIR/"
cp Dockerfile.backend "$RELEASE_DIR/"

# 環境設定
cp .env.example "$RELEASE_DIR/"

# ドキュメント
cp README.md "$RELEASE_DIR/"
cp CURSOR_USER_GUIDE.md "$RELEASE_DIR/"
cp DEPLOY.md "$RELEASE_DIR/"

# .gitignoreをコピー（重要ファイルなので）
cp .gitignore "$RELEASE_DIR/"

# ソースコード（必要最小限）
echo "📱 フロントエンドをコピー中..."
mkdir -p "$RELEASE_DIR/frontend"
cp -r frontend/src "$RELEASE_DIR/frontend/"
cp -r frontend/public "$RELEASE_DIR/frontend/"
cp frontend/package*.json "$RELEASE_DIR/frontend/"
cp frontend/tsconfig.json "$RELEASE_DIR/frontend/"
cp frontend/tailwind.config.js "$RELEASE_DIR/frontend/"
cp frontend/postcss.config.js "$RELEASE_DIR/frontend/"

echo "🐍 バックエンドをコピー中..."
mkdir -p "$RELEASE_DIR/backend"
cp -r backend/*.py "$RELEASE_DIR/backend/"
cp -r backend/routers "$RELEASE_DIR/backend/"
cp -r backend/utils "$RELEASE_DIR/backend/"
cp backend/requirements.txt "$RELEASE_DIR/backend/"

# node_modules、venv、__pycache__は除外済み

# 簡単なREADMEを作成
cat > "$RELEASE_DIR/README_FIRST.txt" << 'EOF'
🚀 月報作成支援ツール - クイックスタート

【セットアップ手順】
1. Docker Desktopをインストール
   - Mac: https://www.docker.com/products/docker-desktop/
   - Windows: 同上

2. 起動
   - Mac: cursor-setup.command をダブルクリック
   - Windows: cursor-setup.bat をダブルクリック

3. ブラウザで http://localhost:3456 が開きます

【詳細な使い方】
CURSOR_USER_GUIDE.md を参照してください。

【トラブル時】
1. Docker Desktopが起動しているか確認
2. GitHubのIssuesで質問
   https://github.com/simeji03/Auto_Creation_Report/issues

【機能】
- 音声入力による月報作成
- AI自動文章生成（OpenAI GPT-4）
- PDF出力
- 月報管理
EOF

echo ""
echo "📁 ファイル構成:"
find "$RELEASE_DIR" -type f | head -20
echo "..."
echo ""

# ZIPファイルの作成
echo "🗜️  ZIPファイルを作成中..."
cd release
zip -r "monthly-report-v1.0.0.zip" "monthly-report-v1.0.0" > /dev/null 2>&1

echo ""
echo "✅ リリースパッケージが完成しました！"
echo ""
echo "📦 パッケージ内容:"
echo "   📁 release/monthly-report-v1.0.0/"
echo "   📄 release/monthly-report-v1.0.0.zip"
echo ""
echo "ファイルサイズ:"
du -sh release/monthly-report-v1.0.0.zip
echo ""
echo "📋 次のステップ:"
echo "1. GitHubでリリースを作成"
echo "2. monthly-report-v1.0.0.zip をアップロード"
echo "3. リリースノートを記載"