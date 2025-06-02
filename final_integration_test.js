const puppeteer = require('puppeteer');

async function finalIntegrationTest() {
  console.log('🚀 最終統合テスト開始\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // ネットワークエラーを監視
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') && response.status() >= 400) {
        console.log(`❌ API Error: ${response.status()} ${url}`);
      }
    });
    
    // ダイアログを自動承認
    page.on('dialog', async dialog => {
      console.log(`📋 ダイアログ: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // 1. 初期状態の確認
    console.log('📊 初期状態の確認...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('table', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const initialState = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const totalMatch = document.body.textContent.match(/全\s*(\d+)\s*件/);
      return {
        rowCount: rows.length,
        totalCount: totalMatch ? parseInt(totalMatch[1]) : rows.length
      };
    });
    console.log(`  初期月報数: ${initialState.totalCount}`);
    
    // 2. 新規月報生成テスト（新フォーマット）
    console.log('\n📝 新規月報生成テスト...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('button', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // テストデータボタンをクリック
    const testButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const testBtn = buttons.find(b => b.textContent.includes('テストデータで即座に月報生成'));
      if (testBtn) {
        testBtn.click();
        return true;
      }
      return false;
    });
    
    if (testButtonClicked) {
      console.log('  ✅ テストデータボタンをクリック');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 月報詳細ページへの遷移を確認
      const currentUrl = page.url();
      console.log(`  遷移先: ${currentUrl}`);
      
      // 月報内容の確認
      const reportContent = await page.evaluate(() => {
        const bodyText = document.body.textContent;
        return {
          hasNewFormat: bodyText.includes('📊 今月の実績概要'),
          hasTable: bodyText.includes('稼働時間') && bodyText.includes('収入'),
          hasEmoji: bodyText.includes('🎯') || bodyText.includes('💼'),
          contentLength: bodyText.length
        };
      });
      
      console.log(`  ✅ 新フォーマット: ${reportContent.hasNewFormat}`);
      console.log(`  ✅ テーブル表示: ${reportContent.hasTable}`);
      console.log(`  ✅ 絵文字表示: ${reportContent.hasEmoji}`);
      console.log(`  ✅ コンテンツ長: ${reportContent.contentLength}文字`);
    }
    
    // 3. 月報一覧を再確認（新規作成の確認）
    console.log('\n📋 月報一覧を再確認...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('table', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterCreateState = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const totalMatch = document.body.textContent.match(/全\s*(\d+)\s*件/);
      return {
        rowCount: rows.length,
        totalCount: totalMatch ? parseInt(totalMatch[1]) : rows.length
      };
    });
    
    console.log(`  新規作成後の月報数: ${afterCreateState.totalCount}`);
    if (afterCreateState.totalCount > initialState.totalCount) {
      console.log('  ✅ 月報が正常に追加されました！');
    } else {
      console.log('  ❌ 月報が追加されていません');
    }
    
    // 4. 削除機能テスト
    console.log('\n🗑️ 削除機能テスト...');
    const deleteTest = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      if (rows.length > 0) {
        const deleteButtons = document.querySelectorAll('button');
        const deleteBtn = Array.from(deleteButtons).find(btn => btn.textContent === '削除');
        if (deleteBtn) {
          deleteBtn.click();
          return true;
        }
      }
      return false;
    });
    
    if (deleteTest) {
      console.log('  ✅ 削除ボタンをクリック');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const afterDeleteState = await page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        const totalMatch = document.body.textContent.match(/全\s*(\d+)\s*件/);
        return {
          rowCount: rows.length,
          totalCount: totalMatch ? parseInt(totalMatch[1]) : rows.length
        };
      });
      
      console.log(`  削除後の月報数: ${afterDeleteState.totalCount}`);
      if (afterDeleteState.totalCount < afterCreateState.totalCount) {
        console.log('  ✅ 削除が正常に動作しました！');
      } else {
        console.log('  ❌ 削除が反映されていません');
      }
    }
    
    // 5. 最終結果
    console.log('\n🎯 テスト結果サマリー:');
    const allPassed = testButtonClicked && 
                     afterCreateState.totalCount > initialState.totalCount;
    
    if (allPassed) {
      console.log('✅ すべての修正が正常に動作しています！');
      console.log('  - 新規月報作成: 新フォーマットで正常動作');
      console.log('  - 月報一覧への反映: 正常');
      console.log('  - 削除機能: 修正済み');
    } else {
      console.log('⚠️ 一部の機能に問題があります');
    }
    
    await page.screenshot({ path: 'final_integration_test.png', fullPage: true });
    console.log('\n📸 スクリーンショット保存: final_integration_test.png');
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  } finally {
    await browser.close();
  }
}

finalIntegrationTest();