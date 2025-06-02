const puppeteer = require('puppeteer');

async function testApiKeySystem() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: ['--no-sandbox'],
    slowMo: 500  // Add delay for better visibility
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:3456', { waitUntil: 'networkidle2' });
    
    // Login first
    console.log('🔐 Logging in...');
    await page.waitForSelector('input[type="email"], input[placeholder*="メール"]');
    await page.type('input[type="email"], input[placeholder*="メール"]', 'demo@test.com');
    await page.type('input[type="password"], input[placeholder*="パスワード"]', 'demo123');
    // Find login button
    let loginButton = await page.$('button[type="submit"]');
    if (!loginButton) {
      loginButton = await page.$('button');
    }
    if (loginButton) {
      await loginButton.click();
    }
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Logged in successfully');
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'dashboard.png' });
    console.log('📸 Dashboard screenshot saved');
    
    // Navigate to Settings page
    console.log('⚙️ Navigating to Settings page...');
    
    // Try different selectors for the settings link
    let settingsSelector = null;
    const possibleSelectors = [
      'a[href="/settings"]',
      'a[href*="settings"]',
      '[href="/settings"]'
    ];
    
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        settingsSelector = selector;
        break;
      } catch (e) {
        console.log(`Selector ${selector} not found`);
      }
    }
    
    if (settingsSelector) {
      await page.click(settingsSelector);
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Navigated to Settings page');
    } else {
      // Try direct navigation
      console.log('⚠️ Settings link not found, trying direct navigation...');
      await page.goto('http://localhost:3456/settings', { waitUntil: 'networkidle2' });
    }
    
    // Take screenshot of Settings page
    await page.screenshot({ path: 'settings_page.png' });
    console.log('📸 Settings page screenshot saved');
    
    // Test API Key functionality
    console.log('🔑 Testing API key functionality...');
    
    // Find and fill API key input
    const apiKeyInput = await page.$('input[type="password"], input[placeholder*="sk-"], input[id*="api"], textarea[placeholder*="sk-"]');
    
    if (apiKeyInput) {
      console.log('✅ Found API key input field');
      
      // Clear any existing value and enter test API key
      await apiKeyInput.click({ clickCount: 3 }); // Select all
      await apiKeyInput.type('sk-test-api-key-for-testing-functionality-12345');
      
      // Find and click Save button
      let saveButton = await page.$('button[type="submit"]');
      if (!saveButton) {
        // Try to find button by text content
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('保存') || text.includes('Save')) {
            saveButton = button;
            break;
          }
        }
      }
      if (saveButton) {
        await saveButton.click();
        console.log('✅ Clicked Save button');
        
        // Wait for toast notification or success message
        await page.waitForTimeout(2000);
      }
      
      // Check localStorage for the API key
      const apiKeyInStorage = await page.evaluate(() => {
        return localStorage.getItem('openai_api_key');
      });
      
      console.log('📦 API key in localStorage:', apiKeyInStorage ? 'Found' : 'Not found');
      if (apiKeyInStorage) {
        console.log('   Value:', apiKeyInStorage);
      }
      
      // Test API key validation if there's a test button
      let testButton = null;
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('テスト') || text.includes('Test')) {
          testButton = button;
          break;
        }
      }
      if (testButton) {
        console.log('🧪 Testing API key validation...');
        await testButton.click();
        await page.waitForTimeout(3000); // Wait for API call
        console.log('✅ API key test completed');
      }
      
    } else {
      console.log('❌ API key input field not found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'settings_after_api_key.png' });
    console.log('📸 Final screenshot saved');
    
    // Navigate to Conversational Report page to test API key usage
    console.log('🎤 Testing conversational report generation...');
    
    try {
      await page.goto('http://localhost:3456/conversational-report', { waitUntil: 'networkidle2' });
      await page.screenshot({ path: 'conversational_report.png' });
      console.log('📸 Conversational report page screenshot saved');
      
      // Check if the page loads properly with API key
      let hasStartButton = null;
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('開始') || text.includes('Start') || text.includes('対話')) {
          hasStartButton = button;
          break;
        }
      }
      console.log('🎯 Conversational report page:', hasStartButton ? 'Loaded successfully' : 'May have issues');
      
    } catch (e) {
      console.log('⚠️ Could not access conversational report page:', e.message);
    }
    
    console.log('✅ API key system test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testApiKeySystem().catch(console.error);