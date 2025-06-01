// 手動テスト用JavaScript
// ブラウザのコンソールで実行してください

console.log('🎤 音声認識機能の手動テストを開始します');

// 1. 現在のページ確認
console.log('現在のURL:', window.location.href);
console.log('現在のページタイトル:', document.title);

// 2. 音声認識API確認
const speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
console.log('音声認識サポート:', speechSupported ? 'YES' : 'NO');

// 3. React状態確認用のヘルパー
window.testHelper = {
  // DOM要素を探す
  findElements: () => {
    const results = {
      startButton: document.querySelector('button[onclick*="startConversation"]') || 
                   Array.from(document.querySelectorAll('button')).find(btn => 
                     btn.textContent.includes('対話を開始')),
      recordButton: Array.from(document.querySelectorAll('button')).find(btn => 
                    btn.textContent.includes('音声入力') || btn.textContent.includes('録音')),
      textarea: document.querySelector('textarea'),
      progressBar: document.querySelector('[style*="width"]'),
      questionArea: document.querySelector('h3') // 質問エリア
    };
    
    console.log('DOM要素検索結果:');
    Object.entries(results).forEach(([key, element]) => {
      console.log(`${key}:`, element ? '✅ 見つかりました' : '❌ 見つかりません');
      if (element) {
        console.log(`  - テキスト: "${element.textContent?.slice(0, 50)}..."`);
        console.log(`  - クラス: "${element.className}"`);
      }
    });
    
    return results;
  },
  
  // ボタン状態をチェック
  checkButtonStates: () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    console.log(`総ボタン数: ${buttons.length}`);
    
    buttons.forEach((btn, index) => {
      console.log(`ボタン ${index + 1}: "${btn.textContent}" (disabled: ${btn.disabled})`);
    });
  },
  
  // コンソールエラーを監視
  monitorConsole: () => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    window.testLogs = [];
    
    console.log = (...args) => {
      window.testLogs.push({ type: 'log', args, timestamp: new Date() });
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      window.testLogs.push({ type: 'error', args, timestamp: new Date() });
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      window.testLogs.push({ type: 'warn', args, timestamp: new Date() });
      originalWarn.apply(console, args);
    };
    
    console.log('コンソール監視を開始しました');
  },
  
  // テストログを確認
  checkLogs: () => {
    if (!window.testLogs) {
      console.log('ログ監視が開始されていません');
      return;
    }
    
    const errors = window.testLogs.filter(log => log.type === 'error');
    const warnings = window.testLogs.filter(log => log.type === 'warn');
    
    console.log(`エラー: ${errors.length} 件`);
    console.log(`警告: ${warnings.length} 件`);
    
    if (errors.length > 0) {
      console.log('エラー詳細:');
      errors.forEach(error => console.error(error.timestamp, ...error.args));
    }
    
    if (warnings.length > 0) {
      console.log('警告詳細:');
      warnings.forEach(warn => console.warn(warn.timestamp, ...warn.args));
    }
  },
  
  // 音声認識テスト実行
  testSpeechRecognition: () => {
    if (!speechSupported) {
      console.error('音声認識がサポートされていません');
      return false;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => console.log('✅ 音声認識開始');
      recognition.onend = () => console.log('✅ 音声認識終了');
      recognition.onerror = (event) => console.error('❌ 音声認識エラー:', event.error);
      recognition.onresult = (event) => {
        console.log('✅ 音声認識結果受信:', event.results.length);
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          console.log(`  ${i}: "${result[0].transcript}" (final: ${result.isFinal})`);
        }
      };
      
      console.log('テスト用音声認識を5秒間実行します...');
      recognition.start();
      
      setTimeout(() => {
        recognition.stop();
        console.log('テスト用音声認識を停止しました');
      }, 5000);
      
      return true;
    } catch (error) {
      console.error('音声認識テストでエラー:', error);
      return false;
    }
  },
  
  // パフォーマンステスト
  checkPerformance: () => {
    console.log('📊 パフォーマンス情報:');
    
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log(`メモリ使用量: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`メモリ合計: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`メモリ制限: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    }
    
    const domNodes = document.querySelectorAll('*').length;
    console.log(`DOMノード数: ${domNodes}`);
    
    // React DevToolsチェック
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevToolsが利用可能です');
    } else {
      console.log('⚠️ React DevToolsがインストールされていません');
    }
  },
  
  // 完全テスト実行
  runFullTest: () => {
    console.log('🚀 完全テスト実行開始');
    
    // 1. コンソール監視開始
    window.testHelper.monitorConsole();
    
    // 2. DOM要素確認
    const elements = window.testHelper.findElements();
    
    // 3. ボタン状態確認
    window.testHelper.checkButtonStates();
    
    // 4. パフォーマンス確認
    window.testHelper.checkPerformance();
    
    // 5. 音声認識テスト
    const speechTest = window.testHelper.testSpeechRecognition();
    
    console.log('📋 テスト結果サマリー:');
    console.log('DOM要素:', Object.values(elements).filter(Boolean).length + '/' + Object.keys(elements).length + ' 見つかりました');
    console.log('音声認識テスト:', speechTest ? '✅ 成功' : '❌ 失敗');
    
    return {
      elements,
      speechTest,
      timestamp: new Date().toISOString()
    };
  }
};

// 使用方法を表示
console.log('📝 使用方法:');
console.log('- testHelper.findElements(): DOM要素を探す');
console.log('- testHelper.checkButtonStates(): ボタン状態を確認');
console.log('- testHelper.testSpeechRecognition(): 音声認識をテスト');
console.log('- testHelper.checkPerformance(): パフォーマンスを確認');
console.log('- testHelper.runFullTest(): 完全テストを実行');
console.log('- testHelper.checkLogs(): エラーログを確認');

console.log('\n💡 最初に testHelper.runFullTest() を実行することをお勧めします');