const puppeteer = require('puppeteer');

async function testFinalFix() {
  console.log('🔧 Testing Final API Port Fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,  // Enable devtools to see console
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Monitor console for errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Monitor network requests
    const failedRequests = [];
    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });
    
    console.log('🏠 Testing Dashboard with API calls...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for API calls
    
    console.log('📝 Testing Reports List page...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for API calls
    
    console.log('💬 Testing Conversation page...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for API calls
    
    // Check for API connection errors
    const apiErrors = failedRequests.filter(req => 
      req.url.includes('localhost:8765') || req.failure.includes('CONNECTION_REFUSED')
    );
    
    const portMismatchErrors = consoleErrors.filter(error => 
      error.includes('8765') || error.includes('CONNECTION_REFUSED')
    );
    
    console.log('\n=== Error Analysis ===');
    console.log(`❌ Failed API requests to old port (8765): ${apiErrors.length}`);
    console.log(`❌ Console errors with port issues: ${portMismatchErrors.length}`);
    console.log(`✅ Total console errors: ${consoleErrors.length}`);
    console.log(`✅ Total failed requests: ${failedRequests.length}`);
    
    if (apiErrors.length > 0) {
      console.log('\n🔍 Remaining port mismatch issues:');
      apiErrors.forEach(error => console.log(`  - ${error.url}: ${error.failure}`));
    }
    
    if (portMismatchErrors.length > 0) {
      console.log('\n🔍 Console port errors:');
      portMismatchErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Test specific functionality
    console.log('\n🧪 Testing core functionality...');
    
    // Test settings page
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const functionalityTest = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasSettings: bodyText.includes('設定'),
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]'),
        hasErrorMessages: bodyText.includes('エラー') || bodyText.includes('Error'),
        currentPage: window.location.pathname
      };
    });
    
    console.log(`✅ Settings page working: ${functionalityTest.hasSettings}`);
    console.log(`✅ API key input present: ${functionalityTest.hasApiKeyInput}`);
    console.log(`✅ No error messages: ${!functionalityTest.hasErrorMessages}`);
    
    await page.screenshot({ path: 'final_fix_test.png', fullPage: true });
    
    const overallSuccess = apiErrors.length === 0 && portMismatchErrors.length === 0;
    
    console.log('\n🎯 Final Assessment:');
    if (overallSuccess) {
      console.log('✅ SUCCESS: Port issues resolved, app ready for distribution');
    } else {
      console.log('⚠️ ISSUES REMAIN: Additional fixes needed');
    }
    
    console.log('\n📸 Screenshot saved: final_fix_test.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFinalFix();