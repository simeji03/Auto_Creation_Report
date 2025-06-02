const puppeteer = require('puppeteer');

async function testReportCreationFlow() {
  console.log('🔍 月報生成フローのテスト開始\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // ネットワークリクエストを監視
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') && !url.includes('.js')) {
        console.log(`📡 API Response: ${response.status()} ${url}`);
      }
    });
    
    // コンソールエラーを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // 1. 月報一覧の初期状態を確認
    console.log('📋 月報一覧の初期状態を確認...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const initialReportCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const totalMatch = document.body.textContent.match(/全\s*(\d+)\s*件/);
      return {
        rowCount: rows.length,
        totalCount: totalMatch ? totalMatch[1] : null
      };
    });
    
    console.log(`  初期月報数: ${initialReportCount.totalCount || initialReportCount.rowCount}`);
    
    // 2. 対話ページへ移動してテストデータで月報生成
    console.log('\n⚡ テストデータで月報生成...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // テストデータボタンをクリック
    const testDataButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('テストデータで即座に月報生成'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (!testDataButton) {
      console.log('❌ テストデータボタンが見つかりません');
      return;
    }
    
    console.log('  ✅ テストデータボタンをクリック');
    
    // 月報生成の完了を待つ（最大15秒）
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 遷移先を確認
    const currentUrl = page.url();
    console.log(`  遷移先: ${currentUrl}`);
    
    // 3. 月報一覧に戻って確認
    console.log('\n📋 月報一覧を再確認...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalReportCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const totalMatch = document.body.textContent.match(/全\s*(\d+)\s*件/);
      return {
        rowCount: rows.length,
        totalCount: totalMatch ? totalMatch[1] : null
      };
    });
    
    console.log(`  最終月報数: ${finalReportCount.totalCount || finalReportCount.rowCount}`);
    
    // 4. 結果の評価
    const initialCount = parseInt(initialReportCount.totalCount || initialReportCount.rowCount);
    const finalCount = parseInt(finalReportCount.totalCount || finalReportCount.rowCount);
    
    console.log('\n📊 結果:');
    if (finalCount > initialCount) {
      console.log('  ✅ 月報が正常に追加されました');
    } else {
      console.log('  ❌ 月報が追加されていません');
    }
    
    // 5. 削除ボタンのテスト
    console.log('\n🗑️ 削除ボタンのテスト...');
    const deleteResult = await page.evaluate(() => {
      const deleteButtons = document.querySelectorAll('button');
      const deleteBtn = Array.from(deleteButtons).find(btn => btn.textContent === '削除');
      if (deleteBtn) {
        // クリックイベントリスナーがあるか確認
        const hasListener = !!deleteBtn.onclick || deleteBtn.hasAttribute('onclick');
        deleteBtn.click();
        return { found: true, hasListener: hasListener };
      }
      return { found: false };
    });
    
    if (deleteResult.found) {
      console.log('  ✅ 削除ボタンをクリック');
      
      // アラートダイアログの処理
      page.on('dialog', async dialog => {
        console.log(`  ダイアログ: ${dialog.message()}`);
        await dialog.accept();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const afterDeleteCount = await page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        return rows.length;
      });
      
      console.log(`  削除後の月報数: ${afterDeleteCount}`);
    } else {
      console.log('  ❌ 削除ボタンが見つかりません');
    }
    
    await page.screenshot({ path: 'report_creation_flow_test.png', fullPage: true });
    console.log('\n📸 スクリーンショット保存: report_creation_flow_test.png');
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  } finally {
    await browser.close();
  }
}

testReportCreationFlow();