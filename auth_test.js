const puppeteer = require('puppeteer');

async function authAndSettingsTest() {
  console.log('🔐 Starting authentication and settings test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Clear storage
    console.log('🧹 Clearing browser storage...');
    await page.goto('http://localhost:3456');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Test 1: Login Process
    console.log('\n🚪 Testing Login Process...');
    await page.goto('http://localhost:3456/login');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if login page loads
    const loginPageCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasEmailField: !!document.querySelector('input[type="email"]'),
        hasPasswordField: !!document.querySelector('input[type="password"]'),
        hasLoginButton: bodyText.includes('ログイン'),
        bodySnapshot: bodyText.substring(0, 300)
      };
    });
    
    console.log('Login page elements:');
    console.log(`   - Email field: ${loginPageCheck.hasEmailField}`);
    console.log(`   - Password field: ${loginPageCheck.hasPasswordField}`);
    console.log(`   - Login button: ${loginPageCheck.hasLoginButton}`);
    
    if (loginPageCheck.hasEmailField && loginPageCheck.hasPasswordField) {
      // Perform login
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'test123');
      
      // Find and click login button
      const buttons = await page.$$('button');
      let loginClicked = false;
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('ログイン')) {
          await button.click();
          loginClicked = true;
          break;
        }
      }
      
      if (loginClicked) {
        console.log('✅ Login attempt made');
        
        // Wait for navigation or response
        try {
          await page.waitForNavigation({ timeout: 5000 });
          console.log('✅ Navigation after login successful');
        } catch (navError) {
          console.log('⚠️ No navigation detected, checking current page...');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check current page state
        const currentUrl = page.url();
        const authState = await page.evaluate(() => {
          return {
            currentUrl: window.location.href,
            hasAuthToken: !!localStorage.getItem('auth_token') || !!localStorage.getItem('token'),
            bodyText: document.body.textContent.substring(0, 300)
          };
        });
        
        console.log(`Current URL: ${currentUrl}`);
        console.log(`Auth token present: ${authState.hasAuthToken}`);
      } else {
        console.log('❌ Could not find login button');
      }
    }
    
    // Test 2: Dashboard Access
    console.log('\n🏠 Testing Dashboard Access...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        isDashboard: bodyText.includes('ダッシュボード') || bodyText.includes('月報'),
        hasNavigation: bodyText.includes('設定') || bodyText.includes('月報作成'),
        bodySnapshot: bodyText.substring(0, 400)
      };
    });
    
    console.log(`Dashboard loaded: ${dashboardCheck.isDashboard}`);
    console.log(`Navigation present: ${dashboardCheck.hasNavigation}`);
    
    // Test 3: Settings Page with Authentication
    console.log('\n⚙️ Testing Authenticated Settings Access...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const settingsAuthCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasSettingsTitle: bodyText.includes('設定'),
        hasApiKeySection: bodyText.includes('OpenAI') || bodyText.includes('APIキー'),
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]') || !!document.querySelector('input[placeholder*="sk-"]'),
        hasSaveButton: bodyText.includes('保存'),
        hasTestButton: bodyText.includes('テスト'),
        bodySnapshot: bodyText.substring(0, 500)
      };
    });
    
    console.log('Settings page (authenticated):');
    console.log(`   - Settings title: ${settingsAuthCheck.hasSettingsTitle}`);
    console.log(`   - API key section: ${settingsAuthCheck.hasApiKeySection}`);
    console.log(`   - API key input: ${settingsAuthCheck.hasApiKeyInput}`);
    console.log(`   - Save button: ${settingsAuthCheck.hasSaveButton}`);
    console.log(`   - Test button: ${settingsAuthCheck.hasTestButton}`);
    
    // Test 4: API Key Management (if available)
    if (settingsAuthCheck.hasApiKeyInput) {
      console.log('\n🔑 Testing API Key Management...');
      
      const apiKeyInput = await page.$('input[id="api-key"]') || await page.$('input[placeholder*="sk-"]');
      if (apiKeyInput) {
        // Clear and set API key
        await apiKeyInput.click({ clickCount: 3 });
        await apiKeyInput.type('sk-test1234567890abcdef');
        
        // Save API key
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('保存')) {
            await button.click();
            console.log('✅ API key save clicked');
            break;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify storage
        const storageCheck = await page.evaluate(() => {
          return {
            apiKey: localStorage.getItem('openai_api_key'),
            allKeys: Object.keys(localStorage)
          };
        });
        
        console.log(`API key stored: ${!!storageCheck.apiKey}`);
        console.log(`LocalStorage keys: ${storageCheck.allKeys.join(', ')}`);
      }
    }
    
    // Take screenshots
    await page.screenshot({ path: 'auth_test_result.png', fullPage: true });
    console.log('\n📸 Screenshot saved: auth_test_result.png');
    
    console.log('\n🎉 Authentication test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    try {
      await page.screenshot({ path: 'auth_test_error.png', fullPage: true });
      console.log('📸 Error screenshot saved: auth_test_error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

authAndSettingsTest();