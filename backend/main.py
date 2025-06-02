"""
月報作成支援ツール - メインAPI
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from database import create_tables
from routers import auth, reports, users, ai_assistant, conversation, reports_no_auth, conversation_no_auth, test_data_no_auth
import routers.conversation_no_auth_detailed as conversation_no_auth_detailed
import routers.test_data_no_auth_detailed as test_data_no_auth_detailed

# 環境変数を読み込み
load_dotenv()

# データベースの初期化
@asynccontextmanager
async def lifespan(app: FastAPI):
    # アプリケーション開始時
    create_tables()
    yield
    # アプリケーション終了時（必要に応じてクリーンアップ処理）

# FastAPIアプリケーションの作成
app = FastAPI(
    title="月報作成支援ツール API",
    description="コミュニティメンバーの月報作成を効率化するAPIサービス",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3456").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# セキュリティ
security = HTTPBearer()

# ルーターの登録
app.include_router(auth.router, prefix="/api/auth", tags=["認証"])
app.include_router(users.router, prefix="/api/users", tags=["ユーザー"])
app.include_router(reports_no_auth.router, prefix="/api/reports", tags=["月報（認証無効版）"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI支援"])
app.include_router(conversation_no_auth_detailed.router, prefix="/api/conversation", tags=["対話型月報生成（認証無効版）"])
app.include_router(test_data_no_auth_detailed.router, prefix="/api/test", tags=["テストデータ（認証無効版）"])

# エラーハンドラー
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTPExceptionのカスタムハンドラー（CORSヘッダーを確実に含める）"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3456",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """一般的な例外のカスタムハンドラー"""
    print(f"未処理のエラー: {type(exc).__name__}: {exc}")
    import traceback
    traceback.print_exc()
    
    return JSONResponse(
        status_code=500,
        content={"detail": f"内部サーバーエラー: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:3456",
            "Access-Control-Allow-Credentials": "true"
        }
    )

@app.get("/")
async def root():
    """
    APIのルートエンドポイント
    """
    return {
        "message": "月報作成支援ツール API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """
    ヘルスチェックエンドポイント
    """
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8765,
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )