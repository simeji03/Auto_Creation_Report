# 📋 リリース前チェックリスト

配布前に必ず確認する項目のチェックリストです。

## 🔍 必須確認項目

### 1. ファイル構成
- [ ] `docker-start.sh` が存在する
- [ ] `docker-start.bat` が存在する  
- [ ] `docker-compose.prod.yml` が存在する
- [ ] `Dockerfile.frontend` が存在する
- [ ] `Dockerfile.backend` が存在する
- [ ] `data/` フォルダが作成される設定になっている
- [ ] `env.example` が存在する

### 2. ドキュメント
- [ ] `README.md` が最新の手順を反映している
- [ ] `DOCKER_INSTALL_GUIDE.md` が存在する
- [ ] `TROUBLESHOOTING.md` が存在する
- [ ] `BEGINNER_GUIDE.md` など初心者向けガイドが存在する

### 3. スクリプトの権限（Mac/Linux）
```bash
chmod +x docker-start.sh
chmod +x diagnose.sh
```

### 4. 個人情報の削除
- [ ] `.env` ファイルが含まれていない
- [ ] 個人のAPIキーが含まれていない
- [ ] テストデータが含まれていない
- [ ] `data/` フォルダが空または存在しない
- [ ] `.git/` フォルダが含まれていない

### 5. 動作確認

#### Windows環境
- [ ] Docker Desktopをクリーンインストール
- [ ] `docker-start.bat` を管理者権限で実行
- [ ] ブラウザで http://localhost:3456 にアクセス可能
- [ ] 新規ユーザー登録ができる
- [ ] 月報作成ができる
- [ ] PDFダウンロードができる

#### Mac環境  
- [ ] Docker Desktopをクリーンインストール
- [ ] `docker-start.sh` を実行
- [ ] ブラウザで http://localhost:3456 にアクセス可能
- [ ] 新規ユーザー登録ができる
- [ ] 月報作成ができる
- [ ] PDFダウンロードができる

### 6. エラーケース確認
- [ ] Dockerが起動していない状態で適切なエラーメッセージが表示される
- [ ] ポートが使用中の場合に適切なエラーメッセージが表示される
- [ ] メモリ不足の場合に警告が表示される

### 7. 診断ツール
- [ ] `diagnose.sh` が正常に動作する
- [ ] 診断結果ファイルが生成される

## 📦 配布用ZIPの作成

```bash
# 配布用フォルダを作成
mkdir monthly-report-release
cd monthly-report-release

# 必要なファイルをコピー
cp -r ../frontend ./
cp -r ../backend ./
cp ../docker-* ./
cp ../Dockerfile.* ./
cp ../*.md ./
cp ../env.example ./
cp ../diagnose.sh ./

# 不要なファイルを削除
rm -rf frontend/node_modules
rm -rf frontend/build
rm -rf backend/venv
rm -rf backend/__pycache__
rm -rf backend/.env
rm -rf data
rm -rf .git

# ZIPファイルを作成
cd ..
zip -r monthly-report-v1.0.0.zip monthly-report-release/
```

## 🧪 最終テスト

### テスト環境
1. 新しいユーザーアカウントまたは仮想マシンで実施
2. Dockerをクリーンインストール
3. 配布用ZIPをダウンロード・解凍
4. 手順書に従って起動

### 確認項目
- [ ] 5分以内に起動できる
- [ ] エラーなく月報が作成できる
- [ ] データが永続化される
- [ ] 再起動してもデータが残る

## 📝 配布時の注意事項

### コミュニティへの連絡内容
1. **必要なもの**: Docker Desktop（無料）
2. **推奨スペック**: メモリ4GB以上
3. **サポート方法**: メールアドレスまたはチャットURL
4. **既知の制限事項**: あれば記載

### 配布方法
- [ ] GitHub Releasesで公開
- [ ] ダウンロードリンクを共有
- [ ] インストール動画を作成（オプション）

## ✅ 最終確認

- [ ] すべての項目にチェックが入った
- [ ] テストユーザーからのフィードバックを受けた
- [ ] ドキュメントが分かりやすいことを確認した
- [ ] サポート体制が整っている

---

**配布準備完了！** 🎉