@echo off
REM Windows用ダブルクリック起動スクリプト

cd /d "%~dp0"

echo 🚀 月報作成ツール - 簡単セットアップ
echo ====================================
echo.

REM Docker Desktopの確認
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Desktopが起動していません
    echo.
    echo 1. Docker Desktopを起動してください
    echo 2. 起動したらEnterキーを押してください
    pause
)

REM 起動
echo 🔄 ツールを起動中...
call quick-start.sh

echo.
echo ✨ セットアップ完了！
echo.
echo ブラウザが自動で開きます...
timeout /t 2 >nul
start http://localhost:3456

echo.
echo このウィンドウは開いたままにしてください
echo 終了するには Ctrl+C を押してください

REM 終了待ち
pause >nul