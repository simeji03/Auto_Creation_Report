#!/bin/bash

echo "🚀 月報作成支援ツール - シンプルリリース作成"
echo "=========================================="
echo ""

# バージョン入力
echo "リリースバージョンを入力してください (例: v1.0.4):"
read VERSION

if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ バージョン形式が正しくありません"
    exit 1
fi

# リリースディレクトリ作成
RELEASE_DIR="release/monthly-report-${VERSION}"
echo "📁 リリースディレクトリを作成中..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/app"
mkdir -p "$RELEASE_DIR/docs"

# 起動ファイルをトップレベルに配置
echo "📋 起動ファイルをコピー中..."
cp "🚀Mac_ここをダブルクリック.command" "$RELEASE_DIR/"
cp "🚀Windows_ここを右クリック_管理者として実行.bat" "$RELEASE_DIR/"

# アプリケーションファイルをappフォルダに
echo "📦 アプリケーションファイルを整理中..."
# フロントエンド
cp -r frontend "$RELEASE_DIR/app/"
# バックエンド
cp -r backend "$RELEASE_DIR/app/"
# Docker関連
cp docker-compose.prod.yml "$RELEASE_DIR/app/"
cp Dockerfile.frontend "$RELEASE_DIR/app/"
cp Dockerfile.backend "$RELEASE_DIR/app/"
# 起動スクリプト（appフォルダ内）
cp manual-start.sh "$RELEASE_DIR/app/"
cp manual-start.command "$RELEASE_DIR/app/"
cp manual-start.bat "$RELEASE_DIR/app/"
cp first-time-setup.sh "$RELEASE_DIR/app/"
cp diagnose.sh "$RELEASE_DIR/app/"
cp env.example "$RELEASE_DIR/app/"

# ドキュメントをdocsフォルダに
echo "📚 ドキュメントを整理中..."
cp DOCKER_INSTALL_GUIDE.md "$RELEASE_DIR/docs/"
cp TROUBLESHOOTING.md "$RELEASE_DIR/docs/"
cp WINDOWS_DOCKER_SETUP.md "$RELEASE_DIR/docs/"

# わかりやすいREADMEを作成
cat > "$RELEASE_DIR/はじめにお読みください.txt" << 'EOF'
📊 月報作成支援ツール
=====================

【起動方法】

🍎 Macの場合:
   「🚀Mac_ここをダブルクリック.command」をダブルクリック

🪟 Windowsの場合:
   「🚀Windows_ここを右クリック_管理者として実行.bat」を
   右クリック→「管理者として実行」を選択

【必要なもの】
   Docker Desktop（無料）
   詳しくは docs/DOCKER_INSTALL_GUIDE.md を参照

【トラブル時】
   docs/TROUBLESHOOTING.md を参照

【フォルダ構成】
   🚀Mac_ここをダブルクリック.command         ← Macの方
   🚀Windows_ここを右クリック_管理者として実行.bat  ← Windowsの方
   はじめにお読みください.txt                    ← このファイル
   app/                                      ← アプリ本体（触らない）
   docs/                                     ← 詳しい説明書

楽しい月報作成を！
EOF

# PDFドキュメントを作成（簡易的なインストールガイド）
cat > "$RELEASE_DIR/docs/QUICK_START.md" << 'EOF'
# クイックスタートガイド

## 1. Docker Desktopをインストール
- Mac: https://www.docker.com/products/docker-desktop/
- Windows: 同上

## 2. 起動
- Mac: START_HERE_MAC.command をダブルクリック
- Windows: START_HERE_WINDOWS.bat を右クリック→管理者として実行

## 3. 完了！
ブラウザが自動で開きます（http://localhost:3456）
EOF

# 実行権限を付与
chmod +x "$RELEASE_DIR/🚀Mac_ここをダブルクリック.command"
chmod +x "$RELEASE_DIR/app/manual-start.sh"
chmod +x "$RELEASE_DIR/app/manual-start.command"
chmod +x "$RELEASE_DIR/app/first-time-setup.sh"
chmod +x "$RELEASE_DIR/app/diagnose.sh"

# クリーンアップ
echo "🧹 不要ファイルを削除中..."
# Node.js関連
rm -rf "$RELEASE_DIR/app/frontend/node_modules"
rm -rf "$RELEASE_DIR/app/frontend/build"
rm -rf "$RELEASE_DIR/app/frontend/.cache"
# Python関連
rm -rf "$RELEASE_DIR/app/backend/venv"
rm -rf "$RELEASE_DIR/app/backend/__pycache__"
find "$RELEASE_DIR" -name "*.pyc" -delete
find "$RELEASE_DIR" -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
# 環境ファイル
find "$RELEASE_DIR" -name ".env" -delete
find "$RELEASE_DIR" -name ".env.*" -delete
# データベース
find "$RELEASE_DIR" -name "*.db" -delete
find "$RELEASE_DIR" -name "*.sqlite*" -delete
# ログ
find "$RELEASE_DIR" -name "*.log" -delete
# その他
find "$RELEASE_DIR" -name ".DS_Store" -delete
find "$RELEASE_DIR" -name "*.backup" -delete
find "$RELEASE_DIR" -name "*.bak" -delete
# 開発用ファイル
rm -f "$RELEASE_DIR/app/backend/create_test_user.py"
rm -f "$RELEASE_DIR/app/backend/create_sample_data.py"
rm -f "$RELEASE_DIR/app/backend/simple_server.py"
rm -f "$RELEASE_DIR/app/backend/PYDANTIC_V2_MIGRATION.md"

# ZIPファイル作成
echo "📦 ZIPファイルを作成中..."
cd release
zip -r "monthly-report-${VERSION}.zip" "monthly-report-${VERSION}/" -x "*.git*" -x "*__pycache__*"
cd ..

# ファイルサイズ確認
SIZE=$(du -h "release/monthly-report-${VERSION}.zip" | cut -f1)
echo ""
echo "✅ リリース作成完了！"
echo "=========================================="
echo "📦 ファイル: release/monthly-report-${VERSION}.zip"
echo "📏 サイズ: $SIZE"
echo ""
echo "📁 フォルダ構成:"
echo "   monthly-report-${VERSION}/"
echo "   ├── 🚀Mac_ここをダブルクリック.command"
echo "   ├── 🚀Windows_ここを右クリック_管理者として実行.bat"
echo "   ├── はじめにお読みください.txt"
echo "   ├── app/                       ← アプリ本体（触らないでください）"
echo "   └── docs/                      ← 詳しい説明書"
echo ""
echo "🚀 GitHubでリリースを作成："
echo "   https://github.com/simeji03/Auto_Creation_Report/releases/new"
echo "   タグ: ${VERSION}"