# 📊 月報作成支援ツール (Monthly Report Assistant)

コミュニティメンバーの月報作成時間を大幅に短縮し、より見やすく伝わりやすい月報を簡単に作成できるWebアプリケーションです。

## 🚀 クイックスタート（3分で起動）

### 🎯 初心者向け（中学生でもOK）
**簡単3ステップ**：
1. **Docker Desktop**をインストール（[Mac](https://www.docker.com/products/docker-desktop/) / [Windows](https://www.docker.com/products/docker-desktop/)）
2. [**リリースページ**](https://github.com/simeji03/Auto_Creation_Report/releases)から`monthly-report-v1.0.0.zip`をダウンロード
3. **ダブルクリックで起動**：
   - Mac: `cursor-setup.command`
   - Windows: `cursor-setup.bat`

### 📖 詳しい説明書
- 🎯 **[超簡単ガイド](BEGINNER_GUIDE.md)** - 中学生向け完全版
- 📸 **[画面付きガイド](STEP_BY_STEP_SCREENSHOTS.md)** - 迷子にならない手順書
- ⚡ **[1分ガイド](SIMPLE_STARTUP_GUIDE.md)** - チェックリスト形式
- 🌟 **[小学生版](ELEMENTARY_README.md)** - ゲーム感覚で学べる

### 🔧 技術者向け
```bash
git clone https://github.com/simeji03/Auto_Creation_Report.git
cd Auto_Creation_Report
./quick-start.sh
```

## 🎯 主な機能

### ✨ ユーザー体験の向上
- **ガイド付き入力**: ステップバイステップで月報作成をサポート
- **テンプレート機能**: 複数の月報フォーマットから選択可能
- **自動保存**: 入力中のデータを自動保存、途中で中断可能
- **プレビュー機能**: リアルタイムで完成イメージを確認

### 📈 データ管理・分析
- **前月データ引用**: 前月の目標や課題を自動で引き継ぎ
- **数値分析**: 稼働時間、収入などの変化率を自動計算
- **視覚化**: グラフやチャートで数値データを分かりやすく表示
- **履歴管理**: 過去の月報を一覧で管理

### 🤖 AI支援機能
- **振り返り支援**: 入力データから振り返りポイントを提案
- **改善案生成**: 課題に対する具体的な改善案を AI が提案
- **目標設定支援**: 実績に基づいた現実的な目標設定をサポート

### 📄 出力・共有
- **美しいPDF出力**: プロフェッショナルなデザインの月報PDF
- **複数フォーマット**: 詳細版・要約版・プレゼン版など
- **共有機能**: URLでの共有、メール送信対応

## 🛠️ 技術スタック

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI + SQLite
- **PDF生成**: ReportLab + Chart.js
- **AI機能**: OpenAI API (GPT-4)
- **認証**: JWT + セキュアセッション管理

## 🚀 セットアップ方法

### 必要環境
- Node.js 18+
- Python 3.9+
- pip, npm

### セットアップ

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd Auto_Creation_Report
```

2. **バックエンドセットアップ**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

3. **フロントエンドセットアップ**
```bash
cd frontend
npm install
npm start
```

4. **ブラウザでアクセス**
```
http://localhost:3456
```

### 🔑 AI機能を使用するための設定

AI月報生成機能を使用するには、OpenAI APIキーの設定が必要です。

#### OpenAI APIキーの取得
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウント作成・ログイン
3. API Keys ページでAPIキーを作成
4. 作成されたAPIキー（`sk-`で始まる文字列）をコピー

#### アプリケーション内での設定
1. アプリケーションにログイン
2. 右上の⚙️設定アイコンをクリック
3. 「OpenAI APIキー」欄にAPIキーを入力
4. 「保存」ボタンをクリック
5. 「APIキーをテスト」で接続確認

> **💡 セキュリティ**: APIキーは各ユーザーのブラウザのローカルストレージに保存され、サーバーには保存されません。

## 📱 使い方

### 1. 月報作成フロー
1. **基本情報入力**: 名前、期間、現在のフェーズなど
2. **定量データ入力**: 稼働時間、収入、営業結果など
3. **定性的振り返り**: 良かった点、課題、改善案など
4. **目標設定**: 来月の目標とアクションプラン
5. **プレビュー確認**: 完成した月報を確認
6. **PDF出力**: 美しいレポートとして出力

### 2. データ管理
- **履歴閲覧**: 過去の月報を一覧表示
- **データ比較**: 月次推移をグラフで確認
- **テンプレート管理**: 自分用のテンプレートを保存

## 🎨 デザインコンセプト

- **ミニマル & モダン**: 直感的で美しいUI/UX
- **レスポンシブ**: スマホ・タブレット・PCで最適表示
- **アクセシビリティ**: 誰でも使いやすいデザイン
- **高速**: ストレスフリーな操作性

## 🔒 セキュリティ

- **データ暗号化**: すべてのデータを暗号化して保存
- **セキュアAPI**: HTTPS + JWT認証
- **プライバシー保護**: 個人情報の適切な管理
- **バックアップ**: 定期的なデータバックアップ

## 🤝 コントリビューション

バグ報告、機能提案、プルリクエストを歓迎します！

## 📞 サポート

- **Issue報告**: GitHub Issues
- **機能リクエスト**: Discussions
- **技術サポート**: community@example.com

---

**💡 このツールで月報作成時間を80%短縮し、より価値のある振り返りに集中できます！**