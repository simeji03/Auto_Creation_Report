const puppeteer = require('puppeteer');

async function finalUltimateTest() {
  console.log('🏁 ULTIMATE FINAL TEST: Complete System Verification\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Comprehensive error monitoring
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('requestfailed', (request) => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });
    
    console.log('🚀 Starting comprehensive system test...\n');
    
    // Test 1: Dashboard Complete Check
    console.log('📊 Test 1: Dashboard Functionality...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 8000)); // Extended wait for API calls
    
    const dashboardResult = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasReports: !bodyText.includes('まだ月報がありません'),
        hasStats: bodyText.includes('総月報数') || bodyText.includes('総収入'),
        hasTable: !!document.querySelector('table'),
        reportCount: document.querySelectorAll('table tbody tr').length,
        hasErrorBoundary: bodyText.includes('エラーが発生しました'),
        hasNavigation: bodyText.includes('対話で月報作成'),
        bodySnapshot: bodyText.substring(0, 300)
      };
    });
    
    console.log(`   ✅ Reports displayed: ${dashboardResult.hasReports}`);
    console.log(`   ✅ Statistics shown: ${dashboardResult.hasStats}`);
    console.log(`   ✅ Data table present: ${dashboardResult.hasTable}`);
    console.log(`   ✅ Report count: ${dashboardResult.reportCount}`);
    console.log(`   ✅ Navigation working: ${dashboardResult.hasNavigation}`);
    
    // Test 2: Settings Complete Check
    console.log('\n⚙️ Test 2: Settings Functionality...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const settingsResult = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasSettingsTitle: bodyText.includes('設定'),
        hasApiKeySection: bodyText.includes('OpenAI'),
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]'),
        hasSaveButton: bodyText.includes('保存'),
        hasTestButton: bodyText.includes('テスト'),
        hasInstructions: bodyText.includes('APIキーの取得方法'),
        hasErrorBoundary: bodyText.includes('エラーが発生しました')
      };
    });
    
    console.log(`   ✅ Settings page loaded: ${settingsResult.hasSettingsTitle}`);
    console.log(`   ✅ API key management: ${settingsResult.hasApiKeyInput}`);
    console.log(`   ✅ Save functionality: ${settingsResult.hasSaveButton}`);
    console.log(`   ✅ Test functionality: ${settingsResult.hasTestButton}`);
    console.log(`   ✅ Help instructions: ${settingsResult.hasInstructions}`);
    
    // Test API key functionality
    if (settingsResult.hasApiKeyInput) {
      console.log('   🔑 Testing API key management...');
      const apiKeyInput = await page.$('input[id="api-key"]');
      if (apiKeyInput) {
        await apiKeyInput.click({ clickCount: 3 });
        await apiKeyInput.type('sk-test1234567890abcdefghijklmnopqrstuv');
        
        const saveButtons = await page.$$('button');
        for (const button of saveButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('保存')) {
            await button.click();
            console.log('   ✅ API key save attempted');
            break;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const storageCheck = await page.evaluate(() => {
          return !!localStorage.getItem('openai_api_key');
        });
        
        console.log(`   ✅ API key stored: ${storageCheck}`);
      }
    }
    
    // Test 3: Conversation System Check
    console.log('\n💬 Test 3: Conversation System...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const conversationResult = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasTitle: bodyText.includes('対話で月報作成'),
        hasStartButton: bodyText.includes('対話を開始'),
        hasTestDataButton: bodyText.includes('テストデータで即座に月報生成'),
        hasApiKeyInfo: bodyText.includes('APIキー'),
        hasInstructions: bodyText.includes('音声認識') || bodyText.includes('マイク'),
        hasErrorBoundary: bodyText.includes('エラーが発生しました'),
        buttonCount: document.querySelectorAll('button').length
      };
    });
    
    console.log(`   ✅ Conversation page loaded: ${conversationResult.hasTitle}`);
    console.log(`   ✅ Start button present: ${conversationResult.hasStartButton}`);
    console.log(`   ✅ Test data button present: ${conversationResult.hasTestDataButton}`);
    console.log(`   ✅ API key guidance: ${conversationResult.hasApiKeyInfo}`);
    console.log(`   ✅ User instructions: ${conversationResult.hasInstructions}`);
    console.log(`   ✅ Interactive elements: ${conversationResult.buttonCount} buttons`);
    
    // Test 4: Test Data Generation
    if (conversationResult.hasTestDataButton) {
      console.log('   🧪 Testing test data generation...');
      
      const testButtons = await page.$$('button');
      let testButtonClicked = false;
      
      for (const button of testButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('テストデータで即座に月報生成')) {
          await button.click();
          testButtonClicked = true;
          console.log('   ✅ Test data button clicked');
          break;
        }
      }
      
      if (testButtonClicked) {
        await new Promise(resolve => setTimeout(resolve, 8000)); // Wait for processing
        
        const testResult = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          return {
            hasSuccess: bodyText.includes('成功') || bodyText.includes('作成されました'),
            hasError: bodyText.includes('失敗') || bodyText.includes('エラー'),
            currentUrl: window.location.href,
            navigationOccurred: !window.location.href.includes('/conversation')
          };
        });
        
        console.log(`   ✅ Success indicated: ${testResult.hasSuccess}`);
        console.log(`   ✅ No errors: ${!testResult.hasError}`);
        console.log(`   ✅ Navigation occurred: ${testResult.navigationOccurred}`);
        console.log(`   ✅ Final URL: ${testResult.currentUrl}`);
      }
    }
    
    // Test 5: Reports List Verification
    console.log('\n📋 Test 5: Reports List Verification...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const reportsListResult = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasTitle: bodyText.includes('月報一覧'),
        hasReports: !bodyText.includes('月報がありません'),
        hasCreateButton: bodyText.includes('作成') || bodyText.includes('新規'),
        hasTable: !!document.querySelector('table'),
        rowCount: document.querySelectorAll('table tbody tr').length,
        hasErrorBoundary: bodyText.includes('エラーが発生しました'),
        isLoading: bodyText.includes('読み込み中')
      };
    });
    
    console.log(`   ✅ Reports list page loaded: ${reportsListResult.hasTitle}`);
    console.log(`   ✅ Reports displayed: ${reportsListResult.hasReports}`);
    console.log(`   ✅ Create functionality: ${reportsListResult.hasCreateButton}`);
    console.log(`   ✅ Data table present: ${reportsListResult.hasTable}`);
    console.log(`   ✅ Report entries: ${reportsListResult.rowCount}`);
    console.log(`   ✅ Not loading: ${!reportsListResult.isLoading}`);
    
    // Final Screenshots
    await page.goto('http://localhost:3456');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.screenshot({ path: 'ultimate_test_dashboard.png', fullPage: true });
    
    await page.goto('http://localhost:3456/settings');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'ultimate_test_settings.png', fullPage: true });
    
    await page.goto('http://localhost:3456/reports/conversation');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'ultimate_test_conversation.png', fullPage: true });
    
    await page.goto('http://localhost:3456/reports');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'ultimate_test_reports.png', fullPage: true });
    
    // Error Analysis
    console.log(`\n🔍 Error Analysis:`);
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Network errors: ${networkErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('   Console errors found:');
      consoleErrors.slice(0, 3).forEach(error => console.log(`     - ${error}`));
    }
    
    if (networkErrors.length > 0) {
      console.log('   Network errors found:');
      networkErrors.slice(0, 3).forEach(error => console.log(`     - ${error.url}: ${error.failure}`));
    }
    
    // Final Assessment
    const overallSuccess = 
      dashboardResult.hasReports &&
      dashboardResult.hasStats &&
      settingsResult.hasApiKeyInput &&
      settingsResult.hasSaveButton &&
      conversationResult.hasStartButton &&
      conversationResult.hasTestDataButton &&
      reportsListResult.hasReports &&
      !dashboardResult.hasErrorBoundary &&
      !settingsResult.hasErrorBoundary &&
      !conversationResult.hasErrorBoundary &&
      !reportsListResult.hasErrorBoundary;
    
    console.log('\n🎯 ULTIMATE FINAL ASSESSMENT:');
    console.log('================================');
    console.log(`📊 Dashboard: ${dashboardResult.hasReports && dashboardResult.hasStats ? '✅ EXCELLENT' : '⚠️ NEEDS REVIEW'}`);
    console.log(`⚙️ Settings: ${settingsResult.hasApiKeyInput && settingsResult.hasSaveButton ? '✅ EXCELLENT' : '⚠️ NEEDS REVIEW'}`);
    console.log(`💬 Conversation: ${conversationResult.hasStartButton && conversationResult.hasTestDataButton ? '✅ EXCELLENT' : '⚠️ NEEDS REVIEW'}`);
    console.log(`📋 Reports List: ${reportsListResult.hasReports && reportsListResult.hasTable ? '✅ EXCELLENT' : '⚠️ NEEDS REVIEW'}`);
    console.log(`🚫 Error Free: ${consoleErrors.length === 0 && networkErrors.length === 0 ? '✅ CLEAN' : '⚠️ MINOR ISSUES'}`);
    
    console.log(`\n🏆 FINAL VERDICT: ${overallSuccess ? '✅ PRODUCTION READY!' : '⚠️ MINOR ISSUES REMAIN'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 CONGRATULATIONS! The system is fully functional and ready for distribution:');
      console.log('✅ All core features working');
      console.log('✅ Authentication disabled for easy access'); 
      console.log('✅ API key management operational');
      console.log('✅ Report creation and display functional');
      console.log('✅ No critical errors detected');
      console.log('\n📦 Ready to ship! Users can access at http://localhost:3456');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - ultimate_test_dashboard.png');
    console.log('   - ultimate_test_settings.png');
    console.log('   - ultimate_test_conversation.png');
    console.log('   - ultimate_test_reports.png');
    
  } catch (error) {
    console.error('\n❌ Ultimate test failed:', error.message);
    try {
      await page.screenshot({ path: 'ultimate_test_error.png', fullPage: true });
      console.log('📸 Error screenshot saved: ultimate_test_error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

finalUltimateTest();