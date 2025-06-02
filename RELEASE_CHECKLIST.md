# 🚀 リリースチェックリスト

## 📋 リリース前の確認事項

### 1. 個人データの削除
- [ ] データベースに個人情報が含まれていないか確認
- [ ] .envファイルにAPIキーが含まれていないか確認
- [ ] スクリーンショットに個人情報が映っていないか確認
- [ ] テストデータがダミーデータのみか確認

### 2. 不要ファイルの削除
- [ ] `cleanup-for-release.sh`を実行
- [ ] テストファイル（test_*.js, test_*.json）を削除
- [ ] スクリーンショット（*.png）を削除
- [ ] ログファイル（*.log）を削除
- [ ] データベースファイル（*.db）を削除

### 3. 必要ファイルの確認
- [ ] `cursor-setup.command`（Mac用）が存在
- [ ] `cursor-setup.bat`（Windows用）が存在
- [ ] `quick-start.sh`が存在
- [ ] `docker-compose.prod.yml`が存在
- [ ] `.env.example`が存在
- [ ] `CURSOR_USER_GUIDE.md`が存在

### 4. 動作確認
- [ ] Dockerビルドが成功するか確認
- [ ] フロントエンドが正常に表示されるか確認
- [ ] バックエンドAPIが正常に動作するか確認
- [ ] 月報の作成・削除が正常に動作するか確認
- [ ] AI生成機能が正常に動作するか確認（APIキー設定後）

### 5. ドキュメントの確認
- [ ] READMEが最新か確認
- [ ] CURSOR_USER_GUIDE.mdが分かりやすいか確認
- [ ] .env.exampleに必要な環境変数が記載されているか確認

## 🎯 リリース手順

### 1. クリーンアップ
```bash
# クリーンアップスクリプトを実行
./cleanup-for-release.sh

# 変更をコミット
git add -A
git commit -m "chore: リリース前のクリーンアップ"
git push
```

### 2. 最終動作確認
```bash
# クリーンな状態で動作確認
./quick-start.sh

# ブラウザで以下を確認
# - http://localhost:3456 にアクセスできる
# - 月報の作成・削除ができる
# - AI生成が動作する（APIキー設定後）
```

### 3. GitHub Releaseの作成

1. GitHubのリポジトリページで「Releases」をクリック
2. 「Create a new release」をクリック
3. タグ名: `v1.0.0`
4. リリースタイトル: `v1.0.0 - 月報作成支援ツール 初回リリース`
5. リリースノート:
```markdown
## 🎉 月報作成支援ツール v1.0.0

### 🚀 簡単3ステップで起動

1. **Docker Desktop**をインストール
   - [Mac版](https://www.docker.com/products/docker-desktop/)
   - [Windows版](https://www.docker.com/products/docker-desktop/)

2. **ファイルをダウンロード**
   - 下記のAssetsから全ファイルをZIPでダウンロード
   - 解凍して任意のフォルダに配置

3. **ダブルクリックで起動**
   - Mac: `cursor-setup.command`
   - Windows: `cursor-setup.bat`

ブラウザが自動で開いて使用開始できます！

### 📝 主な機能
- 音声入力による月報作成
- OpenAI GPT-4による自動文章生成
- 美しいPDF出力
- 過去の月報管理

### 🔧 必要な設定
- OpenAI APIキー（設定画面から登録）

### 📖 詳細な使い方
[CURSOR_USER_GUIDE.md](CURSOR_USER_GUIDE.md)を参照してください。

### 🆘 困ったときは
[Issues](https://github.com/simeji03/Auto_Creation_Report/issues)で質問してください。
```

6. 以下のファイルをアップロード（Assets）:
   - ソースコード（自動）
   - リリース用ZIPファイル（作成方法は次項）

### 4. リリース用ZIPファイルの作成

```bash
# リリース用ディレクトリを作成
mkdir -p release/monthly-report-v1.0.0

# 必要なファイルをコピー
cp cursor-setup.command release/monthly-report-v1.0.0/
cp cursor-setup.bat release/monthly-report-v1.0.0/
cp quick-start.sh release/monthly-report-v1.0.0/
cp docker-compose.prod.yml release/monthly-report-v1.0.0/
cp .env.example release/monthly-report-v1.0.0/
cp -r frontend release/monthly-report-v1.0.0/
cp -r backend release/monthly-report-v1.0.0/
cp CURSOR_USER_GUIDE.md release/monthly-report-v1.0.0/
cp README.md release/monthly-report-v1.0.0/

# Dockerfileもコピー
cp Dockerfile.frontend release/monthly-report-v1.0.0/
cp Dockerfile.backend release/monthly-report-v1.0.0/

# ZIPファイルを作成
cd release
zip -r monthly-report-v1.0.0.zip monthly-report-v1.0.0
```

## ✅ 最終確認

配布前の最終チェック:
- [ ] 個人情報が含まれていない
- [ ] 不要なファイルが削除されている
- [ ] ドキュメントが分かりやすい
- [ ] 動作確認済み
- [ ] GitHubにプッシュ済み

すべてチェックできたら、リリースを公開！