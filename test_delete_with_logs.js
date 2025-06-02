const puppeteer = require('puppeteer');

async function testDeleteWithLogs() {
  console.log('🔍 削除機能のテスト（ログ確認用）\n');
  console.log('⚠️  バックエンドのコンソールログを確認してください\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // ダイアログを自動承認
    page.on('dialog', async dialog => {
      console.log(`📋 ダイアログ: "${dialog.message()}"`);
      await dialog.accept();
    });
    
    // エラーを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ ブラウザエラー: ${msg.text()}`);
      }
    });
    
    // 月報一覧へ移動
    console.log('1️⃣ 月報一覧ページへ移動...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('table', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 削除する月報のIDを取得
    const reportInfo = await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr');
      if (!firstRow) return null;
      
      const link = firstRow.querySelector('a[href^="/reports/"]');
      const reportId = link ? link.href.match(/\/reports\/(\d+)/)?.[1] : null;
      const month = firstRow.querySelector('td')?.textContent;
      
      return { reportId, month };
    });
    
    if (!reportInfo || !reportInfo.reportId) {
      console.log('❌ 削除対象の月報が見つかりません');
      return;
    }
    
    console.log(`\n2️⃣ 月報ID ${reportInfo.reportId} (${reportInfo.month}) を削除します`);
    console.log('⚠️  バックエンドのコンソールで以下のログを確認してください:');
    console.log('   - 削除リクエスト受信');
    console.log('   - 月報を発見');
    console.log('   - 関連データ');
    console.log('   - 削除成功またはエラー\n');
    
    // 削除ボタンをクリック
    const deleteClicked = await page.evaluate(() => {
      const deleteBtn = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent === '削除'
      );
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
      return false;
    });
    
    if (deleteClicked) {
      console.log('✅ 削除ボタンをクリックしました');
      console.log('⏳ 削除処理を待機中...\n');
      
      // 処理完了まで待つ
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 結果を確認
      const afterDelete = await page.evaluate(() => {
        const toastMessage = document.querySelector('.Toastify__toast')?.textContent;
        const rowCount = document.querySelectorAll('tbody tr').length;
        return { toastMessage, rowCount };
      });
      
      console.log('3️⃣ 削除結果:');
      if (afterDelete.toastMessage) {
        console.log(`   トーストメッセージ: ${afterDelete.toastMessage}`);
      }
      console.log(`   残りの月報数: ${afterDelete.rowCount}`);
    }
    
    console.log('\n💡 バックエンドのコンソールログを確認してエラーの詳細を確認してください');
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  } finally {
    // ブラウザは開いたままにする
    console.log('\n⏸️  ブラウザを開いたまま10秒待機...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testDeleteWithLogs();