#!/bin/bash

echo "🧹 リリース前のクリーンアップを開始します..."
echo ""

# 現在のディレクトリを保存
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# 削除対象ファイルのリスト
echo "📝 削除対象ファイル:"
echo ""

# テストファイル
echo "テストファイル:"
find . -name "test_*.js" -o -name "test_*.json" -o -name "test_*.py" -o -name "test_*.sh" | grep -v node_modules

# スクリーンショット
echo ""
echo "スクリーンショット:"
find . -name "*.png" | grep -v node_modules | grep -v public

# その他のテストファイル
echo ""
echo "その他のテストファイル:"
ls -la | grep -E "(integration-test|automation_test|manual|debug)" | grep -v node_modules

# ログファイル
echo ""
echo "ログファイル:"
find . -name "*.log" | grep -v node_modules

# データベース
echo ""
echo "データベース:"
find . -name "*.db" | grep -v node_modules

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 確認
read -p "上記のファイルを削除してよろしいですか？ (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🗑️  ファイルを削除中..."
    
    # テストファイルの削除
    find . -name "test_*.js" -o -name "test_*.json" -o -name "test_*.py" -o -name "test_*.sh" | grep -v node_modules | xargs rm -f
    
    # スクリーンショットの削除
    find . -name "*.png" | grep -v node_modules | grep -v public | xargs rm -f
    
    # その他のテストファイルの削除
    rm -f integration-test.js
    rm -f complete-integration-test.js
    rm -f automation_test.js
    rm -f manual-verify.js
    rm -f manual_test_script.js
    rm -f debug_*.js
    
    # ログファイルの削除
    find . -name "*.log" | grep -v node_modules | xargs rm -f
    
    # 環境変数ファイルのチェック
    if [ -f "backend/.env" ]; then
        echo ""
        echo "⚠️  backend/.envファイルが存在します"
        echo "   SECRET_KEYを本番用に変更することを推奨します"
        read -p "   .envファイルを削除しますか？ (y/N): " delete_env
        if [[ $delete_env =~ ^[Yy]$ ]]; then
            rm -f backend/.env
            echo "   ✅ .envファイルを削除しました"
        fi
    fi
    
    # データベースの削除
    read -p "データベースファイルも削除しますか？ (y/N): " delete_db
    if [[ $delete_db =~ ^[Yy]$ ]]; then
        find . -name "*.db" | grep -v node_modules | xargs rm -f
        echo "✅ データベースファイルを削除しました"
    fi
    
    echo ""
    echo "✅ クリーンアップ完了！"
    
else
    echo ""
    echo "❌ クリーンアップをキャンセルしました"
fi

echo ""
echo "📋 次のステップ:"
echo "1. git add -A"
echo "2. git commit -m 'chore: リリース前のクリーンアップ'"
echo "3. git push"
echo "4. GitHub Releasesでリリースを作成"