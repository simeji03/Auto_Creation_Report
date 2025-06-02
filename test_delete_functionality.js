const puppeteer = require('puppeteer');

async function testDeleteFunctionality() {
  console.log('🗑️  削除機能の詳細テスト開始\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: true  // 開発者ツールを開く
  });
  
  try {
    const page = await browser.newPage();
    
    // ネットワークリクエストを監視
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/reports') && response.request().method() === 'DELETE') {
        console.log(`📡 DELETE Response: ${response.status()} ${url}`);
      }
    });
    
    // ダイアログ（確認画面）を自動的に承認
    page.on('dialog', async dialog => {
      console.log(`📋 ダイアログ表示: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // コンソールログを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // 月報一覧へ移動
    console.log('📋 月報一覧ページへ移動...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('table', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 削除ボタンの存在確認
    const deleteButtonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const deleteButtons = buttons.filter(btn => btn.textContent === '削除');
      
      if (deleteButtons.length > 0) {
        const firstDeleteBtn = deleteButtons[0];
        const row = firstDeleteBtn.closest('tr');
        const month = row ? row.querySelector('td')?.textContent : 'unknown';
        
        // イベントリスナーの確認
        const hasOnClick = !!firstDeleteBtn.onclick;
        
        return {
          found: true,
          count: deleteButtons.length,
          firstButtonMonth: month,
          hasOnClick: hasOnClick,
          buttonHTML: firstDeleteBtn.outerHTML,
          parentHTML: firstDeleteBtn.parentElement?.outerHTML
        };
      }
      return { found: false };
    });
    
    console.log(`削除ボタン情報:`, deleteButtonInfo);
    
    if (deleteButtonInfo.found) {
      console.log(`  ✅ 削除ボタン発見: ${deleteButtonInfo.count}個`);
      console.log(`  対象月報: ${deleteButtonInfo.firstButtonMonth}`);
      
      // 削除前の月報数を取得
      const beforeCount = await page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        return rows.length;
      });
      console.log(`  削除前の月報数: ${beforeCount}`);
      
      // 削除ボタンをクリック
      console.log('\n🔴 削除ボタンをクリック...');
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const deleteBtn = buttons.find(btn => btn.textContent === '削除');
        if (deleteBtn) {
          // Reactイベントをトリガーする別の方法
          const mouseEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          deleteBtn.dispatchEvent(mouseEvent);
          return true;
        }
        return false;
      });
      
      if (clicked) {
        console.log('  ✅ クリックイベント送信');
        
        // 削除処理の完了を待つ
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 削除後の月報数を確認
        const afterCount = await page.evaluate(() => {
          const rows = document.querySelectorAll('tbody tr');
          return rows.length;
        });
        console.log(`  削除後の月報数: ${afterCount}`);
        
        if (afterCount < beforeCount) {
          console.log('  ✅ 削除成功！');
        } else {
          console.log('  ❌ 削除が反映されていません');
          
          // トーストメッセージの確認
          const toastMessage = await page.evaluate(() => {
            const toasts = document.querySelectorAll('.Toastify__toast');
            return Array.from(toasts).map(t => t.textContent);
          });
          console.log('  トーストメッセージ:', toastMessage);
        }
      }
    } else {
      console.log('  ❌ 削除ボタンが見つかりません');
    }
    
    await page.screenshot({ path: 'delete_test_result.png', fullPage: true });
    console.log('\n📸 スクリーンショット保存: delete_test_result.png');
    
    // 開発者ツールを開いたまま少し待つ
    console.log('\n⏸️  開発者ツールで確認するため10秒待機...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  } finally {
    await browser.close();
  }
}

testDeleteFunctionality();