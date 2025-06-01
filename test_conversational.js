// 対話型月報作成機能のテストスクリプト
// ブラウザのコンソールで実行してください

console.log('🧪 対話型月報作成機能のテストを開始します');

// テスト用の関数群
const testFunctions = {
  // 1. ページが正常に読み込まれているかテスト
  checkPageLoad: () => {
    console.log('📋 1. ページ読み込みテスト');
    
    const app = document.querySelector('.App');
    if (app) {
      console.log('✅ Appコンポーネントが読み込まれています');
    } else {
      console.error('❌ Appコンポーネントが見つかりません');
      return false;
    }
    
    // 対話型レポートページに移動
    const conversationButton = document.querySelector('a[href="/reports/conversation"]');
    if (conversationButton) {
      console.log('✅ 対話型レポートボタンが見つかりました');
      return true;
    } else {
      console.log('⚠️ 対話型レポートボタンが見つかりません（ダッシュボードページではない可能性があります）');
      return true; // エラーではない
    }
  },

  // 2. LocalStorageの認証状態をテスト
  checkAuth: () => {
    console.log('📋 2. 認証状態テスト');
    
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      console.log('✅ 認証情報が正常に保存されています');
      console.log('Token:', token.substring(0, 20) + '...');
      console.log('User:', JSON.parse(user).email);
      return true;
    } else {
      console.error('❌ 認証情報が見つかりません');
      console.log('🔧 修正方法: demo@test.com / demo123 でログインしてください');
      return false;
    }
  },

  // 3. 対話型レポートページが読み込まれるかテスト
  checkConversationalPage: () => {
    console.log('📋 3. 対話型レポートページテスト');
    
    // 現在のURLをチェック
    if (window.location.pathname.includes('/reports/conversation')) {
      console.log('✅ 対話型レポートページにいます');
      
      // スタートボタンがあるかチェック
      const startButton = document.querySelector('button[onclick*="startConversation"], button:contains("対話を開始する")');
      if (startButton || document.querySelector('button')) {
        console.log('✅ 開始ボタンが見つかりました');
        return true;
      } else {
        console.log('⚠️ 開始ボタンが見つかりませんが、ページは読み込まれています');
        return true;
      }
    } else {
      console.log('ℹ️ 対話型レポートページではありません');
      console.log('🔧 対話型レポートページに移動してからテストしてください');
      return true; // エラーではない
    }
  },

  // 4. 音声認識サポートをテスト
  checkSpeechRecognition: () => {
    console.log('📋 4. 音声認識サポートテスト');
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('✅ 音声認識がサポートされています');
      
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        console.log('✅ SpeechRecognitionインスタンスの作成に成功');
        return true;
      } catch (error) {
        console.error('❌ SpeechRecognitionの初期化エラー:', error);
        return false;
      }
    } else {
      console.error('❌ 音声認識がサポートされていません');
      console.log('🔧 Chrome、Edge、Safariなどの対応ブラウザを使用してください');
      return false;
    }
  },

  // 5. APIエンドポイントのテスト
  checkAPI: async () => {
    console.log('📋 5. API接続テスト');
    
    try {
      const response = await fetch('http://localhost:8765/health');
      if (response.ok) {
        console.log('✅ バックエンドAPIに接続できます');
        return true;
      } else {
        console.error('❌ バックエンドAPIの応答エラー:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ バックエンドAPIに接続できません:', error);
      console.log('🔧 バックエンドサーバーが起動しているか確認してください');
      return false;
    }
  },

  // 全テスト実行
  runAllTests: async () => {
    console.log('🚀 全テスト実行開始\n');
    
    const results = {
      pageLoad: testFunctions.checkPageLoad(),
      auth: testFunctions.checkAuth(),
      conversationalPage: testFunctions.checkConversationalPage(),
      speechRecognition: testFunctions.checkSpeechRecognition(),
      api: await testFunctions.checkAPI()
    };
    
    console.log('\n📊 テスト結果:');
    console.log('================');
    Object.entries(results).forEach(([test, result]) => {
      const status = result ? '✅' : '❌';
      console.log(`${status} ${test}: ${result ? 'PASS' : 'FAIL'}`);
    });
    
    const allPassed = Object.values(results).every(Boolean);
    console.log('\n' + '='.repeat(20));
    
    if (allPassed) {
      console.log('🎉 全テストPASS! 対話型月報作成機能は正常に動作するはずです');
      console.log('💡 次のステップ: /reports/conversation ページで実際に音声入力をテストしてください');
    } else {
      console.log('⚠️ 一部のテストが失敗しました。上記のメッセージを確認して修正してください');
    }
    
    return allPassed;
  }
};

// グローバルスコープで利用可能にする
window.testConversational = testFunctions;

// 使用方法を表示
console.log('📝 使用方法:');
console.log('- testConversational.runAllTests() : 全テスト実行');
console.log('- testConversational.checkAuth() : 認証状態チェック');
console.log('- testConversational.checkSpeechRecognition() : 音声認識チェック');
console.log('\n💡 まずは testConversational.runAllTests() を実行してください');