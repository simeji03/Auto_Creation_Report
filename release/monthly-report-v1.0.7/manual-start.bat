@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo 🚀 月報作成支援ツール - スマート起動スクリプト
echo =============================================
echo.

:: 管理者権限チェック
net session >nul 2>&1
if !errorlevel! neq 0 (
    echo ⚠️  管理者権限が必要です
    echo.
    echo このファイルを右クリックして、
    echo 「管理者として実行」を選択してください
    echo.
    pause
    exit /b 1
)

:: Docker起動確認
docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Dockerが起動していません
    echo.
    echo 🐳 Docker Desktopを起動してください：
    echo    1. スタートメニューから「Docker Desktop」を検索
    echo    2. Docker Desktopをクリックして起動
    echo    3. タスクバーにクジラのアイコン🐳が表示されるまで待つ
    echo    4. このファイルをもう一度実行
    echo.
    pause
    exit /b 1
)

:: Docker Composeコマンドの検出
docker-compose version >nul 2>&1
if !errorlevel! equ 0 (
    set DOCKER_COMPOSE=docker-compose
) else (
    docker compose version >nul 2>&1
    if !errorlevel! equ 0 (
        set DOCKER_COMPOSE=docker compose
    ) else (
        echo ❌ Docker Composeが見つかりません
        echo Docker Desktopを最新版にアップデートしてください
        pause
        exit /b 1
    )
)

:: スクリプトのディレクトリに移動
cd /d "%~dp0"

:: ポートチェック
netstat -an | findstr ":3456" | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    echo ⚠️  ポート 3456 が既に使用されています
    echo 他のアプリケーションを停止してください
    pause
    exit /b 1
)

netstat -an | findstr ":8000" | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    echo ⚠️  ポート 8000 が既に使用されています
    echo 他のアプリケーションを停止してください
    pause
    exit /b 1
)

:: 既存のコンテナを停止（より確実なクリーンアップ）
echo 🔄 既存のコンテナを確認中...

:: 現在のプロジェクトのコンテナを停止
%DOCKER_COMPOSE% -f docker-compose.prod.yml down >nul 2>&1

:: 古い形式のコンテナも念のため停止（monthly-report-*）
for /f "tokens=*" %%i in ('docker ps -a --format "{{.Names}}" ^| findstr /r "^monthly-report-"') do (
    docker stop %%i >nul 2>&1
    docker rm %%i >nul 2>&1
)

:: app-* 形式のコンテナも停止（異なるプロジェクト名の場合）
for /f "tokens=*" %%i in ('docker ps -a --format "{{.Names}}" ^| findstr /r "^app-"') do (
    docker stop %%i >nul 2>&1
    docker rm %%i >nul 2>&1
)

echo ✅ 既存のコンテナをクリーンアップしました

:: ビルドとスタート
echo 🏗️  アプリケーションをビルド中...
echo （初回は5-10分かかる場合があります）
echo.
echo 📊 進捗状況：
echo   1/3 📥 イメージのダウンロード中...
%DOCKER_COMPOSE% -f docker-compose.prod.yml pull
echo   2/3 🔨 アプリケーションのビルド中...
%DOCKER_COMPOSE% -f docker-compose.prod.yml build
echo   3/3 ✅ ビルド完了！

echo.
echo 🚀 アプリケーションを起動中...
%DOCKER_COMPOSE% -f docker-compose.prod.yml up -d

:: ヘルスチェック
echo ⏳ サービスの起動を確認中...
set MAX_ATTEMPTS=30
set ATTEMPT=0

:healthcheck
if !ATTEMPT! geq !MAX_ATTEMPTS! goto failed

curl -s http://localhost:3456 >nul 2>&1
if !errorlevel! neq 0 goto wait

curl -s http://localhost:8000/health >nul 2>&1
if !errorlevel! neq 0 goto wait

:: 成功
echo.
echo ✅ 起動完了！
echo =============================================
echo 🌐 ブラウザが自動で開きます...
echo    開かない場合は以下のURLにアクセス：
echo    http://localhost:3456
echo.
echo 📁 データの保存場所：
echo    %cd%\data
echo.
echo 💡 停止方法：
echo    %DOCKER_COMPOSE% -f docker-compose.prod.yml down
echo.
echo 🔄 ログを見る：
echo    %DOCKER_COMPOSE% -f docker-compose.prod.yml logs -f
echo =============================================

:: ブラウザを開く
timeout /t 3 /nobreak >nul
start "" "http://localhost:3456"
echo.
pause
exit /b 0

:wait
set /a ATTEMPT+=1
echo|set /p=.
timeout /t 2 /nobreak >nul
goto healthcheck

:failed
echo.
echo ❌ 起動に失敗しました
echo.
echo 🔍 トラブルシューティング：
echo 1. Docker Desktopが起動しているか確認
echo 2. ウイルス対策ソフトがDockerをブロックしていないか確認
echo 3. 以下のコマンドでログを確認：
echo    %DOCKER_COMPOSE% -f docker-compose.prod.yml logs
echo.
echo 📧 サポート: コミュニティ管理者にご連絡ください
pause
exit /b 1