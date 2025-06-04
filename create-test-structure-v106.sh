#!/bin/bash

echo "🧪 月報作成支援ツール - テスト構造作成 v1.0.6"
echo "==========================================="
echo ""

# テスト用ディレクトリ作成
TEST_DIR="test-env/v1.0.6-test"
echo "📁 テスト環境を作成中..."
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

# 3つの構造を比較テスト
echo "🔬 3つの構造パターンをテスト..."

# パターン1: 隠しフォルダ（.app）
echo ""
echo "パターン1: 隠しフォルダ構造"
PATTERN1="$TEST_DIR/pattern1-hidden"
mkdir -p "$PATTERN1/.app"
cat > "$PATTERN1/manual-start.command" << 'EOF'
#!/bin/bash
echo "テスト: 隠しフォルダ構造"
cd "$(dirname "$0")/.app"
pwd
ls -la
EOF
cat > "$PATTERN1/README.txt" << 'EOF'
隠しフォルダ構造のテスト
EOF
chmod +x "$PATTERN1/manual-start.command"
echo "作成完了: $PATTERN1"

# パターン2: アンダースコア付き（_app）  
echo ""
echo "パターン2: アンダースコア構造"
PATTERN2="$TEST_DIR/pattern2-underscore"
mkdir -p "$PATTERN2/_app"
cat > "$PATTERN2/manual-start.command" << 'EOF'
#!/bin/bash
echo "テスト: アンダースコア構造"
cd "$(dirname "$0")/_app"
pwd
ls -la
EOF
cat > "$PATTERN2/README.txt" << 'EOF'
アンダースコア構造のテスト
EOF
chmod +x "$PATTERN2/manual-start.command"
echo "作成完了: $PATTERN2"

# パターン3: シンプル（app）
echo ""
echo "パターン3: シンプル構造"
PATTERN3="$TEST_DIR/pattern3-simple"
mkdir -p "$PATTERN3/app"
cat > "$PATTERN3/manual-start.command" << 'EOF'
#!/bin/bash
echo "テスト: シンプル構造"
cd "$(dirname "$0")/app"
pwd
ls -la
EOF
cat > "$PATTERN3/README.txt" << 'EOF'
シンプル構造のテスト
EOF
chmod +x "$PATTERN3/manual-start.command"
echo "作成完了: $PATTERN3"

# 実際のアプリ構造でテスト（パターン2を採用）
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 実際のアプリでテスト（_appフォルダ構造）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REAL_TEST="$TEST_DIR/real-app-test"
mkdir -p "$REAL_TEST/_app"

# 起動スクリプト（Mac用）
cat > "$REAL_TEST/manual-start.command" << 'EOF'
#!/bin/bash

echo "🚀 月報作成支援ツール - 起動中"
echo "================================"

# スクリプトのディレクトリに移動
cd "$(dirname "$0")"

# 初回起動時の署名問題を自動解決
if [[ -f ".first_run" ]]; then
    echo "🔓 初回起動の準備中..."
    xattr -cr . 2>/dev/null
    find . -name "*.sh" -o -name "*.command" | xargs chmod +x 2>/dev/null
    rm -f .first_run
    echo "✅ 準備完了"
    echo ""
fi

# アプリディレクトリに移動
cd "_app"

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
cat > "$REAL_TEST/manual-start.bat" << 'EOF'
@echo off
setlocal enabledelayedexpansion

:: アプリディレクトリに移動
cd /d "%~dp0\_app"

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

# README
cat > "$REAL_TEST/README.txt" << 'EOF'
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

_app/data フォルダ内に保存されます

【アンインストール】

このフォルダを削除するだけです
EOF

# 初回起動フラグ
touch "$REAL_TEST/.first_run"

# アプリファイルをコピー（軽量版）
echo "📦 アプリファイルを配置中..."
cp -r frontend "$REAL_TEST/_app/"
cp -r backend "$REAL_TEST/_app/"
cp docker-compose.prod.yml "$REAL_TEST/_app/"
cp Dockerfile.frontend "$REAL_TEST/_app/"
cp Dockerfile.backend "$REAL_TEST/_app/"

# 実行権限を付与
chmod +x "$REAL_TEST/manual-start.command"

echo ""
echo "✅ テスト構造作成完了！"
echo ""
echo "📂 構造確認:"
echo "   $REAL_TEST/"
echo "   ├── manual-start.command  (Mac用)"
echo "   ├── manual-start.bat      (Windows用)"
echo "   ├── README.txt"
echo "   └── _app/                 (アプリ本体)"
echo ""
echo "🧪 テスト方法:"
echo "1. cd $REAL_TEST"
echo "2. ./manual-start.command"