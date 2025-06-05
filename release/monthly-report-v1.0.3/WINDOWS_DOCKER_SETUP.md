# 🪟 Windows用Docker事前設定ガイド

Windows版Docker Desktopを使うには、WSL2（Windows Subsystem for Linux 2）の設定が必要です。

## 📋 Windowsバージョンの確認

### 必要な環境
- **Windows 10**: バージョン1903以降（ビルド18362以降）
- **Windows 11**: すべてのバージョンでOK

### バージョン確認方法
1. `Windows + R` キーを押す
2. `winver` と入力してEnter
3. バージョンを確認

## 🚀 簡単セットアップ（推奨）

### ステップ1: PowerShellを管理者権限で開く
1. スタートメニューで「PowerShell」を検索
2. **右クリック** → **「管理者として実行」**
3. 「はい」をクリック

### ステップ2: WSL2を自動インストール
以下のコマンドをコピーして貼り付け：
```powershell
wsl --install
```

### ステップ3: 再起動
1. コマンドが完了したら **PCを再起動**
2. 再起動後、自動的にUbuntuのセットアップが始まる
3. ユーザー名とパスワードを設定（覚えておく必要はありません）

## 🔧 手動セットアップ（自動でうまくいかない場合）

### 1. Windows機能を有効化
PowerShell（管理者）で以下を実行：
```powershell
# WSL有効化
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 仮想マシン機能有効化
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### 2. PCを再起動

### 3. WSL2 Linuxカーネル更新
1. [WSL2カーネル更新プログラム](https://aka.ms/wsl2kernel)をダウンロード
2. ダウンロードした`wsl_update_x64.msi`を実行
3. 「Next」→「Finish」

### 4. WSL2をデフォルトに設定
PowerShellで：
```powershell
wsl --set-default-version 2
```

## 🐳 Docker Desktopのインストール

WSL2の設定が完了したら：
1. [Docker Desktop](https://www.docker.com/products/docker-desktop/)をダウンロード
2. インストーラーを実行
3. **必ず以下にチェック**：
   - ✅ Install required Windows components for WSL 2
   - ✅ Add shortcut to desktop
4. インストール完了後、再起動

## ❓ よくあるトラブル

### 「WSL 2 installation is incomplete」エラー
→ 上記の手動セットアップを実施

### 「仮想化が有効になっていません」エラー
1. PCを再起動してBIOS/UEFIに入る（F2、F10、DELキーなど）
2. 「Virtualization」や「Intel VT-x」「AMD-V」を探す
3. 「Enabled」に変更
4. 保存して再起動

### Windows Homeの場合
Windows 10 Home（バージョン1903以降）でも使えます！
上記の手順通りに進めてください。

### メモリ不足エラー
1. `.wslconfig`ファイルを作成：
   ```
   C:\Users\[あなたのユーザー名]\.wslconfig
   ```
2. 以下を記入：
   ```
   [wsl2]
   memory=2GB
   processors=2
   ```
3. PowerShellで`wsl --shutdown`を実行

## ✅ 設定完了の確認

PowerShellで以下を実行：
```powershell
wsl --status
```

「既定のバージョン: 2」と表示されればOK！

## 🎉 準備完了！

これでDocker Desktopを使う準備ができました。
READMEの手順に戻って、アプリを起動してください。