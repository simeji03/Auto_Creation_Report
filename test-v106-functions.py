#!/usr/bin/env python3
"""
月報作成支援ツール v1.0.6 機能テストスクリプト
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3456"

# テスト用のデータ
TEST_USER = {
    "username": f"testuser_{int(time.time())}",
    "password": "TestPassword123!",
    "email": f"test_{int(time.time())}@example.com"
}

class TestRunner:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.report_id = None
        self.passed = 0
        self.failed = 0
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        if status == "PASS":
            print(f"[{timestamp}] ✅ {message}")
        elif status == "FAIL":
            print(f"[{timestamp}] ❌ {message}")
        elif status == "TEST":
            print(f"\n[{timestamp}] 🧪 {message}")
        else:
            print(f"[{timestamp}] {message}")
    
    def run_test(self, test_name, test_func):
        self.log(f"Testing: {test_name}", "TEST")
        try:
            result = test_func()
            if result:
                self.log(f"{test_name} passed", "PASS")
                self.passed += 1
            else:
                self.log(f"{test_name} failed", "FAIL")
                self.failed += 1
            return result
        except Exception as e:
            self.log(f"{test_name} error: {str(e)}", "FAIL")
            self.failed += 1
            return False
    
    def test_health_check(self):
        """ヘルスチェックのテスト"""
        try:
            # バックエンド
            r = requests.get(f"{BASE_URL}/health")
            backend_ok = r.status_code == 200 and r.json()["status"] == "healthy"
            
            # フロントエンド
            r = requests.get(FRONTEND_URL)
            frontend_ok = r.status_code == 200 and "月報作成支援ツール" in r.text
            
            return backend_ok and frontend_ok
        except:
            return False
    
    def test_user_registration(self):
        """ユーザー登録のテスト"""
        try:
            r = requests.post(
                f"{BASE_URL}/register",
                json=TEST_USER
            )
            if r.status_code == 200:
                data = r.json()
                self.user_id = data.get("id")
                self.log(f"User created with ID: {self.user_id}")
                return True
            else:
                self.log(f"Registration failed: {r.status_code} - {r.text}")
                return False
        except Exception as e:
            self.log(f"Registration error: {str(e)}")
            return False
    
    def test_user_login(self):
        """ログイン機能のテスト"""
        try:
            r = requests.post(
                f"{BASE_URL}/token",
                data={
                    "username": TEST_USER["username"],
                    "password": TEST_USER["password"]
                }
            )
            if r.status_code == 200:
                data = r.json()
                self.token = data.get("access_token")
                self.log(f"Login successful, token received")
                return True
            else:
                self.log(f"Login failed: {r.status_code}")
                return False
        except:
            return False
    
    def test_create_report(self):
        """月報作成のテスト"""
        if not self.token:
            self.log("No token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            report_data = {
                "employee_name": "テストユーザー",
                "period": "2024年12月",
                "current_phase": "プロジェクト実行中",
                "working_days": 20,
                "working_hours": 160.0,
                "achievements": ["機能テスト実施", "品質向上"],
                "challenges": ["時間管理"],
                "next_month_goals": ["効率化"],
                "comments": "v1.0.6テスト"
            }
            
            r = requests.post(
                f"{BASE_URL}/reports/",
                json=report_data,
                headers=headers
            )
            
            if r.status_code == 200:
                data = r.json()
                self.report_id = data.get("id")
                self.log(f"Report created with ID: {self.report_id}")
                return True
            else:
                self.log(f"Report creation failed: {r.status_code} - {r.text}")
                return False
        except Exception as e:
            self.log(f"Report creation error: {str(e)}")
            return False
    
    def test_get_reports(self):
        """月報一覧取得のテスト"""
        if not self.token:
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            r = requests.get(f"{BASE_URL}/reports/", headers=headers)
            
            if r.status_code == 200:
                reports = r.json()
                self.log(f"Found {len(reports)} reports")
                return len(reports) > 0
            return False
        except:
            return False
    
    def test_update_report(self):
        """月報更新のテスト"""
        if not self.token or not self.report_id:
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            update_data = {
                "comments": "更新テスト - v1.0.6"
            }
            
            r = requests.put(
                f"{BASE_URL}/reports/{self.report_id}",
                json=update_data,
                headers=headers
            )
            
            return r.status_code == 200
        except:
            return False
    
    def test_pdf_export(self):
        """PDF出力のテスト"""
        if not self.token or not self.report_id:
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            r = requests.get(
                f"{BASE_URL}/reports/{self.report_id}/pdf",
                headers=headers
            )
            
            if r.status_code == 200:
                # PDFファイルかどうか確認
                content_type = r.headers.get('content-type', '')
                return 'application/pdf' in content_type
            return False
        except:
            return False
    
    def test_data_persistence(self):
        """データ永続化のテスト"""
        # _app/dataフォルダの存在確認
        import os
        data_path = "/Users/harry/Dropbox/Tool_Development/Auto_Creation_Report/release/monthly-report-v1.0.6/_app/data"
        
        # データベースファイルの存在確認
        db_exists = os.path.exists(f"{data_path}/monthly_reports.db")
        
        if db_exists:
            self.log(f"Database file found at {data_path}")
            return True
        else:
            self.log("Database file not found in expected location")
            return False
    
    def test_api_key_settings(self):
        """APIキー設定機能のテスト"""
        if not self.token:
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # APIキー設定
            r = requests.post(
                f"{BASE_URL}/settings/api-key",
                json={"api_key": "test-api-key-12345"},
                headers=headers
            )
            
            if r.status_code == 200:
                # APIキー取得
                r = requests.get(f"{BASE_URL}/settings/api-key", headers=headers)
                return r.status_code == 200 and "test-api-key" in r.json().get("api_key", "")
            return False
        except:
            return False
    
    def test_delete_report(self):
        """月報削除のテスト"""
        if not self.token or not self.report_id:
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            r = requests.delete(
                f"{BASE_URL}/reports/{self.report_id}",
                headers=headers
            )
            
            return r.status_code == 200
        except:
            return False
    
    def run_all_tests(self):
        """すべてのテストを実行"""
        print("=" * 60)
        print("🧪 月報作成支援ツール v1.0.6 機能テスト")
        print("=" * 60)
        
        # テスト実行
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Create Report", self.test_create_report),
            ("Get Reports List", self.test_get_reports),
            ("Update Report", self.test_update_report),
            ("PDF Export", self.test_pdf_export),
            ("Data Persistence", self.test_data_persistence),
            ("API Key Settings", self.test_api_key_settings),
            ("Delete Report", self.test_delete_report),
        ]
        
        for test_name, test_func in tests:
            self.run_test(test_name, test_func)
            time.sleep(0.5)  # サーバーへの負荷を軽減
        
        # 結果サマリー
        print("\n" + "=" * 60)
        print("📊 テスト結果サマリー")
        print("=" * 60)
        print(f"✅ 成功: {self.passed}")
        print(f"❌ 失敗: {self.failed}")
        print(f"📈 成功率: {(self.passed / (self.passed + self.failed) * 100):.1f}%")
        
        return self.failed == 0

if __name__ == "__main__":
    # アプリケーションの起動を待つ
    print("⏳ Waiting for application to be ready...")
    time.sleep(3)
    
    # テスト実行
    runner = TestRunner()
    success = runner.run_all_tests()
    
    # 終了コード
    sys.exit(0 if success else 1)