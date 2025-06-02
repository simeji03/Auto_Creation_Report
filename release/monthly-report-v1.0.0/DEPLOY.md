# 🚀 月報作成支援ツール - デプロイガイド

## 📦 配布方法の選択

### 1. Docker Compose（推奨） - 5分でセットアップ

**必要なもの:**
- Docker Desktop（Windows/Mac）またはDocker Engine（Linux）

**手順:**
```bash
# 1. リポジトリをクローン
git clone https://github.com/your-repo/auto-report.git
cd auto-report

# 2. 環境変数を設定
cp .env.example .env
# .envファイルを編集してSECRET_KEYを変更

# 3. Dockerコンテナを起動
docker-compose -f docker-compose.prod.yml up -d

# 4. ブラウザでアクセス
# http://localhost:3456
```

**停止方法:**
```bash
docker-compose -f docker-compose.prod.yml down
```

### 2. 手動セットアップ - 開発者向け

**必要なもの:**
- Node.js 18以上
- Python 3.9以上
- Git

**手順:**
```bash
# セットアップスクリプトを実行
./setup.sh

# または手動で
cd backend
python -m venv venv
source venv/bin/activate  # Windowsは venv\Scripts\activate
pip install -r requirements.txt
python main.py &

cd ../frontend
npm install
npm run build
npm install -g serve
serve -s build -l 3456
```

### 3. クラウドデプロイ - 本番環境向け

#### Frontend（Vercel）
```bash
# Vercel CLIをインストール
npm i -g vercel

# frontendディレクトリで
cd frontend
vercel
```

#### Backend（Railway/Render）
1. GitHubにプッシュ
2. Railway/Renderでリポジトリを接続
3. 環境変数を設定
4. デプロイ

## 🔧 設定項目

### 必須設定
- `SECRET_KEY`: セキュリティ用の秘密鍵（本番環境では必ず変更）
- `DATABASE_URL`: データベースの場所（デフォルトはSQLite）

### オプション設定
- `ALLOWED_ORIGINS`: CORS許可するフロントエンドのURL
- `DEBUG`: デバッグモード（本番では必ずfalse）

## 📱 使い方

1. **初回アクセス**
   - http://localhost:3456 にアクセス
   - 「設定」からOpenAI APIキーを登録

2. **月報作成**
   - 「対話型月報作成」から音声入力
   - AI生成ボタンで自動作成

## ⚠️ 注意事項

### セキュリティ
- 本番環境では必ず`SECRET_KEY`を変更
- HTTPSを使用することを推奨
- APIキーは各ユーザーが自分で管理

### データ管理
- SQLiteデータベースは`data/`ディレクトリに保存
- 定期的なバックアップを推奨
- Dockerの場合、volumeでデータが永続化

### パフォーマンス
- 同時ユーザー数が多い場合はPostgreSQLへの移行を検討
- フロントエンドはCDN配信を推奨

## 🆘 トラブルシューティング

### ポートが使用中
```bash
# 3456ポートを使用しているプロセスを確認
lsof -i :3456  # Mac/Linux
netstat -ano | findstr :3456  # Windows

# 別のポートを使用
PORT=3457 serve -s build -l $PORT
```

### Dockerが起動しない
```bash
# ログを確認
docker-compose -f docker-compose.prod.yml logs

# 再ビルド
docker-compose -f docker-compose.prod.yml build --no-cache
```

### データベースエラー
```bash
# 権限を修正
chmod 755 data/
chmod 644 data/monthly_reports.db
```

## 📄 ライセンス

MITライセンス - 自由に使用・改変・配布可能