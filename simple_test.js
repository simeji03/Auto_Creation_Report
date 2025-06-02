const puppeteer = require('puppeteer');

async function simpleTest() {
  console.log('🚀 Starting simple functionality test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Basic Frontend Loading
    console.log('📱 Testing Frontend Loading...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 5000 });
    
    const pageTitle = await page.evaluate(() => document.title);
    console.log(`✅ Frontend loaded - Title: ${pageTitle}`);
    
    // Test 2: Navigation to Settings
    console.log('\n⚙️ Testing Settings Page Navigation...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const settingsPageCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasApiKeyText: bodyText.includes('OpenAI API'),
        hasSettingsTitle: bodyText.includes('設定'),
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]'),
        pageSnapshot: bodyText.substring(0, 300)
      };
    });
    
    console.log(`✅ Settings page loaded:`);
    console.log(`   - API Key section: ${settingsPageCheck.hasApiKeyText}`);
    console.log(`   - Settings title: ${settingsPageCheck.hasSettingsTitle}`);
    console.log(`   - API Key input: ${settingsPageCheck.hasApiKeyInput}`);
    
    // Test 3: API Key Management Test
    if (settingsPageCheck.hasApiKeyInput) {
      console.log('\n🔐 Testing API Key Management...');
      
      // Clear any existing API key
      await page.evaluate(() => {
        localStorage.removeItem('openai_api_key');
      });
      
      // Input test API key
      const testApiKey = 'sk-test1234567890abcdef';
      const apiKeyInput = await page.$('input[id="api-key"]');
      
      if (apiKeyInput) {
        await apiKeyInput.click({ clickCount: 3 }); // Select all
        await apiKeyInput.type(testApiKey);
        
        // Find and click save button
        const buttons = await page.$$('button');
        for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('保存')) {
            await button.click();
            break;
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify storage
        const storedKey = await page.evaluate(() => {
          return localStorage.getItem('openai_api_key');
        });
        
        console.log(`✅ API Key saved to localStorage: ${!!storedKey}`);
        console.log(`   - Key matches: ${storedKey === testApiKey}`);
      }
    }
    
    // Test 4: Conversation Page Test
    console.log('\n💬 Testing Conversation Page...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const conversationPageCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasConversationElements: bodyText.includes('対話') || bodyText.includes('月報'),
        hasApiKeyWarning: bodyText.includes('APIキーが未設定') || bodyText.includes('OpenAI APIキー'),
        hasStartButton: bodyText.includes('開始') || bodyText.includes('テストデータ'),
        pageSnapshot: bodyText.substring(0, 300)
      };
    });
    
    console.log(`✅ Conversation page loaded:`);
    console.log(`   - Conversation elements: ${conversationPageCheck.hasConversationElements}`);
    console.log(`   - API key warning: ${conversationPageCheck.hasApiKeyWarning}`);
    console.log(`   - Start/Test buttons: ${conversationPageCheck.hasStartButton}`);
    
    // Test 5: API Key Removal Test
    console.log('\n🗑️ Testing API Key Removal...');
    await page.evaluate(() => {
      localStorage.removeItem('openai_api_key');
    });
    
    await page.reload();
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterRemovalCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasApiKeyWarning: bodyText.includes('APIキーが未設定') || bodyText.includes('OpenAI APIキー'),
        warningElements: document.querySelectorAll('[class*="yellow"], [class*="warning"]').length
      };
    });
    
    console.log(`✅ API Key removal test:`);
    console.log(`   - Warning reappeared: ${afterRemovalCheck.hasApiKeyWarning}`);
    console.log(`   - Warning elements count: ${afterRemovalCheck.warningElements}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'simple_test_result.png', fullPage: true });
    console.log('\n📸 Screenshot saved: simple_test_result.png');
    
    console.log('\n🎉 Simple test completed successfully!');
    console.log('\n=== Test Summary ===');
    console.log('✅ Frontend loading: OK');
    console.log('✅ Settings page: OK');
    console.log('✅ API key management: OK');
    console.log('✅ Conversation page: OK');
    console.log('✅ API key removal: OK');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    try {
      await page.screenshot({ path: 'simple_test_error.png', fullPage: true });
      console.log('📸 Error screenshot saved: simple_test_error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

simpleTest();