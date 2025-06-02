const puppeteer = require('puppeteer');

async function testApiKeyFunctionality() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: ['--no-sandbox'],
    slowMo: 300
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:3456', { waitUntil: 'networkidle2' });
    
    // Login first
    console.log('🔐 Logging in...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'demo@test.com');
    await page.type('input[type="password"]', 'demo123');
    
    const loginButton = await page.$('button[type="submit"]') || await page.$('button');
    if (loginButton) {
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Logged in successfully');
    }
    
    // Navigate directly to Settings
    console.log('⚙️ Navigating to Settings page...');
    await page.goto('http://localhost:3456/settings', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'settings_page.png' });
    console.log('📸 Settings page screenshot saved');
    
    // Test API Key functionality
    console.log('🔑 Testing API key functionality...');
    
    // Find API key input - try multiple selectors
    let apiKeyInput = null;
    const inputSelectors = [
      'input[id="api-key"]',
      'input[placeholder*="sk-"]', 
      'input[type="password"]',
      'textarea[placeholder*="sk-"]'
    ];
    
    for (const selector of inputSelectors) {
      try {
        apiKeyInput = await page.$(selector);
        if (apiKeyInput) {
          console.log(`✅ Found API key input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (apiKeyInput) {
      // Clear and enter test API key
      await apiKeyInput.click({ clickCount: 3 }); // Select all
      await apiKeyInput.press('Backspace'); // Clear
      await apiKeyInput.type('sk-test-1234567890abcdef1234567890abcdef');
      console.log('✅ Entered test API key');
      
      // Find Save button
      let saveButton = null;
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('保存') || text.includes('Save')) {
          saveButton = button;
          break;
        }
      }
      
      if (saveButton) {
        await saveButton.click();
        console.log('✅ Clicked Save button');
        await page.waitForTimeout(2000); // Wait for toast/feedback
        
        // Check localStorage
        const apiKeyInStorage = await page.evaluate(() => {
          return localStorage.getItem('openai_api_key');
        });
        
        console.log('📦 API key storage test:');
        console.log('   Stored in localStorage:', apiKeyInStorage ? '✅ YES' : '❌ NO');
        if (apiKeyInStorage) {
          console.log('   Value:', apiKeyInStorage);
        }
        
        // Test API key validation button if exists
        let testButton = null;
        const allButtons = await page.$$('button');
        for (const button of allButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('テスト') || text.includes('Test') || text.includes('APIキーをテスト')) {
            testButton = button;
            break;
          }
        }
        
        if (testButton) {
          console.log('🧪 Testing API key validation...');
          await testButton.click();
          await page.waitForTimeout(5000); // Wait for API call
          console.log('✅ API key validation test completed');
        } else {
          console.log('⚠️ No API key test button found');
        }
      } else {
        console.log('❌ Save button not found');
      }
      
    } else {
      console.log('❌ API key input field not found');
      
      // Debug: capture all inputs on the page
      const allInputs = await page.$$eval('input, textarea', elements => 
        elements.map(el => ({
          tag: el.tagName,
          type: el.type,
          id: el.id,
          placeholder: el.placeholder,
          className: el.className
        }))
      );
      console.log('🔍 All inputs on page:', allInputs);
    }
    
    // Take screenshot after API key operations
    await page.screenshot({ path: 'settings_after_test.png' });
    console.log('📸 Final settings screenshot saved');
    
    // Test conversational report generation with API key
    console.log('🎤 Testing conversational report with API key...');
    await page.goto('http://localhost:3456/reports/conversation', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'conversational_report.png' });
    console.log('📸 Conversational report screenshot saved');
    
    // Check if API key is included in requests
    console.log('🔍 Monitoring network requests for API key header...');
    
    // Set up request interception to check headers
    await page.setRequestInterception(true);
    let apiKeyHeaderFound = false;
    
    page.on('request', (request) => {
      const headers = request.headers();
      if (headers['x-openai-api-key']) {
        console.log('✅ Found X-OpenAI-API-Key header in request to:', request.url());
        console.log('   Header value:', headers['x-openai-api-key']);
        apiKeyHeaderFound = true;
      }
      request.continue();
    });
    
    // Try to trigger a request that should include the API key
    const startButton = await page.$('button');
    if (startButton) {
      const buttonText = await page.evaluate(el => el.textContent, startButton);
      if (buttonText.includes('開始') || buttonText.includes('テスト') || buttonText.includes('生成')) {
        console.log('🎯 Clicking start/test button to trigger API request...');
        await startButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    await page.setRequestInterception(false);
    console.log('🔍 API key header monitoring result:', apiKeyHeaderFound ? '✅ FOUND' : '⚠️ NOT DETECTED');
    
    console.log('✅ API key system test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testApiKeyFunctionality().catch(console.error);