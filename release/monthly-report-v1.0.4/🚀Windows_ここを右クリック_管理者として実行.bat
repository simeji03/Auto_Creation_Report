@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
color 0B
cls

echo ╔════════════════════════════════════════╗
echo ║    🚀 月報作成支援ツール v1.0.4       ║
echo ║                                        ║
echo ║    起動準備を開始します...             ║
echo ╚════════════════════════════════════════╝
echo.

:: 管理者権限チェック
net session >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo.
    echo ❌ 管理者権限が必要です
    echo.
    echo 🔧 正しい起動方法：
    echo.
    echo   1. このファイルを右クリック
    echo   2. 「管理者として実行」を選択
    echo.
    echo ※ユーザーアカウント制御が表示されたら「はい」をクリック
    echo.
    pause
    exit /b 1
)

:: Dockerチェック
echo 🐳 Docker Desktopを確認中...
docker --version >nul 2>&1
if !errorlevel! neq 0 (
    color 0C
    echo.
    echo ❌ Docker Desktopがインストールされていません
    echo.
    echo 📥 かんたんインストール方法：
    echo.
    echo   1. 以下のリンクをブラウザで開く：
    echo      https://www.docker.com/products/docker-desktop/
    echo.
    echo   2. 「Download for Windows」をクリック
    echo.
    echo   3. ダウンロードしたファイルをダブルクリック
    echo.
    echo   4. インストール完了後、PCを再起動
    echo.
    echo   5. Docker Desktopを起動（デスクトップのアイコン）
    echo.
    echo   6. このファイルをもう一度実行
    echo.
    echo 詳しくは docs フォルダの説明書をご覧ください
    echo.
    pause
    exit /b 1
)

docker info >nul 2>&1
if !errorlevel! neq 0 (
    color 0E
    echo.
    echo ⚠️  Docker Desktopが起動していません
    echo.
    echo 🐳 起動方法：
    echo.
    echo   1. デスクトップの Docker Desktop アイコンをダブルクリック
    echo      （または）
    echo      スタートメニューから「Docker Desktop」を検索して起動
    echo.
    echo   2. タスクバーにクジラのアイコン🐳が表示されるまで待つ（約1分）
    echo.
    echo   3. このファイルをもう一度実行
    echo.
    pause
    exit /b 1
)

color 0A
echo ✅ Docker Desktop 確認OK
echo.

:: 起動確認
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎯 月報作成ツールを起動します
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 準備ができたら Enter キーを押してください
echo （キャンセルする場合はウィンドウを閉じる）
pause >nul

:: メインの起動スクリプトを実行
echo.
echo 🚀 起動中...
if exist "app\manual-start.bat" (
    cd app
    call manual-start.bat
) else if exist "manual-start.bat" (
    call manual-start.bat
) else (
    color 0C
    echo.
    echo ❌ エラー: 起動ファイルが見つかりません
    echo ZIPファイルを正しく解凍したか確認してください
    echo.
    pause
    exit /b 1
)