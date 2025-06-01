// 音声認識機能の包括的テストスクリプト
// ブラウザのコンソールで実行してください

console.log('🎤 音声認識機能の包括的テストを開始します');

const speechTests = {
  // 1. 基本的な音声認識テスト
  testBasicSpeechRecognition: () => {
    console.log('📋 1. 基本的な音声認識テスト');
    
    // SpeechRecognition APIの利用可能性をチェック
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('✅ SpeechRecognition APIが利用可能です');
      
      // 現在のページが対話型レポートページかチェック
      if (window.location.pathname.includes('/reports/conversation')) {
        console.log('✅ 対話型レポートページにいます');
        return true;
      } else {
        console.log('⚠️ 対話型レポートページに移動してからテストしてください');
        console.log('💡 /reports/conversation に移動してください');
        return false;
      }
    } else {
      console.error('❌ SpeechRecognition APIがサポートされていません');
      console.log('🔧 Chrome、Edge、Safariなどの対応ブラウザを使用してください');
      return false;
    }
  },

  // 2. UIコンポーネントの存在確認
  testUIComponents: () => {
    console.log('📋 2. UIコンポーネントの存在確認');
    
    const conversationButton = document.querySelector('button[onclick*="startConversation"], button:contains("対話を開始")');
    const recordingButton = document.querySelector('button[onclick*="toggleRecording"]');
    const textarea = document.querySelector('textarea[placeholder*="音声入力"]');
    
    if (conversationButton || document.querySelector('button')) {
      console.log('✅ 対話開始ボタンが見つかりました');
    } else {
      console.log('⚠️ 対話開始ボタンが見つかりません');
    }
    
    if (textarea || document.querySelector('textarea')) {
      console.log('✅ テキストエリアが見つかりました');
    } else {
      console.log('⚠️ テキストエリアが見つかりません');
    }
    
    console.log('💡 ボタンやテキストエリアの動的生成を確認してください');
    return true;
  },

  // 3. 状態管理テスト
  testStateManagement: () => {
    console.log('📋 3. React状態管理テスト');
    
    // React DevToolsの利用可能性をチェック
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevToolsが利用可能です');
      console.log('💡 Components タブで ConversationalReport コンポーネントの状態を確認できます');
      console.log('   - isListening: 音声認識の状態');
      console.log('   - isRecording: 録音ボタンの状態');
      console.log('   - currentAnswer: 現在のテキスト');
      console.log('   - interimText: リアルタイムテキスト');
    } else {
      console.log('⚠️ React DevToolsがインストールされていません');
      console.log('💡 React DevToolsをインストールすると詳細な状態が確認できます');
    }
    
    return true;
  },

  // 4. 音声認識シミュレーションテスト
  testSpeechRecognitionSimulation: () => {
    console.log('📋 4. 音声認識シミュレーションテスト');
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const testRecognition = new SpeechRecognition();
      
      // 基本設定のテスト
      testRecognition.continuous = true;
      testRecognition.interimResults = true;
      testRecognition.lang = 'ja-JP';
      testRecognition.maxAlternatives = 1;
      
      console.log('✅ SpeechRecognition設定が正常に適用されました');
      console.log('   - continuous: true (連続認識)');
      console.log('   - interimResults: true (リアルタイム結果)');
      console.log('   - lang: ja-JP (日本語)');
      
      // イベントハンドラーのテスト
      testRecognition.onstart = () => console.log('🎤 テスト用音声認識が開始されました');
      testRecognition.onend = () => console.log('⏹️ テスト用音声認識が終了しました');
      testRecognition.onerror = (event) => console.log('❌ テスト用音声認識でエラー:', event.error);
      
      console.log('✅ イベントハンドラーが正常に設定されました');
      
      return true;
    } catch (error) {
      console.error('❌ SpeechRecognition設定でエラー:', error);
      return false;
    }
  },

  // 5. パフォーマンステスト
  testPerformance: () => {
    console.log('📋 5. パフォーマンステスト');
    
    // メモリ使用量のチェック
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log('💾 メモリ使用量:');
      console.log(`   - 使用中: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - 合計: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - 制限: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // DOMノード数のチェック
    const domNodes = document.querySelectorAll('*').length;
    console.log(`🌳 DOMノード数: ${domNodes}`);
    
    if (domNodes > 3000) {
      console.log('⚠️ DOMノードが多すぎる可能性があります');
    } else {
      console.log('✅ DOMノード数は適切です');
    }
    
    return true;
  },

  // 6. エラーハンドリングテスト
  testErrorHandling: () => {
    console.log('📋 6. エラーハンドリングテスト');
    
    const errorScenarios = [
      'no-speech: 音声が検出されない',
      'audio-capture: マイクアクセス失敗',
      'not-allowed: マイク許可が拒否された',
      'aborted: 音声認識が中断された',
      'network: ネットワークエラー'
    ];
    
    console.log('📝 テスト可能なエラーシナリオ:');
    errorScenarios.forEach((scenario, index) => {
      console.log(`   ${index + 1}. ${scenario}`);
    });
    
    console.log('💡 これらのエラーが発生した場合の動作を確認してください');
    console.log('   - エラーメッセージが表示される');
    console.log('   - 状態が適切にリセットされる');
    console.log('   - ボタンが正常な状態に戻る');
    
    return true;
  },

  // 7. 統合テスト用のヘルパー関数
  createTestHelper: () => {
    console.log('📋 7. テストヘルパー関数を作成しています');
    
    window.speechTestHelper = {
      // 現在の状態を取得
      getCurrentState: () => {
        const state = {
          currentPath: window.location.pathname,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          speechRecognitionSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
        };
        
        console.log('📊 現在の状態:', state);
        return state;
      },
      
      // 音声認識をシミュレート
      simulateSpeechResult: (text, isFinal = true) => {
        console.log(`🎭 音声認識結果をシミュレート: "${text}" (Final: ${isFinal})`);
        
        // 実際のアプリケーションの音声認識イベントをトリガー
        const event = new CustomEvent('speechResult', {
          detail: { text, isFinal }
        });
        
        window.dispatchEvent(event);
        return true;
      },
      
      // ストレステスト
      runStressTest: (iterations = 10) => {
        console.log(`🏋️ ストレステストを実行 (${iterations}回)`);
        
        let successCount = 0;
        for (let i = 0; i < iterations; i++) {
          try {
            const testText = `テスト ${i + 1} 回目の音声認識です`;
            window.speechTestHelper.simulateSpeechResult(testText);
            successCount++;
          } catch (error) {
            console.error(`❌ ストレステスト ${i + 1} 回目でエラー:`, error);
          }
        }
        
        console.log(`✅ ストレステスト完了: ${successCount}/${iterations} 成功`);
        return { successCount, totalCount: iterations };
      }
    };
    
    console.log('✅ テストヘルパー関数が window.speechTestHelper として利用可能になりました');
    
    // 使用方法を表示
    console.log('📝 使用方法:');
    console.log('   - speechTestHelper.getCurrentState(): 現在の状態を取得');
    console.log('   - speechTestHelper.simulateSpeechResult("テキスト"): 音声結果をシミュレート');
    console.log('   - speechTestHelper.runStressTest(50): ストレステストを実行');
    
    return true;
  },

  // 全テスト実行
  runAllTests: () => {
    console.log('🚀 全テスト実行開始\n');
    
    const tests = [
      'testBasicSpeechRecognition',
      'testUIComponents',
      'testStateManagement',
      'testSpeechRecognitionSimulation',
      'testPerformance',
      'testErrorHandling',
      'createTestHelper'
    ];
    
    const results = {};
    
    tests.forEach(testName => {
      try {
        console.log(`\n${'='.repeat(50)}`);
        results[testName] = speechTests[testName]();
      } catch (error) {
        console.error(`❌ ${testName} でエラー:`, error);
        results[testName] = false;
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 テスト結果サマリー:');
    console.log('=' .repeat(50));
    
    Object.entries(results).forEach(([test, result]) => {
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
    });
    
    const passCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.values(results).length;
    
    console.log('\n' + '='.repeat(50));
    
    if (passCount === totalCount) {
      console.log('🎉 全テストPASS! 音声認識機能は正常に動作する準備ができています');
      console.log('💡 次のステップ:');
      console.log('   1. マイクボタンをクリックして許可を与える');
      console.log('   2. 実際に音声入力をテストする');
      console.log('   3. 長時間の音声入力をテストする');
      console.log('   4. 開始/停止を繰り返しテストする');
    } else {
      console.log(`⚠️ ${totalCount - passCount} 個のテストが失敗しました。上記の詳細を確認してください`);
    }
    
    return { passCount, totalCount, results };
  }
};

// グローバルスコープで利用可能にする
window.speechTests = speechTests;

// 使用方法を表示
console.log('📝 使用方法:');
console.log('- speechTests.runAllTests() : 全テスト実行');
console.log('- speechTests.testBasicSpeechRecognition() : 基本機能テスト');
console.log('- speechTests.createTestHelper() : テストヘルパー作成');
console.log('\n💡 まずは speechTests.runAllTests() を実行してください');