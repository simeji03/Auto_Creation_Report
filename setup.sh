#!/bin/bash

echo "🚀 月報作成支援ツール セットアップ開始"

# 色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# エラー時の処理
set -e
trap 'echo -e "${RED}❌ セットアップ中にエラーが発生しました${NC}"; exit 1' ERR

# 必要なツールの確認
echo -e "${BLUE}📋 必要な依存関係を確認中...${NC}"

# Python の確認
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 が見つかりません。Python 3.9+ をインストールしてください。${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python3: $(python3 --version)${NC}"

# pip の確認
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip が見つかりません。${NC}"
    exit 1
fi
echo -e "${GREEN}✅ pip: 確認済み${NC}"

# Node.js の確認
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js が見つかりません。Node.js 18+ をインストールしてください。${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# npm の確認
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm が見つかりません。${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"

echo -e "${GREEN}✅ 必要な依存関係が確認できました${NC}"

# バックエンドのセットアップ
echo -e "${BLUE}🐍 バックエンドをセットアップ中...${NC}"
cd backend

# 古い仮想環境を削除
if [ -d "venv" ]; then
    echo -e "${YELLOW}既存の仮想環境を削除中...${NC}"
    rm -rf venv
fi

# 仮想環境の作成
echo -e "${YELLOW}仮想環境を作成中...${NC}"
python3 -m venv venv

# 仮想環境のアクティベート
echo -e "${YELLOW}仮想環境をアクティベート中...${NC}"
source venv/bin/activate

# pipのアップグレード
echo -e "${YELLOW}pipをアップグレード中...${NC}"
pip install --upgrade pip

# 依存関係のインストール
echo -e "${YELLOW}Python パッケージをインストール中...${NC}"
pip install -r requirements.txt

# 環境変数ファイルの作成
if [ ! -f .env ]; then
    echo -e "${YELLOW}環境変数ファイルを作成中...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  .env ファイルを編集して、必要な設定を行ってください${NC}"
fi

# データベースの初期化
echo -e "${YELLOW}データベースを初期化中...${NC}"
python -c "from database import create_tables; create_tables(); print('✅ データベースが正常に初期化されました')"

cd ..

# フロントエンドのセットアップ
echo -e "${BLUE}⚛️  フロントエンドをセットアップ中...${NC}"
cd frontend

# node_modulesをクリーンアップ
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}既存のnode_modulesを削除中...${NC}"
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo -e "${YELLOW}package-lock.jsonを削除中...${NC}"
    rm package-lock.json
fi

# 依存関係のインストール
echo -e "${YELLOW}Node.js パッケージをインストール中...${NC}"
npm install

# PostCSS設定ファイルの作成
echo -e "${YELLOW}PostCSS設定を作成中...${NC}"
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

cd ..

# 成功メッセージ
echo ""
echo -e "${GREEN}🎉 セットアップが完了しました！${NC}"
echo ""
echo -e "${BLUE}🚀 アプリケーションの起動方法:${NC}"
echo ""
echo -e "${YELLOW}1. バックエンドを起動 (このターミナル):${NC}"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo -e "${YELLOW}2. フロントエンドを起動 (新しいターミナルで):${NC}"
echo "   cd frontend"
echo "   npm start"
echo ""
echo -e "${YELLOW}3. ブラウザでアクセス:${NC}"
echo "   http://localhost:3456"
echo ""
echo -e "${YELLOW}📝 注意事項:${NC}"
echo "   - バックエンド: http://localhost:8765"
echo "   - フロントエンド: http://localhost:3456"
echo "   - OpenAI APIキーが必要な場合は backend/.env で設定してください"
echo "   - 初回起動時にユーザー登録が必要です"