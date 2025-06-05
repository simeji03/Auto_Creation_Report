# 🐳 Docker Desktop インストールガイド

このガイドでは、Docker Desktopのインストール方法を画像付きで説明します。

## 📋 目次
- [Windows版インストール](#windows版)
- [Mac版インストール](#mac版)
- [インストール後の確認](#インストール後の確認)
- [よくある質問](#よくある質問)

---

## 🪟 Windows版

### 1. システム要件の確認
- Windows 10 64-bit: Pro, Enterprise, Education (Build 16299以降)
- Windows 11 64-bit: Home, Pro, Enterprise, Education
- 4GB以上のRAM

### 2. ダウンロード
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)にアクセス
2. 「Download for Windows」ボタンをクリック
3. `Docker Desktop Installer.exe`がダウンロードされます

### 3. インストール手順
1. ダウンロードした`Docker Desktop Installer.exe`をダブルクリック
2. 「Configuration」画面で以下を確認：
   - ✅ Install required Windows components for WSL 2
   - ✅ Add shortcut to desktop
3. 「OK」をクリックしてインストール開始
4. インストール完了後「Close and restart」をクリック
5. **パソコンを再起動**

### 4. 初回起動
1. 再起動後、デスクトップの「Docker Desktop」アイコンをダブルクリック
2. 利用規約に同意（Accept）
3. Docker Desktopが起動するまで1-2分待つ
4. タスクバーにクジラのアイコン🐳が表示されればOK！

---

## 🍎 Mac版

### 1. システム要件の確認
- macOS 11以降
- 4GB以上のRAM

### 2. チップの確認
1. 画面左上の🍎マーク → 「このMacについて」をクリック
2. 「チップ」の項目を確認：
   - **Apple M1/M2/M3** → Apple Silicon版をダウンロード
   - **Intel Core** → Intel版をダウンロード

### 3. ダウンロード
1. [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)にアクセス
2. お使いのチップに合わせてダウンロード：
   - Apple Silicon → 「Mac with Apple Chip」
   - Intel → 「Mac with Intel Chip」
3. `Docker.dmg`がダウンロードされます

### 4. インストール手順
1. ダウンロードした`Docker.dmg`をダブルクリック
2. Dockerアイコンを「Applications」フォルダにドラッグ
3. アプリケーションフォルダから「Docker」をダブルクリック
4. 「開いてもよろしいですか？」→「開く」をクリック
5. パスワードを入力（管理者権限が必要）

### 5. 初回起動
1. 利用規約に同意（Accept）
2. Docker Desktopが起動するまで1-2分待つ
3. メニューバーにクジラのアイコン🐳が表示されればOK！

---

## ✅ インストール後の確認

### 1. Docker Desktopの起動確認
- **Windows**: タスクバーにクジラのアイコン🐳
- **Mac**: メニューバーにクジラのアイコン🐳

### 2. コマンドラインで確認
1. ターミナル（Mac）またはコマンドプロンプト（Windows）を開く
2. 以下のコマンドを実行：
```bash
docker --version
```
3. バージョン情報が表示されればOK！

### 3. 動作テスト
```bash
docker run hello-world
```
「Hello from Docker!」と表示されれば正常動作！

---

## ❓ よくある質問

### Q: 「WSL 2 installation is incomplete」エラーが出る（Windows）
A: WSL2のアップデートが必要です：
1. [WSL2 Linuxカーネル更新プログラム](https://aka.ms/wsl2kernel)をダウンロード
2. インストールして再起動

### Q: 「Docker Desktop requires a newer WSL kernel version」エラーが出る
A: 管理者権限でPowerShellを開いて以下を実行：
```powershell
wsl --update
```

### Q: Dockerが起動しない
A: 以下を順番に試してください：
1. パソコンを再起動
2. Docker Desktopを再インストール
3. ウイルス対策ソフトの設定確認

### Q: 「Cannot connect to the Docker daemon」エラー
A: Docker Desktopが起動しているか確認：
- クジラのアイコン🐳があるか確認
- なければDocker Desktopを起動

### Q: メモリ不足のエラー
A: Docker Desktopの設定でメモリを調整：
1. クジラのアイコン🐳 → Settings
2. Resources → Advanced
3. Memoryを2GBに設定

---

## 🎉 インストール完了！

Docker Desktopのインストールが完了したら、月報作成支援ツールの起動スクリプトを実行できます：
- **Mac**: `manual-start.sh`をダブルクリック
- **Windows**: `manual-start.bat`をダブルクリック

楽しい月報作成を！