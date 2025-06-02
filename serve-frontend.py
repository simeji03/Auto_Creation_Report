#!/usr/bin/env python3
"""
テストフロントエンド配信用HTTPサーバー
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

def start_frontend_server():
    """フロントエンド配信サーバーを起動"""
    PORT = 8080

    # フロントエンドのビルドディレクトリを設定
    web_dir = Path(__file__).parent / "frontend" / "build"
    if not web_dir.exists():
        print(f"❌ ビルドディレクトリが見つかりません: {web_dir}")
        print("📦 先に 'cd frontend && npm run build' を実行してください")
        return
    
    os.chdir(web_dir)

    Handler = http.server.SimpleHTTPRequestHandler

    class CORSRequestHandler(Handler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            super().end_headers()
        
        def do_GET(self):
            # React Routerのクライアントサイドルーティングのため、
            # 存在しないパスでもindex.htmlを返す
            if self.path != '/' and not self.path.startswith('/static') and not self.path.endswith(('.js', '.css', '.json', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg')):
                self.path = '/'
            return Handler.do_GET(self)

    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"🌐 フロントエンドサーバーが起動しました")
        print(f"📍 URL: http://localhost:{PORT}")
        print(f"🛑 停止するには Ctrl+C を押してください")

        # ブラウザを自動で開く
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 フロントエンドサーバーを停止しています...")
            print("✅ フロントエンドサーバーが停止しました")

if __name__ == '__main__':
    start_frontend_server()