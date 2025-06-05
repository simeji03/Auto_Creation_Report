#!/usr/bin/env python3
"""
シンプルな月報作成支援ツール API
Python 3.13対応版
"""

import json
import sqlite3
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os

# 軽量なHTTPサーバーライブラリを使用
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import threading

class MonthlyReportAPI(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.db_path = "backend/monthly_reports.db"
        super().__init__(*args, **kwargs)

    def _set_cors_headers(self):
        """CORS ヘッダーを設定"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def _send_json_response(self, data: Dict[str, Any], status_code: int = 200):
        """JSON レスポンスを送信"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode('utf-8'))

    def _get_request_body(self) -> Dict[str, Any]:
        """リクエストボディを取得"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                body = self.rfile.read(content_length).decode('utf-8')
                return json.loads(body)
            return {}
        except:
            return {}

    def _init_database(self):
        """データベースを初期化"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # ユーザーテーブル
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 月報テーブル
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS monthly_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                report_month TEXT NOT NULL,
                current_phase TEXT,
                total_work_hours REAL DEFAULT 0,
                coding_hours REAL DEFAULT 0,
                meeting_hours REAL DEFAULT 0,
                sales_hours REAL DEFAULT 0,
                good_points TEXT,
                challenges TEXT,
                improvements TEXT,
                next_month_goals TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        conn.commit()
        conn.close()

    def do_OPTIONS(self):
        """CORS プリフライトリクエストを処理"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """GET リクエストを処理"""
        path = self.path.split('?')[0]

        if path == '/health':
            self._send_json_response({
                "status": "healthy",
                "message": "月報作成支援ツール API",
                "version": "1.0.0"
            })

        elif path == '/api/reports':
            self._handle_get_reports()

        else:
            self._send_json_response({"error": "Not Found"}, 404)

    def do_POST(self):
        """POST リクエストを処理"""
        path = self.path.split('?')[0]

        if path == '/api/reports':
            self._handle_create_report()

        elif path == '/api/auth/login':
            self._handle_login()

        elif path == '/api/auth/register':
            self._handle_register()

        else:
            self._send_json_response({"error": "Not Found"}, 404)

    def _handle_get_reports(self):
        """月報一覧を取得"""
        try:
            self._init_database()
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
                SELECT r.*, u.name as user_name
                FROM monthly_reports r
                LEFT JOIN users u ON r.user_id = u.id
                ORDER BY r.created_at DESC
            ''')

            reports = []
            for row in cursor.fetchall():
                reports.append({
                    "id": row[0],
                    "user_id": row[1],
                    "report_month": row[2],
                    "current_phase": row[3],
                    "total_work_hours": row[4],
                    "coding_hours": row[5],
                    "meeting_hours": row[6],
                    "sales_hours": row[7],
                    "good_points": row[8],
                    "challenges": row[9],
                    "improvements": row[10],
                    "next_month_goals": row[11],
                    "created_at": row[12],
                    "updated_at": row[13],
                    "user_name": row[14] or "ユーザー"
                })

            conn.close()
            self._send_json_response({
                "reports": reports,
                "total": len(reports)
            })

        except Exception as e:
            self._send_json_response({"error": str(e)}, 500)

    def _handle_create_report(self):
        """月報を作成"""
        try:
            data = self._get_request_body()

            # バリデーション
            required_fields = ['report_month']
            for field in required_fields:
                if field not in data:
                    self._send_json_response({"error": f"Missing field: {field}"}, 400)
                    return

            self._init_database()
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # デフォルトユーザーIDを1に設定（簡単化のため）
            user_id = 1

            cursor.execute('''
                INSERT INTO monthly_reports (
                    user_id, report_month, current_phase, total_work_hours,
                    coding_hours, meeting_hours, sales_hours, good_points,
                    challenges, improvements, next_month_goals
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                data.get('report_month'),
                data.get('current_phase'),
                data.get('total_work_hours', 0),
                data.get('coding_hours', 0),
                data.get('meeting_hours', 0),
                data.get('sales_hours', 0),
                data.get('good_points'),
                data.get('challenges'),
                data.get('improvements'),
                data.get('next_month_goals')
            ))

            report_id = cursor.lastrowid
            conn.commit()
            conn.close()

            self._send_json_response({
                "message": "月報が正常に作成されました",
                "report_id": report_id,
                "success": True
            })

        except Exception as e:
            self._send_json_response({"error": str(e)}, 500)

    def _handle_login(self):
        """ログイン処理（デモ用）"""
        data = self._get_request_body()

        # デモ用の簡単な認証
        if data.get('email') == 'test@example.com' and data.get('password') == 'password':
            self._send_json_response({
                "access_token": "demo_token_12345",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "name": "テストユーザー",
                    "email": "test@example.com"
                }
            })
        else:
            self._send_json_response({"error": "Invalid credentials"}, 401)

    def _handle_register(self):
        """ユーザー登録処理（デモ用）"""
        data = self._get_request_body()

        try:
            self._init_database()
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # パスワードハッシュ化（簡単化）
            password_hash = hashlib.sha256(data.get('password', '').encode()).hexdigest()

            cursor.execute('''
                INSERT INTO users (name, email, password_hash)
                VALUES (?, ?, ?)
            ''', (
                data.get('name', 'ユーザー'),
                data.get('email', 'test@example.com'),
                password_hash
            ))

            user_id = cursor.lastrowid
            conn.commit()
            conn.close()

            self._send_json_response({
                "message": "ユーザー登録が完了しました",
                "user_id": user_id,
                "success": True
            })

        except sqlite3.IntegrityError:
            self._send_json_response({"error": "Email already exists"}, 400)
        except Exception as e:
            self._send_json_response({"error": str(e)}, 500)

def run_server(port=8765):
    """サーバーを起動"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MonthlyReportAPI)
    print(f"🚀 月報作成支援ツール API サーバーが起動しました")
    print(f"📍 URL: http://localhost:{port}")
    print(f"🔍 ヘルスチェック: http://localhost:{port}/health")
    print(f"📋 月報一覧: http://localhost:{port}/api/reports")
    print("🛑 停止するには Ctrl+C を押してください")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 サーバーを停止しています...")
        httpd.shutdown()

if __name__ == "__main__":
    run_server()