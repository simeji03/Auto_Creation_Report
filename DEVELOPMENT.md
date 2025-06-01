# 🛠️ 開発ガイド

## 📋 セットアップ手順

### 1. **クイックスタート**
```bash
# リポジトリのクローン
git clone <repository-url>
cd Auto_Creation_Report

# 自動セットアップ実行
chmod +x setup.sh
./setup.sh
```

### 2. **手動セットアップ**

#### バックエンド
```bash
cd backend

# 仮想環境の作成
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
cp env.example .env
# .env ファイルを編集

# データベースの初期化
python -c "from database import create_tables; create_tables()"

# サーバー起動
python main.py
```

#### フロントエンド
```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバー起動
npm start
```

## 🚀 使用方法

### 基本的な使い方

1. **ユーザー登録**
   - `http://localhost:3000/register` でアカウント作成
   - メール・名前・パスワードを入力

2. **月報作成**
   - ダッシュボードから「新しい月報を作成」
   - ステップガイドに従って入力
   - AI支援機能で振り返りや改善案を自動生成

3. **PDF出力**
   - 完成した月報をPDF形式で出力
   - 複数のテンプレートから選択可能

### 主な機能

#### 📊 **データ入力支援**
- フォーム形式で簡単入力
- リアルタイムバリデーション
- 自動保存機能

#### 🤖 **AI支援機能**
- 振り返りポイントの提案
- 改善案の自動生成
- 来月の目標設定支援

#### 📈 **データ分析**
- 月次データの推移グラフ
- 作業時間の分析
- 収入・営業成果の可視化

#### 📄 **レポート生成**
- 美しいPDF出力
- 複数のテンプレート
- カスタマイズ可能

## 🔧 開発情報

### プロジェクト構造
```
Auto_Creation_Report/
├── backend/                 # Python FastAPI
│   ├── main.py             # メインアプリケーション
│   ├── database.py         # データベースモデル
│   ├── schemas.py          # Pydanticスキーマ
│   ├── auth.py             # 認証機能
│   ├── pdf_generator.py    # PDF生成
│   └── routers/            # APIルーター
├── frontend/               # React TypeScript
│   ├── src/
│   │   ├── components/     # 再利用可能コンポーネント
│   │   ├── pages/          # ページコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── services/       # API呼び出し
│   │   └── types/          # TypeScript型定義
└── docs/                   # ドキュメント
```

### 技術スタック

#### バックエンド
- **FastAPI**: 高性能Webフレームワーク
- **SQLAlchemy**: ORM
- **Pydantic**: データバリデーション
- **ReportLab**: PDF生成
- **OpenAI API**: AI機能

#### フロントエンド
- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **React Query**: データ取得
- **React Hook Form**: フォーム管理

### API仕様

#### 認証
```bash
POST /api/auth/register  # ユーザー登録
POST /api/auth/login     # ログイン
GET  /api/auth/me       # ユーザー情報取得
```

#### 月報
```bash
GET    /api/reports         # 月報一覧
POST   /api/reports         # 月報作成
GET    /api/reports/{id}    # 月報詳細
PUT    /api/reports/{id}    # 月報更新
DELETE /api/reports/{id}    # 月報削除
POST   /api/reports/{id}/pdf # PDF生成
```

#### AI支援
```bash
POST /api/ai/analyze           # データ分析
POST /api/ai/generate-reflection # 振り返り生成
POST /api/ai/generate-goals    # 目標生成
```

## 🧪 テスト

### バックエンドテスト
```bash
cd backend
pytest tests/ -v
```

### フロントエンドテスト
```bash
cd frontend
npm test
```

## 📦 デプロイ

### Docker使用
```bash
# 本番環境構築
docker-compose -f docker-compose.prod.yml up -d

# 開発環境構築
docker-compose up -d
```

### 環境変数

#### 本番環境で必要な設定
```bash
# 必須
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:pass@host:port/db

# オプション
OPENAI_API_KEY=your-openai-api-key
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🐛 トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   ```bash
   # SQLiteファイルの権限確認
   ls -la backend/monthly_reports.db
   ```

2. **Node.js依存関係エラー**
   ```bash
   # node_modulesを削除して再インストール
   rm -rf frontend/node_modules
   cd frontend && npm install
   ```

3. **Python仮想環境の問題**
   ```bash
   # 仮想環境を再作成
   rm -rf backend/venv
   cd backend && python3 -m venv venv
   ```

## 🤝 コントリビューション

1. **フォーク** - このリポジトリをフォーク
2. **ブランチ作成** - `git checkout -b feature/amazing-feature`
3. **コミット** - `git commit -m 'Add amazing feature'`
4. **プッシュ** - `git push origin feature/amazing-feature`
5. **プルリクエスト** - Pull Requestを作成

### コーディング規約

- **Python**: PEP 8 準拠
- **TypeScript**: ESLint + Prettier
- **コミット**: Conventional Commits

## 📞 サポート

- **バグ報告**: GitHub Issues
- **機能リクエスト**: GitHub Discussions
- **技術的質問**: community@example.com

---

**Happy Coding! 🎉**