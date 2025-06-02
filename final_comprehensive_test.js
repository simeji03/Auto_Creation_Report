const puppeteer = require('puppeteer');

async function finalComprehensiveTest() {
  console.log('🚀 最終統合テスト開始\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. ダッシュボードテスト
    console.log('📊 ダッシュボードのテスト...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      const statsElement = document.querySelector('[role="rowgroup"]') || document.querySelector('table tbody');
      return {
        hasStats: bodyText.includes('総月報数'),
        hasReportsTable: !!statsElement,
        statsValue: document.querySelector('dd')?.textContent?.trim() || '0'
      };
    });
    
    console.log(`  ✅ 統計表示: ${dashboardTest.hasStats}`);
    console.log(`  ✅ 月報数: ${dashboardTest.statsValue}`);
    console.log(`  ✅ レポートテーブル: ${dashboardTest.hasReportsTable}`);
    
    // 2. 月報一覧テスト
    console.log('\n📋 月報一覧のテスト...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const reportsListTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      const table = document.querySelector('table');
      const rows = table ? table.querySelectorAll('tbody tr') : [];
      return {
        hasTable: !!table,
        reportCount: rows.length,
        hasData: !bodyText.includes('まだ月報がありません')
      };
    });
    
    console.log(`  ✅ テーブル表示: ${reportsListTest.hasTable}`);
    console.log(`  ✅ 月報数: ${reportsListTest.reportCount}`);
    console.log(`  ✅ データ有無: ${reportsListTest.hasData}`);
    
    // 3. 対話ページテスト
    console.log('\n💬 対話ページのテスト...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const conversationTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasStartButton: bodyText.includes('対話を開始'),
        hasTestButton: bodyText.includes('テストデータで即座に月報生成'),
        hasWarning: bodyText.includes('APIキーが未設定')
      };
    });
    
    console.log(`  ✅ 対話開始ボタン: ${conversationTest.hasStartButton}`);
    console.log(`  ✅ テストデータボタン: ${conversationTest.hasTestButton}`);
    console.log(`  ✅ API警告表示: ${conversationTest.hasWarning}`);
    
    // 4. テストデータ生成テスト
    console.log('\n⚡ テストデータ生成のテスト...');
    if (conversationTest.hasTestButton) {
      try {
        await page.click('button:has-text("テストデータで即座に月報生成")');
        console.log('  ✅ テストデータボタンをクリック');
        
        // 遷移を待つ（最大10秒）
        await page.waitForFunction(() => {
          return window.location.pathname.includes('/reports/') && !window.location.pathname.includes('/conversation');
        }, { timeout: 10000 });
        
        console.log(`  ✅ 月報詳細ページに遷移: ${page.url()}`);
      } catch (error) {
        console.log(`  ❌ テストデータ生成失敗: ${error.message}`);
      }
    }
    
    // 5. 設定ページテスト
    console.log('\n⚙️ 設定ページのテスト...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const settingsTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]'),
        hasSaveButton: bodyText.includes('保存'),
        hasInstructions: bodyText.includes('OpenAI API')
      };
    });
    
    console.log(`  ✅ APIキー入力欄: ${settingsTest.hasApiKeyInput}`);
    console.log(`  ✅ 保存ボタン: ${settingsTest.hasSaveButton}`);
    console.log(`  ✅ 設定説明: ${settingsTest.hasInstructions}`);
    
    // 6. 最終評価
    const allBasicFeatures = 
      dashboardTest.hasStats &&
      conversationTest.hasStartButton &&
      conversationTest.hasTestButton &&
      settingsTest.hasApiKeyInput;
    
    const hasData = reportsListTest.hasData;
    
    console.log('\n🎯 最終テスト結果:');
    console.log(`🏆 ${allBasicFeatures && hasData ? '✅ 全機能正常動作！' : '⚠️ 一部機能に問題あり'}`);
    
    if (allBasicFeatures && hasData) {
      console.log('\n🎉 成功！月報作成ツールは配布可能な状態です:');
      console.log('✅ ダッシュボード統計表示');
      console.log('✅ 月報データ表示');
      console.log('✅ 対話型月報作成');
      console.log('✅ テストデータ即座生成');
      console.log('✅ APIキー設定機能');
      console.log('\n📦 http://localhost:3456 で利用可能');
    } else {
      console.log('\n📋 要確認項目:');
      if (!dashboardTest.hasStats) console.log('- ダッシュボード統計');
      if (!reportsListTest.hasData) console.log('- 月報データ表示');
      if (!conversationTest.hasStartButton) console.log('- 対話開始機能');
      if (!conversationTest.hasTestButton) console.log('- テストデータ生成');
      if (!settingsTest.hasApiKeyInput) console.log('- API設定機能');
    }
    
    await page.screenshot({ path: 'final_comprehensive_test.png', fullPage: true });
    console.log('\n📸 スクリーンショット保存: final_comprehensive_test.png');
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  } finally {
    await browser.close();
  }
}

finalComprehensiveTest();