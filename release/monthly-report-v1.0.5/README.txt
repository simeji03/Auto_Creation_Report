月報作成支援ツール
==================

【Mac初回起動時の重要な手順】

「開発元が未確認のため開けません」と表示される場合:

1. manual-start.command を右クリック
2. 「開く」を選択
3. 警告画面で「開く」をクリック

これは初回のみ必要です。2回目以降はダブルクリックで起動できます。

【通常の起動方法】

Mac:
  manual-start.command をダブルクリック

Windows:
  manual-start.bat を右クリック→「管理者として実行」

【必要なソフト】

Docker Desktop（無料）
https://www.docker.com/products/docker-desktop/

【初回セットアップ】

1. Docker Desktopをインストール
2. Docker Desktopを起動（クジラのアイコンが表示されるまで待つ）
3. 起動ファイルを実行（Macは右クリック→開く）

【トラブル時】

起動しない場合:
- Docker Desktopが起動しているか確認
- ポート3456, 8000が使用されていないか確認

【データの保存場所】

system/data フォルダ内に保存されます

【アンインストール】

このフォルダを削除するだけです
