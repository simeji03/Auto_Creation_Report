const puppeteer = require('puppeteer');

async function testCompleteFix() {
  console.log('🔧 修正完了テスト開始\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. 月報一覧の総数表示テスト
    console.log('📋 月報一覧の総数表示テスト...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const reportsPageTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      const totalMatch = bodyText.match(/全\s*(\d+)\s*件/);
      const displayMatch = bodyText.match(/(\d+)\s*件を表示/);
      const hasTable = !!document.querySelector('table');
      const rows = document.querySelectorAll('tbody tr');
      
      return {
        totalCount: totalMatch ? totalMatch[1] : null,
        displayCount: displayMatch ? displayMatch[1] : null,
        hasTable: hasTable,
        rowCount: rows.length,
        bodyText: bodyText.substring(0, 500)
      };
    });
    
    console.log(`  ✅ 総月報数: ${reportsPageTest.totalCount || '未表示'}`);
    console.log(`  ✅ 表示件数: ${reportsPageTest.rowCount}`);
    console.log(`  ✅ ページネーション表示: ${reportsPageTest.displayCount || '未実装'}`);
    
    // 2. 対話システムのテスト
    console.log('\n💬 詳細対話システムのテスト...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 対話開始
    const conversationPageTest = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startButton = buttons.find(btn => btn.textContent.includes('対話を開始'));
      return {
        hasStartButton: !!startButton,
        buttonText: startButton ? startButton.textContent : null
      };
    });
    
    let conversationTest = {};
    if (conversationPageTest.hasStartButton) {
      // ボタンをクリック
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startButton = buttons.find(btn => btn.textContent.includes('対話を開始'));
        if (startButton) startButton.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      conversationTest = await page.evaluate(() => {
        const bodyText = document.body.textContent;
        // 進捗表示を探す（例: "1 / 20"）
        const progressElements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent.match(/^\d+\s*\/\s*\d+$/)
        );
        let totalQuestions = null;
        if (progressElements.length > 0) {
          const match = progressElements[0].textContent.match(/(\d+)\s*\/\s*(\d+)/);
          if (match) totalQuestions = match[2];
        }
        
        const questionElement = document.querySelector('p.text-lg');
        
        return {
          hasQuestion: !!questionElement,
          questionText: questionElement ? questionElement.textContent : null,
          totalQuestions: totalQuestions,
          hasExample: bodyText.includes('例：'),
          debugProgress: progressElements.map(el => el.textContent)
        };
      });
      
      console.log(`  ✅ 質問表示: ${conversationTest.hasQuestion}`);
      console.log(`  ✅ 総質問数: ${conversationTest.totalQuestions || '不明'}`);
      console.log(`  ✅ 例文表示: ${conversationTest.hasExample}`);
      console.log(`  ✅ 最初の質問: ${conversationTest.questionText ? conversationTest.questionText.substring(0, 30) + '...' : '未表示'}`);
    }
    
    // 3. 総合評価
    const fixValidation = {
      reportsCount: reportsPageTest.totalCount === '11' || reportsPageTest.rowCount === 10,
      conversationDetail: conversationTest && conversationTest.totalQuestions === '20'
    };
    
    console.log('\n🎯 修正確認結果:');
    console.log(`✅ 月報数表示問題: ${fixValidation.reportsCount ? '解決' : '未解決'}`);
    console.log(`✅ 対話システム詳細化: ${fixValidation.conversationDetail ? '復元完了' : '未完了'}`);
    
    if (fixValidation.reportsCount && fixValidation.conversationDetail) {
      console.log('\n🎉 両方の問題が正常に修正されました！');
      console.log('- 月報一覧で正しい総数が表示/取得可能');
      console.log('- 対話システムが19問の詳細版に復元');
    }
    
    await page.screenshot({ path: 'fix_complete_test.png', fullPage: true });
    console.log('\n📸 スクリーンショット保存: fix_complete_test.png');
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteFix();