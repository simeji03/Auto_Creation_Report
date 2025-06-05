# 🚀 月報作成支援ツール - デプロイガイド v1.0.6

本ガイドでは、月報作成支援ツールをローカル環境や本番環境にデプロイする方法を説明します。

## 📦 デプロイ方法の選択

### 1. Docker Compose（推奨） - エンドユーザー向け

**必要なもの:**
- Docker Desktop（Windows/Mac）またはDocker Engine（Linux）
- 最小2GB RAM、4GB推奨

**環境変数の設定:**
```bash
# .envファイルを作成（オプション）
cat > .env << 'EOF'
SECRET_KEY=your-super-secret-key-change-this-in-production
ALLOWED_ORIGINS=http://localhost:3456
DEBUG=false
DATABASE_URL=sqlite:///./data/monthly_reports.db
EOF
```

**起動手順:**
```bash
# 1. リポジトリをクローンまたはリリースをダウンロード
git clone https://github.com/simeji03/Auto_Creation_Report.git
cd Auto_Creation_Report

# 2. 本番用Dockerコンテナを起動
docker-compose -f docker-compose.prod.yml up -d

# 3. ログでステータス確認
docker-compose -f docker-compose.prod.yml logs -f

# 4. ブラウザでアクセス
# http://localhost:3456
```

**管理コマンド:**
```bash
# 停止
docker-compose -f docker-compose.prod.yml down

# 再起動
docker-compose -f docker-compose.prod.yml restart

# ログ確認
docker-compose -f docker-compose.prod.yml logs -f

# データを保持したまま更新
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 2. 手動セットアップ - 開発者向け

**必要なもの:**
- Node.js 18以上
- Python 3.9以上
- Git

**バックエンドのセットアップ:**
```bash
cd backend

# 仮想環境を作成
python -m venv venv

# 仮想環境を有効化
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# 依存関係をインストール
pip install -r requirements.txt

# 環境変数を設定（オプション）
cp env.example .env
# .envファイルを編集

# サーバーを起動
python main.py
```

**フロントエンドのセットアップ:**
```bash
cd frontend

# 依存関係をインストール
npm install

# 本番ビルド
npm run build

# 静的ファイルサーバーを起動
npx serve -s build -l 3456

# または開発サーバー
npm start
```

**開発時のコマンド:**
```bash
# バックエンド開発サーバー（ホットリロード有効）
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# フロントエンド開発サーバー
cd frontend
npm start
```

### 3. クラウドデプロイ - 本番環境向け

#### Frontend（Vercel推奨）
```bash
# Vercel CLIをインストール
npm install -g vercel

# frontendディレクトリでデプロイ
cd frontend
npm run build
vercel --prod
```

**Vercel設定 (vercel.json):**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "https://your-backend-url.com"
  }
}
```

#### Backend（Railway/Render/Heroku）

**Railway デプロイ:**
```bash
# Railway CLIインストール
npm install -g @railway/cli

# ログインとデプロイ
railway login
railway deploy
```

**Render デプロイ設定:**
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Root Directory: `backend`

**Heroku デプロイ:**
```bash
# Heroku CLIでセットアップ
heroku create your-app-name
heroku config:set SECRET_KEY=your-secret-key
heroku config:set ALLOWED_ORIGINS=https://your-frontend-domain.com
git subtree push --prefix backend heroku main
```

## 🔧 環境変数設定

### 必須設定

| 変数名 | 説明 | デフォルト値 | 例 |
|--------|------|-------------|----|
| `SECRET_KEY` | JWT認証用の秘密鍵 | なし（必須） | `super-secret-key-change-in-production` |
| `ALLOWED_ORIGINS` | CORS許可するURL | `http://localhost:3456` | `https://your-domain.com,http://localhost:3456` |

### オプション設定

| 変数名 | 説明 | デフォルト値 | 例 |
|--------|------|-------------|----|
| `DEBUG` | デバッグモード | `false` | `true`（開発時のみ） |
| `DATABASE_URL` | データベースURL | `sqlite:///./data/monthly_reports.db` | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | OpenAI APIキー | なし（オプション） | `sk-...` |
| `MAX_UPLOAD_SIZE` | アップロード上限 | `10MB` | `50MB` |
| `SESSION_TIMEOUT` | セッション有効期限 | `24h` | `7d` |

### 本番環境での推奨設定

**.env.production 例:**
```bash
# セキュリティ
SECRET_KEY=your-super-strong-secret-key-minimum-32-characters
DEBUG=false
ALLOWED_ORIGINS=https://your-domain.com

# データベース（PostgreSQL推奨）
DATABASE_URL=postgresql://username:password@host:5432/monthly_reports

# パフォーマンス
SESSION_TIMEOUT=7d
MAX_UPLOAD_SIZE=50MB

# 機能
OPENAI_API_KEY=sk-your-openai-api-key
```

## 🌐 本番環境での追加設定

### SSL/HTTPS設定

**Nginxリバースプロキシ設定例:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3456;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PostgreSQLデータベース設定

**データベース作成:**
```sql
CREATE DATABASE monthly_reports;
CREATE USER monthly_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE monthly_reports TO monthly_user;
```

**接続設定:**
```bash
DATABASE_URL=postgresql://monthly_user:secure_password@localhost:5432/monthly_reports
```

### バックアップとメンテナンス

**自動バックアップスクリプト:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/monthly-reports"

# SQLiteの場合
cp data/monthly_reports.db "$BACKUP_DIR/monthly_reports_$DATE.db"

# PostgreSQLの場合
# pg_dump monthly_reports > "$BACKUP_DIR/monthly_reports_$DATE.sql"

# 古いバックアップを削除（30日以上）
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Cronでスケジュール設定:**
```bash
# 毎日午前2時にバックアップ
0 2 * * * /path/to/backup.sh
```

## ⚠️ 本番環境での注意事項

### セキュリティチェックリスト

- [ ] `SECRET_KEY`を安全な値に変更（最低32文字）
- [ ] `DEBUG=false`に設定
- [ ] HTTPS/TLSを有効化
- [ ] ファイアウォールで不要なポートを閉鎖
- [ ] データベースのアクセス制限
- [ ] 定期的なセキュリティアップデート
- [ ] APIキーの適切な管理（環境変数使用）
- [ ] ログ監視の設定

### パフォーマンス最適化

**同時ユーザー数による推奨構成:**

| ユーザー数 | データベース | サーバー構成 | 追加設定 |
|-----------|-------------|-------------|----------|
| ~10人 | SQLite | 2GB RAM, 1CPU | デフォルト設定 |
| ~50人 | PostgreSQL | 4GB RAM, 2CPU | 接続プール設定 |
| ~200人 | PostgreSQL + Redis | 8GB RAM, 4CPU | ロードバランサー |
| 200人以上 | PostgreSQL + Redis | クラスター構成 | CDN + キャッシュ |

**パフォーマンス向上の設定:**
```bash
# FastAPI設定
WORKERS=4
MAX_REQUESTS=1000
TIMEOUT=30

# PostgreSQL設定
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_TIMEOUT=10
```

### 監視とログ

**ログ設定:**
```bash
# Docker Composeでログローテーション
version: '3.8'
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**ヘルスチェック設定:**
```bash
# backend/health_check.py
from fastapi import APIRouter
import psutil
import sqlite3

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "memory_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "database": "connected"  # DB接続チェック
    }
```

## 🆘 デプロイ時のトラブルシューティング

### Docker関連の問題

**問題: "ポートが使用中"エラー**
```bash
# 使用中のポートを確認
docker ps
netstat -tulpn | grep :3456  # Linux
lsof -i :3456  # Mac
netstat -ano | findstr :3456  # Windows

# 実行中のコンテナを停止
docker-compose -f docker-compose.prod.yml down
docker stop $(docker ps -q)
```

**問題: "イメージのビルドに失敗"**
```bash
# キャッシュをクリアして再ビルド
docker system prune -f
docker-compose -f docker-compose.prod.yml build --no-cache

# ログを確認
docker-compose -f docker-compose.prod.yml logs -f
```

**問題: "データが永続化されない"**
```bash
# Volumeの設定を確認
docker volume ls
docker volume inspect auto_creation_report_data

# 権限を修正
sudo chown -R 1000:1000 data/
chmod 755 data/
chmod 644 data/*.db
```

### データベース関連の問題

**SQLite権限エラー:**
```bash
# ディレクトリとファイルの権限を設定
mkdir -p data
chmod 755 data/
touch data/monthly_reports.db
chmod 644 data/monthly_reports.db
```

**PostgreSQL接続エラー:**
```bash
# 接続をテスト
psql -h localhost -U monthly_user -d monthly_reports

# 設定を確認
echo $DATABASE_URL

# PostgreSQLサービス状態を確認
sudo systemctl status postgresql
```

### ネットワーク関連の問題

**CORS エラー:**
```bash
# 環境変数でオリジンを設定
ALLOWED_ORIGINS="https://your-domain.com,http://localhost:3456"

# ワイルドカード使用（開発時のみ）
ALLOWED_ORIGINS="*"
```

**SSL/TLS 証明書エラー:**
```bash
# Let's Encryptで証明書取得
sudo apt install certbot
sudo certbot --nginx -d your-domain.com

# 証明書の有効期限確認
sudo certbot certificates
```

### パフォーマンス問題

**メモリ不足:**
```bash
# メモリ使用量を監視
docker stats

# メモリ制限を設定
docker-compose.yml:
services:
  backend:
    mem_limit: 512m
    memswap_limit: 512m
```

**ディスク容量不足:**
```bash
# ディスク使用量確認
df -h
docker system df

# 不要なイメージとコンテナを削除
docker system prune -a
docker volume prune
```

### ログ確認とデバッグ

**詳細ログの有効化:**
```bash
# デバッグモードで起動
DEBUG=true docker-compose -f docker-compose.prod.yml up

# 特定のサービスのログを確認
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

**アプリケーションログの確認:**
```bash
# コンテナ内でログを確認
docker exec -it <container_id> tail -f /var/log/app.log

# バックエンドAPIの健全性チェック
curl http://localhost:8000/health
curl http://localhost:8000/docs  # API文書
```

## 📄 ライセンスとサポート

### ライセンス
MITライセンス - 自由に使用・改変・配布可能

### サポート情報
- **技術サポート**: [GitHub Issues](https://github.com/simeji03/Auto_Creation_Report/issues)
- **機能リクエスト**: [GitHub Discussions](https://github.com/simeji03/Auto_Creation_Report/discussions)
- **ドキュメント**: [Wiki](https://github.com/simeji03/Auto_Creation_Report/wiki)
- **リリースノート**: [Releases](https://github.com/simeji03/Auto_Creation_Report/releases)

### バージョン情報
- **現在のバージョン**: v1.0.6
- **サポート期間**: 長期サポート（LTS）
- **最低要件**: Docker 20.10+, Docker Compose 2.0+