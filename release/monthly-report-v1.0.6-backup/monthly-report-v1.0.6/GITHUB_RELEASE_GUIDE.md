# 📦 GitHubリリース作成ガイド

## 1. リリースZIPファイルの作成

```bash
./create-release.sh
```

バージョン番号を入力（例: v1.0.0）すると、自動的に配布用ZIPファイルが作成されます。

## 2. GitHubでリリースを作成

### 手順：

1. **リリースページにアクセス**
   - https://github.com/simeji03/Auto_Creation_Report/releases/new

2. **リリース情報を入力**
   - **Choose a tag**: 新しいタグを作成（例: v1.0.0）
   - **Release title**: 月報作成支援ツール v1.0.0
   - **Describe this release**: 以下のテンプレートを使用

### リリースノートテンプレート

```markdown
## 🎉 月報作成支援ツール v1.0.0

コミュニティメンバーの月報作成を効率化するツールです。

### 📥 インストール方法

1. 下記のAssetsから `monthly-report-v1.0.0.zip` をダウンロード
2. ZIPファイルを解凍
3. Docker Desktopをインストール（[インストールガイド](https://github.com/simeji03/Auto_Creation_Report/blob/main/DOCKER_INSTALL_GUIDE.md)）
4. 起動スクリプトを実行
   - **Mac**: `manual-start.sh` をダブルクリック
   - **Windows**: `manual-start.bat` を右クリック→管理者として実行

### ✨ 主な機能

- 📝 直感的な月報作成インターフェース
- 🤖 AI支援による内容生成（要OpenAI APIキー）
- 📊 美しいPDF出力
- 💾 データの自動保存と履歴管理
- 🔒 セキュアなユーザー管理

### 📋 動作環境

- **Windows**: 10/11（WSL2対応）
- **macOS**: 11以降
- **メモリ**: 4GB以上推奨
- **必須**: Docker Desktop

### 🆘 サポート

- [トラブルシューティングガイド](https://github.com/simeji03/Auto_Creation_Report/blob/main/TROUBLESHOOTING.md)
- コミュニティ管理者にお問い合わせください

### 🔄 変更履歴

- Docker前提の確実な起動システム
- 包括的なエラーハンドリング
- Windows向けWSL2設定ガイド追加
- 自動診断ツール追加
- ユーザビリティの大幅改善
```

3. **ファイルをアップロード**
   - `Attach binaries`から作成したZIPファイルを選択
   - `release/monthly-report-v1.0.0.zip`

4. **公開設定**
   - ✅ Set as the latest release
   - 「Publish release」をクリック

## 3. リリース後の確認

1. リリースページで正しく表示されているか確認
2. ZIPファイルがダウンロードできるか確認
3. READMEのダウンロードリンクが正しく動作するか確認

## 4. コミュニティへの通知

### 通知テンプレート

```
🎉 月報作成支援ツール v1.0.0 をリリースしました！

📥 ダウンロード:
https://github.com/simeji03/Auto_Creation_Report/releases/latest

✨ 特徴:
・Dockerで環境構築不要
・Windows/Mac両対応
・1クリックで起動
・AI支援機能付き

📖 使い方:
1. Docker Desktopをインストール
2. ZIPファイルをダウンロード・解凍
3. 起動スクリプトをダブルクリック

🆘 困ったときは:
・付属のトラブルシューティングガイドを参照
・それでも解決しない場合はご連絡ください

ぜひお試しください！
```

## 5. フィードバック収集

リリース後は以下を確認：
- インストールの成功率
- よくある質問
- 改善要望

次回リリースに向けて改善を続けましょう！