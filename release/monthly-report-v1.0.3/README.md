# 📊 月報作成支援ツール (Monthly Report Assistant)

コミュニティメンバーの月報作成時間を大幅に短縮し、より見やすく伝わりやすい月報を簡単に作成できるWebアプリケーションです。

## 🚀 超簡単3ステップ起動（環境構築不要！）

### 📥 ステップ1: Dockerをインストール

**🍎 Macの場合:**
1. [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) をクリック
2. 「Download for Mac」ボタンをクリック
3. ダウンロードしたファイルをダブルクリックしてインストール
4. Dockerアプリを起動（クジラのアイコン🐳が画面上部に表示されればOK）

**🪟 Windowsの場合:**
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) をクリック
2. 「Download for Windows」ボタンをクリック
3. ダウンロードしたファイルをダブルクリックしてインストール
4. 再起動後、Dockerアプリを起動（タスクバーにクジラのアイコン🐳が表示されればOK）

⚠️ **Windows 10/11の場合**: WSL2の設定が必要な場合があります → [Windowsセットアップガイド](WINDOWS_DOCKER_SETUP.md)

💡 **一度インストールすれば、次回からは不要です！**

### 📂 ステップ2: アプリをダウンロード

1. **このリンクをクリック**: [**最新版をダウンロード**](https://github.com/simeji03/Auto_Creation_Report/releases/latest)
2. 「Assets」の下にある **「Source code (zip)」** をクリック
3. ダウンロードしたZIPファイルを解凍

### 🎉 ステップ3: アプリを起動

**🍎 Macの場合:**
1. 解凍したフォルダを開く
2. **「manual-start.command」をダブルクリック**
3. 初回は「開いてもよろしいですか？」と聞かれたら「開く」をクリック
4. 自動でブラウザが開いて月報作成画面が表示されます！

**🪟 Windowsの場合:**
1. 解凍したフォルダを開く
2. **「manual-start.bat」を右クリック→「管理者として実行」**
3. 自動でブラウザが開いて月報作成画面が表示されます！

💡 **うまくいかない場合**: [トラブルシューティングガイド](TROUBLESHOOTING.md)を参照

### ✅ 成功の確認
- ブラウザに月報作成画面が表示されればOK！
- アドレスバーに「localhost:3456」と表示されているはずです

## 🎯 なぜDockerを使うの？

- **環境構築不要**: PythonもNode.jsも個別にインストール不要
- **どこでも同じ**: Mac、Windows、Linuxで同じように動作
- **エラーなし**: 「バージョンが違う」などの問題が起きない
- **簡単削除**: アプリが不要になったらフォルダごと削除するだけ

## 📖 詳しい説明書
- 🎯 **[超簡単ガイド](BEGINNER_GUIDE.md)** - 中学生向け完全版
- 📸 **[画面付きガイド](STEP_BY_STEP_SCREENSHOTS.md)** - 迷子にならない手順書
- ⚡ **[1分ガイド](SIMPLE_STARTUP_GUIDE.md)** - チェックリスト形式
- 🌟 **[小学生版](ELEMENTARY_README.md)** - ゲーム感覚で学べる
- 🐳 **[Dockerインストールガイド](DOCKER_INSTALL_GUIDE.md)** - 画像付き詳細手順
- 🔧 **[トラブルシューティング](TROUBLESHOOTING.md)** - 問題解決ガイド

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


## 🤖 AI月報機能を使いたい場合（オプション）

このアプリにはAIが月報を自動で作ってくれる機能があります！使いたい場合は以下の手順でAPIキーを設定してください：

### 💳 OpenAI APIキーの取得（有料）
1. **[OpenAIのサイト](https://platform.openai.com/)** を開く
2. **「Sign up」** または **「Log in」** でアカウントを作る
3. 右上の **「API keys」** をクリック
4. **「Create new secret key」** をクリック
5. **APIキー（sk-で始まる長い文字列）** をコピーして保存

⚠️ **料金について**: OpenAI APIは使った分だけお金がかかります（月数百円程度）

### ⚙️ アプリでの設定方法
1. **月報アプリを開く**
2. **右上の⚙️マーク** をクリック
3. **「OpenAI APIキー」の欄** にコピーしたキーを貼り付け
4. **「保存」ボタン** をクリック
5. **「APIキーをテスト」** で動作確認

💡 **安心**: APIキーはあなたのパソコンにだけ保存され、外部に送信されません。

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

## 😵 困った時の解決方法

### 🐳 「Dockerが起動していません」と表示される場合

**共通の解決方法:**
1. **Dockerアプリを起動** （クジラのアイコン🐳を探してクリック）
2. Docker Desktopが完全に起動するまで30秒ほど待つ
3. もう一度起動スクリプトを実行

### 🚫 「アプリが起動しない」場合

**Macで「開発元が未確認」と出る場合:**
1. **「manual-start.command」を右クリック**
2. **「開く」を選択**
3. **「開く」をもう一度クリック**

**Windowsで管理者権限が必要な場合:**
1. **「manual-start.bat」を右クリック**
2. **「管理者として実行」を選択**

### 🌐 「ブラウザが開かない」場合

1. **ブラウザ（Chrome、Safari、Edgeなど）を手動で開く**
2. **アドレス欄に「localhost:3456」と入力**してEnter
3. 月報作成画面が表示されればOK！

### 🔴 「ポートが既に使用中」エラーが出る場合

**Docker Desktopで解決:**
1. Docker Desktopを開く
2. 左側の「Containers」をクリック
3. 実行中のコンテナがあれば「Stop」ボタンで停止
4. もう一度アプリを起動

### 🤖 「AI機能が使えない」場合

1. **OpenAI APIキーが正しく設定されているか確認**
2. **[OpenAIのサイト](https://platform.openai.com/usage)** でクレジット残高を確認
3. 残高が0の場合は、クレジットカードで支払い設定をする

### 📞 それでも解決しない場合

**GitHub Issues** でお気軽に質問してください：
[**質問・報告はこちら**](https://github.com/simeji03/Auto_Creation_Report/issues)

## 🤝 コントリビューション

バグ報告、機能提案、プルリクエストを歓迎します！

## 📞 サポート

- **Issue報告**: GitHub Issues
- **機能リクエスト**: Discussions
- **技術サポート**: community@example.com

---

**💡 このツールで月報作成時間を80%短縮し、より価値のある振り返りに集中できます！**