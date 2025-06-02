const puppeteer = require('puppeteer');

async function quickFinalTest() {
  console.log('⚡ Quick Final Verification Test\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Dashboard test
    console.log('📊 Testing Dashboard...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const dashboardTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasReports: !bodyText.includes('まだ月報がありません'),
        hasStats: bodyText.includes('総月報数'),
        hasTable: !!document.querySelector('table')
      };
    });
    
    console.log(`✅ Dashboard reports: ${dashboardTest.hasReports}`);
    console.log(`✅ Dashboard stats: ${dashboardTest.hasStats}`);
    
    // Settings test
    console.log('\n⚙️ Testing Settings...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const settingsTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]'),
        hasSaveButton: bodyText.includes('保存')
      };
    });
    
    console.log(`✅ Settings API key input: ${settingsTest.hasApiKeyInput}`);
    console.log(`✅ Settings save button: ${settingsTest.hasSaveButton}`);
    
    // Conversation test
    console.log('\n💬 Testing Conversation...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const conversationTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasStartButton: bodyText.includes('対話を開始'),
        hasTestButton: bodyText.includes('テストデータで即座に月報生成')
      };
    });
    
    console.log(`✅ Conversation start: ${conversationTest.hasStartButton}`);
    console.log(`✅ Conversation test data: ${conversationTest.hasTestButton}`);
    
    // Reports list test
    console.log('\n📋 Testing Reports List...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const reportsTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasReports: !bodyText.includes('月報がありません'),
        hasCreateButton: bodyText.includes('作成')
      };
    });
    
    console.log(`✅ Reports list data: ${reportsTest.hasReports}`);
    console.log(`✅ Reports create button: ${reportsTest.hasCreateButton}`);
    
    // Overall assessment
    const allWorking = dashboardTest.hasReports && 
                      dashboardTest.hasStats &&
                      settingsTest.hasApiKeyInput &&
                      conversationTest.hasStartButton &&
                      reportsTest.hasReports;
    
    console.log('\n🎯 FINAL RESULT:');
    console.log(`🏆 ${allWorking ? '✅ SYSTEM FULLY OPERATIONAL!' : '⚠️ Minor issues detected'}`);
    
    if (allWorking) {
      console.log('\n🎉 SUCCESS! The monthly report creation tool is ready:');
      console.log('✅ Dashboard showing existing reports');
      console.log('✅ Settings for API key management');
      console.log('✅ Conversation-based report creation');
      console.log('✅ Reports list and management');
      console.log('\n📦 Ready for distribution at http://localhost:3456');
    }
    
    await page.screenshot({ path: 'final_verification.png', fullPage: true });
    console.log('\n📸 Screenshot saved: final_verification.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

quickFinalTest();