"""
削除エンドポイントのバックエンドテスト
"""
import requests
import json

def test_delete_endpoint():
    """削除エンドポイントの詳細テスト"""
    
    # まず既存の月報を取得
    print("1. 月報一覧を取得...")
    response = requests.get("http://localhost:8000/api/reports/?page=1&size=5")
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return
    
    reports = response.json()
    if isinstance(reports, dict) and 'items' in reports:
        reports_list = reports['items']
    else:
        reports_list = reports
    
    if not reports_list:
        print("月報が見つかりません")
        return
    
    # 最初の月報のIDを取得
    report_id = reports_list[0]['id']
    print(f"\n2. 月報ID {report_id} の削除をテスト...")
    
    # DELETEリクエストを送信
    try:
        delete_response = requests.delete(
            f"http://localhost:8000/api/reports/{report_id}",
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:3456"
            }
        )
        
        print(f"Status: {delete_response.status_code}")
        print(f"Headers: {dict(delete_response.headers)}")
        
        if delete_response.status_code == 200:
            print(f"Response: {delete_response.json()}")
        else:
            print(f"Error Response: {delete_response.text}")
            
    except Exception as e:
        print(f"Exception: {type(e).__name__}: {e}")
    
    # 存在しないIDでもテスト
    print(f"\n3. 存在しないID 99999 の削除をテスト...")
    try:
        delete_response = requests.delete(
            "http://localhost:8000/api/reports/99999",
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:3456"
            }
        )
        
        print(f"Status: {delete_response.status_code}")
        if delete_response.status_code != 200:
            print(f"Error Response: {delete_response.text}")
            
    except Exception as e:
        print(f"Exception: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_delete_endpoint()