@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo 🚀 月報作成支援ツール - Windows版起動スクリプト
echo ================================================
echo.

:: Python環境チェック
echo 🐍 Python環境をチェック中...
python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Pythonがインストールされていません
    echo.
    echo 📥 Pythonをインストールしてください：
    echo    1. https://www.python.org/downloads/ を開く
    echo    2. 「Download Python」黄色いボタンをクリック
    echo    3. ダウンロードしたファイルをダブルクリック
    echo    4. ⚠️ 重要：「Add Python to PATH」にチェックを入れる
    echo    5. インストール完了後、このファイルをもう一度ダブルクリック
    echo.
    pause
    exit /b 1
)

:: Node.js環境チェック
echo 🟢 Pythonが見つかりました
echo 📱 Node.js環境をチェック中...
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Node.jsがインストールされていません
    echo.
    echo 📥 Node.jsをインストールしてください：
    echo    1. https://nodejs.org/ を開く
    echo    2. 左の「LTS」版（推奨版）をクリック
    echo    3. ダウンロードしたファイルをダブルクリック
    echo    4. インストール完了後、このファイルをもう一度ダブルクリック
    echo.
    pause
    exit /b 1
)

echo 🟢 Node.jsが見つかりました
echo.

:: バックエンド起動
echo 🐍 バックエンドを起動中...
cd /d "%~dp0backend"

:: 仮想環境の作成・アクティベート
if not exist "venv" (
    echo 📦 Python仮想環境を作成中...
    python -m venv venv
)

call venv\Scripts\activate.bat

:: 依存関係のインストール
echo 📦 必要なライブラリをインストール中...
pip install -r requirements.txt >nul 2>&1

:: バックエンド起動
echo 🟢 バックエンドサーバーを起動中...
start "" python main.py

cd /d "%~dp0"

:: 少し待機
echo ⏳ 3秒待機中...
timeout /t 3 /nobreak >nul

:: フロントエンド起動
echo 📱 フロントエンドを起動中...
cd /d "%~dp0frontend"

:: npm install（初回のみ）
if not exist "node_modules" (
    echo 📦 フロントエンド依存関係をインストール中...
    npm install
)

echo 🟢 フロントエンドサーバーを起動中...
start "" npm start

cd /d "%~dp0"

echo.
echo ✅ 起動完了！
echo ================================================
echo 🌐 ブラウザが自動で開くまで少しお待ちください...
echo 📱 フロントエンド: http://localhost:3456
echo 🔧 バックエンド: http://localhost:8000
echo.
echo 💡 アプリを停止したい場合：
echo    黒い画面（コマンドプロンプト）を閉じてください
echo.
echo 🎉 月報作成を楽しんでください！
echo ================================================

:: ブラウザを開く（少し遅延させる）
timeout /t 10 /nobreak >nul
start "" "http://localhost:3456"

pause