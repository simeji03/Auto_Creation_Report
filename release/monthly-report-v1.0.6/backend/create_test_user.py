#!/usr/bin/env python3
"""
テスト用ユーザーアカウントを作成するスクリプト
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import User
from auth import get_password_hash

# データベース接続
DATABASE_URL = "sqlite:///./monthly_reports.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_user():
    """テストユーザーを作成"""
    db = SessionLocal()
    
    # テストユーザー情報
    test_email = "test@example.com"
    test_password = "test123"
    test_name = "テストユーザー"
    
    try:
        # 既存のユーザーをチェック
        existing_user = db.query(User).filter(User.email == test_email).first()
        
        if existing_user:
            print(f"✅ テストユーザーは既に存在します")
            print(f"   メール: {test_email}")
            print(f"   パスワード: {test_password}")
        else:
            # 新規ユーザー作成
            hashed_password = get_password_hash(test_password)
            new_user = User(
                email=test_email,
                name=test_name,
                hashed_password=hashed_password
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            print(f"✅ テストユーザーを作成しました！")
            print(f"   メール: {test_email}")
            print(f"   パスワード: {test_password}")
            print(f"   名前: {test_name}")
            
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== テストユーザー作成スクリプト ===")
    create_test_user()
    print("\nログインページ: http://localhost:3456/login")
    print("上記の認証情報でログインできます。")