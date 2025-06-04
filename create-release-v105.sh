#!/bin/bash

echo "🚀 月報作成支援ツール - リリース作成 v1.0.5"
echo "==========================================="
echo ""

VERSION="v1.0.5"
RELEASE_DIR="release/monthly-report-${VERSION}"

# リリースディレクトリ作成
echo "📁 リリースディレクトリを作成中..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/system"

# トップレベルのファイル（最小限）
echo "📋 起動ファイルを配置中..."

# Mac用起動スクリプト（署名問題対策込み）
cat > "$RELEASE_DIR/manual-start.command" << 'EOF'
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
EOF

# Windows用起動スクリプト
cat > "$RELEASE_DIR/manual-start.bat" << 'EOF'
@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0\system"

:: 管理者権限チェック
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo 管理者権限が必要です
    echo.
    echo このファイルを右クリックして
    echo 「管理者として実行」を選択してください
    echo.
    pause
    exit /b 1
)

:: Dockerチェック
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo Docker Desktopがインストールされていません
    echo.
    echo インストール方法：
    echo 1. https://www.docker.com/products/docker-desktop/ を開く
    echo 2. 「Download for Windows」をクリック
    echo 3. ダウンロードしたファイルをダブルクリック
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo Docker Desktopが起動していません
    echo.
    echo 起動方法：
    echo 1. デスクトップのDocker Desktopアイコンをダブルクリック
    echo 2. タスクバーにクジラのアイコンが表示されるまで待つ
    echo 3. このファイルをもう一度実行
    echo.
    pause
    exit /b 1
)

:: 既存のコンテナを停止
docker-compose -f docker-compose.prod.yml down 2>nul

:: ビルドと起動
echo.
echo アプリケーションを準備中...
echo （初回は5-10分かかる場合があります）
echo.

docker-compose -f docker-compose.prod.yml up -d --build

:: 起動確認
echo.
echo サービスの起動を確認中...
set ATTEMPT=0
:CHECK_LOOP
if !ATTEMPT! geq 30 goto FAILED
curl -s http://localhost:3456 >nul 2>&1
if !errorlevel! equ 0 (
    curl -s http://localhost:8000/health >nul 2>&1
    if !errorlevel! equ 0 (
        echo.
        echo 起動完了！
        echo.
        echo ブラウザで以下のURLにアクセス：
        echo http://localhost:3456
        echo.
        start http://localhost:3456
        exit /b 0
    )
)
set /a ATTEMPT+=1
timeout /t 2 /nobreak >nul
echo.
goto CHECK_LOOP

:FAILED
echo.
echo 起動に失敗しました
echo ログを確認: docker-compose -f docker-compose.prod.yml logs
pause
exit /b 1
EOF

# シンプルなREADME
cat > "$RELEASE_DIR/README.txt" << 'EOF'
月報作成支援ツール
==================

【Mac初回起動時の重要な手順】

「開発元が未確認のため開けません」と表示される場合:

1. manual-start.command を右クリック
2. 「開く」を選択
3. 警告画面で「開く」をクリック

これは初回のみ必要です。2回目以降はダブルクリックで起動できます。

【通常の起動方法】

Mac:
  manual-start.command をダブルクリック

Windows:
  manual-start.bat を右クリック→「管理者として実行」

【必要なソフト】

Docker Desktop（無料）
https://www.docker.com/products/docker-desktop/

【初回セットアップ】

1. Docker Desktopをインストール
2. Docker Desktopを起動（クジラのアイコンが表示されるまで待つ）
3. 起動ファイルを実行（Macは右クリック→開く）

【トラブル時】

起動しない場合:
- Docker Desktopが起動しているか確認
- ポート3456, 8000が使用されていないか確認

【データの保存場所】

system/data フォルダ内に保存されます

【アンインストール】

このフォルダを削除するだけです
EOF

# 初回起動フラグ
touch "$RELEASE_DIR/.first_run"

# システムファイルをsystemフォルダに配置
echo "📦 システムファイルを整理中..."
cp -r frontend "$RELEASE_DIR/system/"
cp -r backend "$RELEASE_DIR/system/"
cp docker-compose.prod.yml "$RELEASE_DIR/system/"
cp Dockerfile.frontend "$RELEASE_DIR/system/"
cp Dockerfile.backend "$RELEASE_DIR/system/"

# 実行権限を付与
chmod +x "$RELEASE_DIR/manual-start.command"

# クリーンアップ
echo "🧹 不要ファイルを削除中..."
rm -rf "$RELEASE_DIR/system/frontend/node_modules"
rm -rf "$RELEASE_DIR/system/frontend/build"
rm -rf "$RELEASE_DIR/system/backend/venv"
rm -rf "$RELEASE_DIR/system/backend/__pycache__"
find "$RELEASE_DIR" -name "*.pyc" -delete
find "$RELEASE_DIR" -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
find "$RELEASE_DIR" -name ".env" -delete
find "$RELEASE_DIR" -name "*.db" -delete
find "$RELEASE_DIR" -name "*.log" -delete
find "$RELEASE_DIR" -name ".DS_Store" -delete
rm -f "$RELEASE_DIR/system/backend/create_test_user.py"
rm -f "$RELEASE_DIR/system/backend/create_sample_data.py"
rm -f "$RELEASE_DIR/system/backend/simple_server.py"

# ZIPファイル作成
echo "📦 ZIPファイルを作成中..."
cd release
zip -r "monthly-report-${VERSION}.zip" "monthly-report-${VERSION}/" -x "*.git*"
cd ..

# 完了
SIZE=$(du -h "release/monthly-report-${VERSION}.zip" | cut -f1)
echo ""
echo "✅ リリース作成完了！"
echo "==========================================="
echo "📦 ファイル: release/monthly-report-${VERSION}.zip"
echo "📏 サイズ: $SIZE"
echo ""
echo "📁 シンプルな構成:"
echo "   monthly-report-${VERSION}/"
echo "   ├── manual-start.command  (Mac用)"
echo "   ├── manual-start.bat      (Windows用)"
echo "   ├── README.txt"
echo "   └── system/               (アプリ本体)"
echo ""
echo "✨ 特徴:"
echo "   - トップレベルは3ファイルのみ"
echo "   - Mac署名問題を自動解決"
echo "   - 分かりやすいファイル名"