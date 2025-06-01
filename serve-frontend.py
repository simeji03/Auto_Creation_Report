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
    PORT = 3000

    # カレントディレクトリを設定
    web_dir = Path(__file__).parent
    os.chdir(web_dir)

    Handler = http.server.SimpleHTTPRequestHandler

    class CORSRequestHandler(Handler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            super().end_headers()

    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"🌐 フロントエンドサーバーが起動しました")
        print(f"📍 URL: http://localhost:{PORT}")
        print(f"📋 テストページ: http://localhost:{PORT}/test-frontend.html")
        print(f"🛑 停止するには Ctrl+C を押してください")

        # ブラウザを自動で開く
        try:
            webbrowser.open(f'http://localhost:{PORT}/test-frontend.html')
        except:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 フロントエンドサーバーを停止しています...")
            print("✅ フロントエンドサーバーが停止しました")

if __name__ == '__main__':
    start_frontend_server()