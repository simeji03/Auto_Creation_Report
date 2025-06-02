# 📁 プロジェクト構成

## 🎯 ルートディレクトリ

### 📄 ユーザー向けファイル
- `README.md` - メインガイド
- `BEGINNER_GUIDE.md` - 中学生向け完全ガイド
- `CURSOR_USER_GUIDE.md` - Cursorユーザー向け詳細ガイド
- `SIMPLE_STARTUP_GUIDE.md` - 1分チェックリスト
- `STEP_BY_STEP_SCREENSHOTS.md` - 画面付き手順書
- `ELEMENTARY_README.md` - 小学生向けガイド

### 🚀 起動ファイル
- `cursor-setup.command` - Mac用ダブルクリック起動
- `cursor-setup.bat` - Windows用ダブルクリック起動
- `quick-start.sh` - Linux/Mac用コマンドライン起動

### 🐳 Docker設定
- `docker-compose.prod.yml` - 本番用Docker設定
- `Dockerfile.frontend` - フロントエンド用Dockerfile
- `Dockerfile.backend` - バックエンド用Dockerfile
- `.env.example` - 環境変数のサンプル

### 📋 設定ファイル
- `.gitignore` - Git除外設定
- `DEPLOY.md` - デプロイガイド

## 📁 ディレクトリ構成

### `frontend/` - フロントエンド（React + TypeScript）
```
frontend/
├── src/
│   ├── components/     # 共通コンポーネント
│   ├── pages/         # 各ページ
│   ├── services/      # API通信
│   ├── contexts/      # React Context
│   └── utils/         # ユーティリティ
├── public/            # 静的ファイル
└── package.json       # 依存関係
```

### `backend/` - バックエンド（Python + FastAPI）
```
backend/
├── routers/           # APIルーター
├── utils/            # ユーティリティ
├── main.py           # メインアプリケーション
├── database.py       # データベース設定
├── schemas.py        # データ定義
└── requirements.txt  # 依存関係
```

### `release/` - リリースパッケージ
```
release/
├── monthly-report-v1.0.0.zip  # 配布用ZIPファイル
└── monthly-report-v1.0.0/     # 配布用フォルダ
```

## 🎯 ファイル数

- **ルートファイル**: 15個（重要ファイルのみ）
- **フロントエンド**: 約30ファイル
- **バックエンド**: 約20ファイル
- **総計**: 約65ファイル（前回の半分以下）

## ✅ 整理の効果

### Before（整理前）
- ルートディレクトリに40個以上のファイル
- テストファイル、開発用スクリプトが混在
- node_modules、venvが含まれて重い
- 何がメインファイルか分からない

### After（整理後）
- ルートディレクトリに15個の重要ファイルのみ
- 用途別に明確に分類
- 軽量で見通しが良い
- 初心者でも迷わない構成

## 🚀 動作への影響

**影響なし**: 削除したファイルは全て以下のカテゴリ
- テスト用ファイル
- 開発用スクリプト
- 重複ドキュメント
- 依存関係フォルダ（自動生成される）

**主要機能は完全に保持**:
- ✅ Docker起動
- ✅ フロントエンド・バックエンド
- ✅ AI機能
- ✅ 月報作成・削除
- ✅ 全ガイド