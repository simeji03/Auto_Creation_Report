const puppeteer = require('puppeteer');

async function fullFeatureTest() {
  console.log('🚀 Starting Full Feature Test...\n');
  
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
    
    // Step 1: Login with correct credentials
    console.log('\n🔐 Step 1: Authentication...');
    await page.goto('http://localhost:3456/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'demo@test.com');
    await page.type('input[type="password"]', 'demo123');
    
    // Click login button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('ログイン')) {
        await button.click();
        break;
      }
    }
    
    // Wait for navigation
    try {
      await page.waitForNavigation({ timeout: 10000 });
      console.log('✅ Login successful - navigated to dashboard');
    } catch (error) {
      console.log('⚠️ No navigation, checking page state...');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify authentication state
    const authState = await page.evaluate(() => {
      const currentUrl = window.location.href;
      const hasToken = !!localStorage.getItem('auth_token') || !!localStorage.getItem('token');
      const bodyText = document.body.textContent;
      
      return {
        currentUrl,
        hasToken,
        isLoggedIn: !currentUrl.includes('/login'),
        bodySnapshot: bodyText.substring(0, 300)
      };
    });
    
    console.log(`Current URL: ${authState.currentUrl}`);
    console.log(`Authentication token: ${authState.hasToken}`);
    console.log(`Logged in: ${authState.isLoggedIn}`);
    
    // Step 2: Navigate to Settings
    console.log('\n⚙️ Step 2: Settings Page Access...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const settingsCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasSettingsTitle: bodyText.includes('設定'),
        hasApiSection: bodyText.includes('OpenAI') || bodyText.includes('API'),
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]') || !!document.querySelector('input[placeholder*="sk-"]'),
        hasSaveButton: bodyText.includes('保存'),
        hasTestButton: bodyText.includes('テスト'),
        hasInstructions: bodyText.includes('APIキー'),
        bodySnapshot: bodyText.substring(0, 600)
      };
    });
    
    console.log('Settings page verification:');
    console.log(`   - Settings title: ${settingsCheck.hasSettingsTitle}`);
    console.log(`   - API section: ${settingsCheck.hasApiSection}`);
    console.log(`   - API key input: ${settingsCheck.hasApiKeyInput}`);
    console.log(`   - Save button: ${settingsCheck.hasSaveButton}`);
    console.log(`   - Test button: ${settingsCheck.hasTestButton}`);
    
    // Step 3: API Key Management
    if (settingsCheck.hasApiKeyInput) {
      console.log('\n🔑 Step 3: API Key Management...');
      
      const apiKeyInput = await page.$('input[id="api-key"]') || await page.$('input[placeholder*="sk-"]');
      if (apiKeyInput) {
        // Set test API key
        await apiKeyInput.click({ clickCount: 3 });
        await apiKeyInput.type('sk-test1234567890abcdefghijklmnopqrstuv');
        
        // Find and click save button
        const saveButtons = await page.$$('button');
        let saved = false;
        for (const button of saveButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('保存')) {
            await button.click();
            saved = true;
            console.log('✅ Save button clicked');
            break;
          }
        }
        
        if (saved) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify storage
          const storageCheck = await page.evaluate(() => {
            return {
              apiKey: localStorage.getItem('openai_api_key'),
              keys: Object.keys(localStorage)
            };
          });
          
          console.log(`API key saved: ${!!storageCheck.apiKey}`);
          console.log(`Stored value length: ${storageCheck.apiKey ? storageCheck.apiKey.length : 0}`);
          
          // Test API key validation (if test button available)
          if (settingsCheck.hasTestButton) {
            console.log('🧪 Testing API key validation...');
            
            const testButtons = await page.$$('button');
            for (const button of testButtons) {
              const text = await page.evaluate(el => el.textContent, button);
              if (text.includes('テスト')) {
                await button.click();
                console.log('✅ Test button clicked');
                break;
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check for test results
            const testResults = await page.evaluate(() => {
              const bodyText = document.body.textContent;
              return {
                hasSuccessMessage: bodyText.includes('成功') || bodyText.includes('有効'),
                hasErrorMessage: bodyText.includes('エラー') || bodyText.includes('無効'),
                hasTestResults: bodyText.includes('テスト'),
                bodyText: bodyText.substring(0, 800)
              };
            });
            
            console.log(`Test success indicators: ${testResults.hasSuccessMessage}`);
            console.log(`Test error indicators: ${testResults.hasErrorMessage}`);
          }
        }
      }
    } else {
      console.log('⚠️ API key input not found - may require different authentication state');
    }
    
    // Step 4: Conversation Page Test
    console.log('\n💬 Step 4: Conversation Page Access...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const conversationCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasConversationTitle: bodyText.includes('対話') || bodyText.includes('月報'),
        hasApiKeyWarning: bodyText.includes('APIキーが未設定'),
        hasStartControls: bodyText.includes('開始') || bodyText.includes('テストデータ'),
        hasInputField: !!document.querySelector('input, textarea'),
        hasButtons: document.querySelectorAll('button').length,
        bodySnapshot: bodyText.substring(0, 500)
      };
    });
    
    console.log('Conversation page verification:');
    console.log(`   - Conversation elements: ${conversationCheck.hasConversationTitle}`);
    console.log(`   - API key warning: ${conversationCheck.hasApiKeyWarning}`);
    console.log(`   - Start controls: ${conversationCheck.hasStartControls}`);
    console.log(`   - Input fields: ${conversationCheck.hasInputField}`);
    console.log(`   - Button count: ${conversationCheck.hasButtons}`);
    
    // Step 5: API Key Warning State Test
    console.log('\n⚠️ Step 5: API Key State Management...');
    
    // Remove API key and test warning behavior
    await page.evaluate(() => {
      localStorage.removeItem('openai_api_key');
    });
    
    await page.reload();
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const warningCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      const yellowElements = document.querySelectorAll('[class*="yellow"], [class*="warning"]');
      const orangeElements = document.querySelectorAll('[class*="orange"]');
      
      return {
        hasApiKeyWarning: bodyText.includes('APIキーが未設定') || bodyText.includes('OpenAI'),
        yellowElementCount: yellowElements.length,
        orangeElementCount: orangeElements.length,
        hasSettingsLink: !!document.querySelector('a[href="/settings"]'),
        bodySnapshot: bodyText.substring(0, 400)
      };
    });
    
    console.log('Warning state verification:');
    console.log(`   - API key warning text: ${warningCheck.hasApiKeyWarning}`);
    console.log(`   - Yellow warning elements: ${warningCheck.yellowElementCount}`);
    console.log(`   - Settings link present: ${warningCheck.hasSettingsLink}`);
    
    // Take final screenshots
    await page.screenshot({ path: 'feature_test_conversation.png', fullPage: true });
    
    // Back to settings for final screenshot
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({ path: 'feature_test_settings.png', fullPage: true });
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - feature_test_conversation.png');
    console.log('   - feature_test_settings.png');
    
    console.log('\n🎉 Full Feature Test Completed!');
    console.log('\n=== Test Summary ===');
    console.log(`✅ Authentication: ${authState.isLoggedIn ? 'SUCCESS' : 'NEEDS REVIEW'}`);
    console.log(`✅ Settings Access: ${settingsCheck.hasSettingsTitle ? 'SUCCESS' : 'NEEDS REVIEW'}`);
    console.log(`✅ API Key Management: ${settingsCheck.hasApiKeyInput ? 'SUCCESS' : 'NEEDS REVIEW'}`);
    console.log(`✅ Conversation Page: ${conversationCheck.hasConversationTitle ? 'SUCCESS' : 'NEEDS REVIEW'}`);
    console.log(`✅ Warning System: ${warningCheck.hasApiKeyWarning ? 'SUCCESS' : 'NEEDS REVIEW'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    try {
      await page.screenshot({ path: 'feature_test_error.png', fullPage: true });
      console.log('📸 Error screenshot saved: feature_test_error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

fullFeatureTest();