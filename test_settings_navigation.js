const puppeteer = require('puppeteer');

async function testSettingsNavigation() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: ['--no-sandbox'],
    slowMo: 500
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
    
    // Click the settings gear icon
    console.log('⚙️ Clicking settings gear icon...');
    await page.waitForSelector('a[href="/settings"]', { timeout: 10000 });
    await page.click('a[href="/settings"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/settings')) {
      console.log('✅ Successfully navigated to Settings page');
      
      // Take screenshot of actual settings page
      await page.screenshot({ path: 'real_settings_page.png' });
      console.log('📸 Real settings page screenshot saved');
      
      // Now test API key functionality
      console.log('🔑 Testing API key input...');
      
      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Debug: show page content
      const pageTitle = await page.title();
      console.log('📄 Page title:', pageTitle);
      
      // Find all inputs and textareas
      const inputs = await page.$$eval('input, textarea', elements => 
        elements.map(el => ({
          tag: el.tagName,
          type: el.type || 'none',
          id: el.id || 'none',
          placeholder: el.placeholder || 'none',
          name: el.name || 'none'
        }))
      );
      console.log('🔍 Found inputs:', inputs);
      
      // Try to find API key input field
      let apiKeyInput = null;
      
      // Try ID selector first
      try {
        apiKeyInput = await page.$('#api-key');
        if (apiKeyInput) console.log('✅ Found API key input by ID');
      } catch (e) {}
      
      // Try type=password if ID didn't work
      if (!apiKeyInput) {
        try {
          apiKeyInput = await page.$('input[type="password"]');
          if (apiKeyInput) console.log('✅ Found API key input by type=password');
        } catch (e) {}
      }
      
      if (apiKeyInput) {
        console.log('🎯 Testing API key functionality...');
        
        // Clear and enter test API key
        await apiKeyInput.click({ clickCount: 3 });
        await apiKeyInput.type('sk-test-api-key-functionality-test-123456789012345678901234567890');
        console.log('✅ Entered test API key');
        
        // Find save button
        const buttons = await page.$$('button');
        let saveButton = null;
        
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent || el.innerText, button);
          console.log('🔘 Button text:', text);
          if (text.includes('保存') || text.toLowerCase().includes('save')) {
            saveButton = button;
            break;
          }
        }
        
        if (saveButton) {
          console.log('💾 Clicking save button...');
          await saveButton.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check localStorage
          const apiKeyStored = await page.evaluate(() => {
            return localStorage.getItem('openai_api_key');
          });
          
          console.log('📦 API key in localStorage:', apiKeyStored ? '✅ STORED' : '❌ NOT STORED');
          if (apiKeyStored) {
            console.log('   Value:', apiKeyStored);
          }
          
          // Test the test button if it exists
          const testButtons = await page.$$('button');
          for (const button of testButtons) {
            const text = await page.evaluate(el => el.textContent || el.innerText, button);
            if (text.includes('テスト') || text.toLowerCase().includes('test')) {
              console.log('🧪 Testing API key validation...');
              await button.click();
              await new Promise(resolve => setTimeout(resolve, 5000));
              console.log('✅ API key test completed');
              break;
            }
          }
          
        } else {
          console.log('❌ Save button not found');
        }
        
      } else {
        console.log('❌ API key input not found');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'settings_final.png' });
      
    } else {
      console.log('❌ Failed to navigate to Settings page');
      console.log('📍 Still on:', currentUrl);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'navigation_error.png' });
  } finally {
    await browser.close();
  }
}

testSettingsNavigation().catch(console.error);