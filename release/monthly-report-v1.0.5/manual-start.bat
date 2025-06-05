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
