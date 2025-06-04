#!/bin/bash

echo "🚀 月報作成支援ツール - リリース作成スクリプト"
echo "============================================="
echo ""

# バージョン入力
echo "リリースバージョンを入力してください (例: v1.0.0):"
read VERSION

if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ バージョン形式が正しくありません (v1.0.0の形式で入力してください)"
    exit 1
fi

# リリースディレクトリ作成
RELEASE_DIR="release/monthly-report-${VERSION}"
echo "📁 リリースディレクトリを作成中..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# 必要なファイルをコピー
echo "📋 ファイルをコピー中..."
# フロントエンド
cp -r frontend "$RELEASE_DIR/"
# バックエンド
cp -r backend "$RELEASE_DIR/"
# Docker関連
cp docker-compose.prod.yml "$RELEASE_DIR/"
cp Dockerfile.frontend "$RELEASE_DIR/"
cp Dockerfile.backend "$RELEASE_DIR/"
# スクリプト
cp manual-start.sh "$RELEASE_DIR/"
cp manual-start.command "$RELEASE_DIR/"
cp manual-start.bat "$RELEASE_DIR/"
cp first-time-setup.sh "$RELEASE_DIR/"
cp diagnose.sh "$RELEASE_DIR/"
# ドキュメント
cp README.md "$RELEASE_DIR/"
cp TROUBLESHOOTING.md "$RELEASE_DIR/"
cp DOCKER_INSTALL_GUIDE.md "$RELEASE_DIR/"
cp WINDOWS_DOCKER_SETUP.md "$RELEASE_DIR/"
cp BEGINNER_GUIDE.md "$RELEASE_DIR/" 2>/dev/null || true
cp STEP_BY_STEP_SCREENSHOTS.md "$RELEASE_DIR/" 2>/dev/null || true
cp SIMPLE_STARTUP_GUIDE.md "$RELEASE_DIR/" 2>/dev/null || true
cp ELEMENTARY_README.md "$RELEASE_DIR/" 2>/dev/null || true
# 環境設定例
cp env.example "$RELEASE_DIR/"

# 実行権限を付与
chmod +x "$RELEASE_DIR/manual-start.sh"
chmod +x "$RELEASE_DIR/manual-start.command"
chmod +x "$RELEASE_DIR/first-time-setup.sh"
chmod +x "$RELEASE_DIR/diagnose.sh"

# クリーンアップ
echo "🧹 不要ファイルを削除中..."
# Node.js関連
rm -rf "$RELEASE_DIR/frontend/node_modules"
rm -rf "$RELEASE_DIR/frontend/build"
rm -rf "$RELEASE_DIR/frontend/.cache"
# Python関連
rm -rf "$RELEASE_DIR/backend/venv"
rm -rf "$RELEASE_DIR/backend/__pycache__"
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

# READMEをリリース用に作成
cat > "$RELEASE_DIR/README_FIRST.txt" << 'EOF'
📊 月報作成支援ツール - インストールガイド
=========================================

このツールをお使いいただきありがとうございます！

🚀 かんたん3ステップで始められます：

1. Docker Desktopをインストール
   - 詳しくは「DOCKER_INSTALL_GUIDE.md」を参照

2. このフォルダで起動スクリプトを実行
   - Mac: manual-start.command をダブルクリック
   - Windows: manual-start.bat を右クリック→管理者として実行

3. ブラウザで月報作成開始！
   - 自動で開きます（開かない場合: http://localhost:3456）

📖 詳しい説明書：
- README.md - 全体的な使い方
- TROUBLESHOOTING.md - 困ったときは
- WINDOWS_DOCKER_SETUP.md - Windows特有の設定

🆘 サポート：
コミュニティ管理者にお問い合わせください

楽しい月報作成を！
EOF

# ZIPファイル作成
echo "📦 ZIPファイルを作成中..."
cd release
zip -r "monthly-report-${VERSION}.zip" "monthly-report-${VERSION}/" -x "*.git*" -x "*__pycache__*"
cd ..

# ファイルサイズ確認
SIZE=$(du -h "release/monthly-report-${VERSION}.zip" | cut -f1)
echo ""
echo "✅ リリース作成完了！"
echo "============================================="
echo "📦 ファイル: release/monthly-report-${VERSION}.zip"
echo "📏 サイズ: $SIZE"
echo ""
echo "🚀 次のステップ:"
echo "1. GitHubで新しいリリースを作成"
echo "   https://github.com/simeji03/Auto_Creation_Report/releases/new"
echo "2. タグ: ${VERSION}"
echo "3. リリースタイトル: 月報作成支援ツール ${VERSION}"
echo "4. 作成したZIPファイルをアップロード"
echo ""
echo "📝 リリースノート例:"
echo "---"
echo "## 🎉 月報作成支援ツール ${VERSION}"
echo ""
echo "### 📥 インストール方法"
echo "1. 下記のAssetsから \`monthly-report-${VERSION}.zip\` をダウンロード"
echo "2. ZIPファイルを解凍"
echo "3. Docker Desktopをインストール（未インストールの場合）"
echo "4. 起動スクリプトを実行"
echo ""
echo "### ✨ 主な機能"
echo "- 簡単な月報作成"
echo "- AI支援機能（要OpenAI APIキー）"
echo "- PDF出力"
echo "- データの永続化"
echo ""
echo "### 📋 動作環境"
echo "- Windows 10/11（WSL2対応）"
echo "- macOS 11以降"
echo "- メモリ4GB以上推奨"
echo "- Docker Desktop必須"
echo "---"