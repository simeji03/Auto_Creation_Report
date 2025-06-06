#!/usr/bin/env python3
"""
v1.0.7 AI月報生成機能のテストスクリプト
APIキーを使用した月報生成をテストします
"""

import requests
import json
import time

# APIエンドポイント
BASE_URL = "http://localhost:8000"

# テスト用のOpenAI APIキー（実際のキーに置き換えてください）
OPENAI_API_KEY = "your-api-key-here"  # ここに実際のAPIキーを入力

def test_conversation_api():
    """対話型月報生成APIのテスト"""
    print("=== 対話型月報生成APIテスト開始 ===\n")
    
    # 1. セッション開始
    print("1. セッション開始...")
    response = requests.post(
        f"{BASE_URL}/api/conversation/start",
        json={"report_month": "2024-12"}
    )
    
    if response.status_code != 200:
        print(f"エラー: {response.status_code}")
        print(response.text)
        return
    
    session_data = response.json()
    print(f"セッション開始成功: {session_data['session_id']}")
    print(f"最初の質問: {session_data['question']}\n")
    
    # 2. 全質問に回答（テストデータ使用）
    test_answers = [
        "160時間くらいです。",  # 稼働時間
        "120時間",  # コーディング時間
        "50件",  # 営業メール送信数
        "15件",  # 返信数
        "8件",  # 面談数
        "500000円",  # 受領金額
        "新しい技術の習得ができた",  # 良かった点
        "時間管理に苦労した",  # 課題
        "より効率的なコーディングを心がける"  # 来月の目標
    ]
    
    for i, answer in enumerate(test_answers):
        print(f"質問 {i+1} に回答中...")
        response = requests.post(
            f"{BASE_URL}/api/conversation/answer",
            json={
                "session_id": session_data['session_id'],
                "answer": answer,
                "session_data": session_data['session_data']
            }
        )
        
        if response.status_code != 200:
            print(f"エラー: {response.status_code}")
            print(response.text)
            return
        
        session_data = response.json()
        if not session_data['is_complete']:
            print(f"次の質問: {session_data['question']}")
    
    print("\n全質問への回答完了")
    
    # 3. 月報生成（APIキー付き）
    print("\n3. AI月報生成中...")
    headers = {
        'Content-Type': 'application/json',
        'X-OpenAI-API-Key': OPENAI_API_KEY
    }
    
    response = requests.post(
        f"{BASE_URL}/api/conversation/generate-report",
        headers=headers,
        json=session_data['session_data']
    )
    
    if response.status_code != 200:
        print(f"エラー: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    print("月報生成成功！")
    print(f"月報ID: {result['report_id']}")
    print(f"対象月: {result['report_month']}")
    
    if 'ai_generated_content' in result:
        print("\n=== AI生成コンテンツ（抜粋）===")
        print(result['ai_generated_content'][:500] + "...")
    else:
        print("\nAI生成コンテンツが見つかりません")

def test_test_report_api():
    """テスト月報生成APIのテスト"""
    print("\n\n=== テスト月報生成APIテスト開始 ===\n")
    
    headers = {
        'Content-Type': 'application/json',
        'X-OpenAI-API-Key': OPENAI_API_KEY
    }
    
    print("テスト月報生成中...")
    response = requests.post(
        f"{BASE_URL}/api/test/generate-test-report",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"エラー: {response.status_code}")
        print(response.text)
        return
    
    result = response.json()
    print("テスト月報生成成功！")
    print(f"月報ID: {result['report_id']}")
    print(f"対象月: {result['report_month']}")
    
    if 'ai_generated_content' in result:
        print("\n=== AI生成コンテンツ（抜粋）===")
        print(result['ai_generated_content'][:500] + "...")
    else:
        print("\nAI生成コンテンツが見つかりません")

if __name__ == "__main__":
    print("v1.0.7 AI月報生成機能テスト")
    print("=" * 50)
    print(f"ベースURL: {BASE_URL}")
    print(f"APIキー設定: {'設定済み' if OPENAI_API_KEY != 'your-api-key-here' else '未設定'}")
    print("=" * 50)
    
    if OPENAI_API_KEY == "your-api-key-here":
        print("\n⚠️  警告: OpenAI APIキーが設定されていません")
        print("このスクリプトの OPENAI_API_KEY 変数に実際のAPIキーを設定してください")
        print("\n標準フォーマット（AIなし）でテストを続行します...\n")
    
    try:
        # 対話型月報生成テスト
        test_conversation_api()
        
        # テスト月報生成テスト
        test_test_report_api()
        
    except requests.exceptions.ConnectionError:
        print("\n❌ エラー: APIサーバーに接続できません")
        print("月報作成アプリが起動していることを確認してください")
    except Exception as e:
        print(f"\n❌ 予期しないエラー: {e}")
    
    print("\n\nテスト完了")