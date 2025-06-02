# 🚀 月報作成ツール - Cursorユーザー向け簡単セットアップ

## 📝 必要なもの（5分で準備完了）

1. **Docker Desktop**をインストール
   - Mac: https://www.docker.com/products/docker-desktop/
   - Windows: 同上（WSL2が自動でセットアップされます）

2. **Cursor**でプロジェクトを開く

## 🎯 3ステップで起動

### ステップ1: Cursorでプロジェクトを開く
```bash
# Cursorのターミナルで実行（Ctrl/Cmd + J）
git clone https://github.com/simeji03/Auto_Creation_Report.git
cd Auto_Creation_Report
```

### ステップ2: AIに起動を頼む
Cursorで以下をコピペしてAIに頼む：
```
このプロジェクトをDockerで起動してください。
quick-start.shを実行してください。
```

または手動で：
```bash
./quick-start.sh
```

### ステップ3: ブラウザでアクセス
```
http://localhost:3456
```

## 🎨 使い方（3分で月報完成）

1. **設定ページ**でOpenAI APIキーを登録
   - 左メニューの「設定」をクリック
   - APIキーを入力（sk-で始まる文字列）

2. **対話型月報作成**をクリック
   - 「テストデータ生成」で練習できます
   - 音声入力または手動入力

3. **AI月報生成**ボタンをクリック
   - 10-20秒で高品質な月報が完成！

## 🔧 よくあるトラブル

### Docker Desktopが起動していない
```
エラー: Cannot connect to the Docker daemon
解決法: Docker Desktopを起動してください（アプリ一覧から）
```

### ポート3456が使用中
```
エラー: bind: address already in use
解決法: Cursorで「ポート3457に変更して起動して」とAIに頼む
```

### 月報が削除できない
```
解決法: ブラウザをリロード（Ctrl/Cmd + R）してください
```

## 💡 Cursor活用テクニック

### 月報のカスタマイズ
AIに以下のように頼めます：
- 「月報のフォーマットを○○風に変更して」
- 「グラフを追加して」
- 「英語版も作れるようにして」

### データのエクスポート
```
データベースの内容をCSVでエクスポートする機能を追加して
```

### デザインの変更
```
ダークモードを追加して
```

## 🛑 停止方法

Cursorのターミナルで：
```bash
docker-compose -f docker-compose.prod.yml down
```

または単に：
```bash
Ctrl + C
```

## 📱 スマホから使いたい場合

1. PCのIPアドレスを確認
   ```bash
   # Mac
   ipconfig getifaddr en0
   
   # Windows
   ipconfig
   ```

2. スマホのブラウザで
   ```
   http://[PCのIPアドレス]:3456
   ```

## 🎁 おまけ：1クリック起動

デスクトップにショートカットを作成：
1. `quick-start.sh`を右クリック
2. 「エイリアスを作成」（Mac）/「ショートカット作成」（Windows）
3. デスクトップに移動

これでダブルクリックだけで起動できます！

---

**困ったら**: GitHubのIssuesに質問を投稿してください
https://github.com/simeji03/Auto_Creation_Report/issues