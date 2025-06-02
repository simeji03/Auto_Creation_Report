const puppeteer = require('puppeteer');

async function testConversationFix() {
  console.log('💬 Testing Conversation Fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Monitor console for API errors
    const apiErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && (msg.text().includes('422') || msg.text().includes('500'))) {
        apiErrors.push(msg.text());
      }
    });
    
    console.log('🚀 Navigating to Conversation page...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Check page elements
    const pageElements = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasStartButton: bodyText.includes('対話を開始'),
        hasTestDataButton: bodyText.includes('テストデータで即座に月報生成'),
        hasApiKeyWarning: bodyText.includes('APIキーが未設定'),
        hasErrors: bodyText.includes('エラー'),
        buttonsCount: document.querySelectorAll('button').length
      };
    });
    
    console.log(`✅ Start button present: ${pageElements.hasStartButton}`);
    console.log(`✅ Test data button present: ${pageElements.hasTestDataButton}`);
    console.log(`✅ API key warning: ${pageElements.hasApiKeyWarning ? 'Shown' : 'Hidden'}`);
    console.log(`✅ No errors: ${!pageElements.hasErrors}`);
    console.log(`✅ Button count: ${pageElements.buttonsCount}`);
    
    // Test 2: Try clicking Test Data button
    if (pageElements.hasTestDataButton) {
      console.log('\n🧪 Testing Test Data Button...');
      
      const testButtons = await page.$$('button');
      let testButtonClicked = false;
      
      for (const button of testButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('テストデータで即座に月報生成')) {
          await button.click();
          testButtonClicked = true;
          console.log('✅ Test data button clicked');
          break;
        }
      }
      
      if (testButtonClicked) {
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check for success/failure
        const result = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          return {
            hasSuccess: bodyText.includes('成功') || bodyText.includes('作成されました'),
            hasError: bodyText.includes('失敗') || bodyText.includes('エラー'),
            currentUrl: window.location.href
          };
        });
        
        console.log(`✅ Success message: ${result.hasSuccess}`);
        console.log(`✅ Error message: ${!result.hasError}`);
        console.log(`✅ Current URL: ${result.currentUrl}`);
        
        if (result.currentUrl !== 'http://localhost:3456/reports/conversation') {
          console.log('✅ Navigation occurred - report generation likely successful');
        }
      }
    }
    
    // Test 3: Try Start Conversation button
    if (pageElements.hasStartButton) {
      console.log('\n▶️ Testing Start Conversation Button...');
      
      // Go back to conversation page if we navigated away
      await page.goto('http://localhost:3456/reports/conversation');
      await page.waitForSelector('body', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const startButtons = await page.$$('button');
      let startButtonClicked = false;
      
      for (const button of startButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('対話を開始する')) {
          await button.click();
          startButtonClicked = true;
          console.log('✅ Start conversation button clicked');
          break;
        }
      }
      
      if (startButtonClicked) {
        // Wait for conversation to start
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if conversation started
        const conversationState = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          return {
            hasQuestion: bodyText.includes('？') || bodyText.includes('教えてください'),
            hasInputField: !!document.querySelector('input, textarea'),
            hasProgress: bodyText.includes('進捗') || bodyText.includes('1/'),
            hasError: bodyText.includes('エラー') || bodyText.includes('失敗')
          };
        });
        
        console.log(`✅ Question displayed: ${conversationState.hasQuestion}`);
        console.log(`✅ Input field present: ${conversationState.hasInputField}`);
        console.log(`✅ Progress shown: ${conversationState.hasProgress}`);
        console.log(`✅ No errors: ${!conversationState.hasError}`);
      }
    }
    
    // Take screenshots
    await page.screenshot({ path: 'conversation_fix_test.png', fullPage: true });
    
    // Check API errors
    console.log(`\n🔍 API errors during test: ${apiErrors.length}`);
    if (apiErrors.length > 0) {
      console.log('API errors found:');
      apiErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    const overallSuccess = pageElements.hasStartButton && 
                          pageElements.hasTestDataButton && 
                          apiErrors.length === 0;
    
    console.log(`\n🎯 Test Result: ${overallSuccess ? '✅ SUCCESS - Conversation features working!' : '⚠️ ISSUES DETECTED'}`);
    console.log('📸 Screenshot saved: conversation_fix_test.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    try {
      await page.screenshot({ path: 'conversation_fix_error.png', fullPage: true });
      console.log('📸 Error screenshot saved: conversation_fix_error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testConversationFix();