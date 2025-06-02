const puppeteer = require('puppeteer');

async function debugDeleteFunction() {
  console.log('🔍 削除機能の詳細デバッグ開始\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    devtools: true
  });
  
  try {
    const page = await browser.newPage();
    
    // すべてのネットワークリクエストを詳細に監視
    page.on('request', request => {
      if (request.url().includes('/api/reports') && request.method() === 'DELETE') {
        console.log(`📤 DELETE Request:`, {
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    page.on('requestfailed', request => {
      if (request.url().includes('/api/reports')) {
        console.log(`❌ Request Failed:`, {
          url: request.url(),
          method: request.method(),
          failure: request.failure()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/reports') && response.request().method() === 'DELETE') {
        console.log(`📥 DELETE Response:`, {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers()
        });
      }
    });
    
    // エラーログを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error:`, msg.text());
      }
    });
    
    // ダイアログを承認
    let dialogShown = false;
    page.on('dialog', async dialog => {
      dialogShown = true;
      console.log(`📋 ダイアログ検出: "${dialog.message()}"`);
      await dialog.accept();
    });
    
    // 月報一覧へ移動
    console.log('1️⃣ 月報一覧ページへ移動...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('table', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 削除ボタンの詳細情報を取得
    console.log('\n2️⃣ 削除ボタンの状態を確認...');
    const buttonInfo = await page.evaluate(() => {
      const deleteButtons = Array.from(document.querySelectorAll('button')).filter(
        btn => btn.textContent === '削除'
      );
      
      if (deleteButtons.length === 0) return { found: false };
      
      const firstBtn = deleteButtons[0];
      const row = firstBtn.closest('tr');
      const reportId = row?.querySelector('a[href^="/reports/"]')?.href.match(/\/reports\/(\d+)/)?.[1];
      
      // React propsを取得する試み
      const reactKey = Object.keys(firstBtn).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
      const hasReactHandler = !!reactKey;
      
      return {
        found: true,
        count: deleteButtons.length,
        reportId: reportId,
        hasOnClick: !!firstBtn.onclick,
        hasReactHandler: hasReactHandler,
        className: firstBtn.className,
        outerHTML: firstBtn.outerHTML
      };
    });
    
    console.log('削除ボタン情報:', JSON.stringify(buttonInfo, null, 2));
    
    if (!buttonInfo.found) {
      console.log('❌ 削除ボタンが見つかりません');
      return;
    }
    
    // 削除前の月報数
    const beforeCount = await page.evaluate(() => {
      return document.querySelectorAll('tbody tr').length;
    });
    console.log(`\n3️⃣ 削除前の月報数: ${beforeCount}`);
    
    // Reactの削除ハンドラーを直接呼び出す試み
    console.log('\n4️⃣ 削除ボタンをクリック（複数の方法を試行）...');
    
    // 方法1: 通常のクリック
    const clicked1 = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === '削除');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log(`  方法1 (click): ${clicked1 ? '✅' : '❌'}`);
    
    // ダイアログが表示されるまで待つ
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!dialogShown) {
      // 方法2: dispatchEvent
      const clicked2 = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === '削除');
        if (btn) {
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          });
          btn.dispatchEvent(event);
          return true;
        }
        return false;
      });
      console.log(`  方法2 (dispatchEvent): ${clicked2 ? '✅' : '❌'}`);
    }
    
    // 削除処理の完了を待つ
    console.log('\n5️⃣ 削除処理の完了を待機中...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 削除後の月報数
    const afterCount = await page.evaluate(() => {
      return document.querySelectorAll('tbody tr').length;
    });
    console.log(`\n6️⃣ 削除後の月報数: ${afterCount}`);
    
    // 結果の評価
    console.log('\n📊 結果:');
    console.log(`  ダイアログ表示: ${dialogShown ? '✅' : '❌'}`);
    console.log(`  月報数の変化: ${beforeCount} → ${afterCount}`);
    console.log(`  削除成功: ${afterCount < beforeCount ? '✅' : '❌'}`);
    
    // handleDelete関数の存在確認
    console.log('\n7️⃣ React関数の確認...');
    const reactInfo = await page.evaluate(() => {
      // window.__REACT_DEVTOOLS_GLOBAL_HOOK__ の確認
      const hasReactDevTools = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // React Queryの状態を確認
      const queryClientExists = !!window.queryClient;
      
      return {
        hasReactDevTools,
        queryClientExists,
        reactVersion: window.React?.version || 'unknown'
      };
    });
    console.log('React情報:', reactInfo);
    
    await page.screenshot({ path: 'delete_debug_result.png', fullPage: true });
    console.log('\n📸 スクリーンショット保存: delete_debug_result.png');
    
    // ブラウザを開いたまま10秒待機
    console.log('\n⏸️  デバッグ情報確認のため10秒待機...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('\n❌ デバッグ失敗:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

debugDeleteFunction();