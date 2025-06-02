const puppeteer = require('puppeteer');

async function manualVerification() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('\n=== MANUAL VERIFICATION OF API KEY SYSTEM ===\n');
    
    // Clear storage and login
    await page.goto('http://localhost:3456');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Login
    await page.goto('http://localhost:3456/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'demo@test.com');
    await page.type('input[type="password"]', 'demo123');
    
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
    } else {
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('ログイン')) {
          await button.click();
          break;
        }
      }
    }
    
    await page.waitForNavigation({ timeout: 10000 });
    console.log('✓ Logged in successfully');
    
    // Navigate to conversation page using the navigation menu
    console.log('\n1. Testing conversation page access via navigation...');
    const conversationLink = await page.$('a[href*="conversation"]');
    if (conversationLink) {
      await conversationLink.click();
      await page.waitForNavigation({ timeout: 5000 });
    } else {
      // Try clicking on the purple button in dashboard
      const actionButton = await page.$('button:first-of-type');
      if (actionButton) {
        await actionButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    await page.screenshot({ path: 'manual_conversation_page.png', fullPage: true });
    console.log('✓ Screenshot: manual_conversation_page.png');
    
    // Check API key warning
    const warningCheck = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        hasApiKeyWarning: text.includes('APIキーが未設定') || text.includes('OpenAI APIキー'),
        hasSettingsLink: !!document.querySelector('a[href="/settings"]'),
        pageUrl: window.location.href,
        bodySnippet: text.substring(0, 300)
      };
    });
    
    console.log('Warning check result:', warningCheck);
    
    // Navigate to settings
    console.log('\n2. Testing settings page...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ path: 'manual_settings_page.png', fullPage: true });
    console.log('✓ Screenshot: manual_settings_page.png');
    
    // Check settings page content
    const settingsCheck = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        hasApiKeyField: text.includes('APIキー') || !!document.querySelector('input[type="password"], input[type="text"]'),
        hasSaveButton: text.includes('保存'),
        hasTestButton: text.includes('テスト'),
        pageUrl: window.location.href,
        bodySnippet: text.substring(0, 300)
      };
    });
    
    console.log('Settings check result:', settingsCheck);
    
    // Try to interact with settings
    if (settingsCheck.hasApiKeyField) {
      console.log('\n3. Testing API key input...');
      
      // Find the API key input field
      const apiInputs = await page.$$('input[type="password"], input[type="text"]');
      let apiKeyInput = null;
      
      for (const input of apiInputs) {
        const id = await page.evaluate(el => el.id, input);
        const placeholder = await page.evaluate(el => el.placeholder, input);
        if (id === 'api-key' || placeholder.includes('sk-')) {
          apiKeyInput = input;
          break;
        }
      }
      
      if (apiKeyInput) {
        await apiKeyInput.click();
        await apiKeyInput.focus();
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await apiKeyInput.type('sk-manualtest1234567890abcdef');
        
        // Find save button
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('保存')) {
            await button.click();
            break;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check localStorage
        const savedKey = await page.evaluate(() => {
          return localStorage.getItem('openai_api_key');
        });
        
        console.log('✓ API key saved to localStorage:', !!savedKey);
        
        await page.screenshot({ path: 'manual_settings_after_save.png', fullPage: true });
        console.log('✓ Screenshot: manual_settings_after_save.png');
      }
    }
    
    // Return to conversation page and check changes
    console.log('\n4. Verifying conversation page after API key set...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const afterApiKeyCheck = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        hasApiKeyWarning: text.includes('APIキーが未設定'),
        hasStartButton: text.includes('対話を開始'),
        hasTestButton: text.includes('テストデータ'),
        pageUrl: window.location.href,
        bodySnippet: text.substring(0, 300)
      };
    });
    
    console.log('After API key check:', afterApiKeyCheck);
    await page.screenshot({ path: 'manual_conversation_after_apikey.png', fullPage: true });
    console.log('✓ Screenshot: manual_conversation_after_apikey.png');
    
    // Test API key removal
    console.log('\n5. Testing API key removal...');
    await page.evaluate(() => {
      localStorage.removeItem('openai_api_key');
    });
    
    await page.reload();
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const afterRemovalCheck = await page.evaluate(() => {
      const text = document.body.textContent;
      return {
        hasApiKeyWarning: text.includes('APIキーが未設定') || text.includes('OpenAI APIキー'),
        hasStartButton: text.includes('対話を開始'),
        hasTestButton: text.includes('テストデータ'),
        pageUrl: window.location.href,
        bodySnippet: text.substring(0, 300)
      };
    });
    
    console.log('After removal check:', afterRemovalCheck);
    await page.screenshot({ path: 'manual_conversation_after_removal.png', fullPage: true });
    console.log('✓ Screenshot: manual_conversation_after_removal.png');
    
    console.log('\n=== MANUAL VERIFICATION COMPLETE ===');
    console.log('✅ All manual tests completed');
    console.log('📸 Screenshots saved for verification');
    
    // Keep browser open for 30 seconds for manual inspection
    console.log('\n⏳ Browser will remain open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Manual verification failed:', error);
    await page.screenshot({ path: 'manual_verification_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

manualVerification();