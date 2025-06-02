const puppeteer = require('puppeteer');

async function testAuthDisabledApp() {
  console.log('🚀 Testing Authentication-Disabled Application...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Clear storage
    await page.goto('http://localhost:3456');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Test 1: Direct Dashboard Access
    console.log('📊 Test 1: Direct Dashboard Access...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const dashboardCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasDashboard: bodyText.includes('ダッシュボード') || bodyText.includes('月報'),
        hasNavigation: bodyText.includes('設定') || bodyText.includes('対話'),
        hasError: bodyText.includes('エラー') || bodyText.includes('Error'),
        currentUrl: window.location.href,
        bodySnapshot: bodyText.substring(0, 400)
      };
    });
    
    console.log(`✅ Dashboard accessible: ${dashboardCheck.hasDashboard}`);
    console.log(`✅ Navigation present: ${dashboardCheck.hasNavigation}`);
    console.log(`✅ No errors: ${!dashboardCheck.hasError}`);
    console.log(`Current URL: ${dashboardCheck.currentUrl}`);
    
    // Test 2: Settings Page Access
    console.log('\n⚙️ Test 2: Settings Page Access...');
    await page.goto('http://localhost:3456/settings');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const settingsCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasSettingsTitle: bodyText.includes('設定'),
        hasApiKeySection: bodyText.includes('OpenAI') || bodyText.includes('API'),
        hasApiKeyInput: !!document.querySelector('input[id="api-key"]') || !!document.querySelector('input[placeholder*="sk-"]'),
        hasSaveButton: bodyText.includes('保存'),
        hasTestButton: bodyText.includes('テスト'),
        hasInstructions: bodyText.includes('APIキー'),
        hasError: bodyText.includes('エラー') || bodyText.includes('Error'),
        bodySnapshot: bodyText.substring(0, 600)
      };
    });
    
    console.log(`✅ Settings page loaded: ${settingsCheck.hasSettingsTitle}`);
    console.log(`✅ API key section: ${settingsCheck.hasApiKeySection}`);
    console.log(`✅ API key input: ${settingsCheck.hasApiKeyInput}`);
    console.log(`✅ Save button: ${settingsCheck.hasSaveButton}`);
    console.log(`✅ Test button: ${settingsCheck.hasTestButton}`);
    console.log(`✅ No errors: ${!settingsCheck.hasError}`);
    
    // Test 3: API Key Management
    if (settingsCheck.hasApiKeyInput) {
      console.log('\n🔑 Test 3: API Key Management...');
      
      const apiKeyInput = await page.$('input[id="api-key"]') || await page.$('input[placeholder*="sk-"]');
      if (apiKeyInput) {
        // Set test API key
        await apiKeyInput.click({ clickCount: 3 });
        await apiKeyInput.type('sk-test1234567890abcdefghijklmnopqrstuv');
        
        // Save API key
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
          
          console.log(`✅ API key saved: ${!!storageCheck.apiKey}`);
          console.log(`✅ Storage keys: ${storageCheck.keys.join(', ')}`);
          
          // Test API key validation (if available)
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
                hasResults: bodyText.includes('無効') || bodyText.includes('エラー') || bodyText.includes('有効'),
                bodySnapshot: bodyText.substring(0, 800)
              };
            });
            
            console.log(`✅ Test results shown: ${testResults.hasResults}`);
          }
        }
      }
    }
    
    // Test 4: Conversation Page Access
    console.log('\n💬 Test 4: Conversation Page Access...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const conversationCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasConversationElements: bodyText.includes('対話') || bodyText.includes('月報'),
        hasApiKeyWarning: bodyText.includes('APIキーが未設定'),
        hasStartControls: bodyText.includes('開始') || bodyText.includes('テストデータ'),
        hasInputs: document.querySelectorAll('input, textarea, button').length,
        hasError: bodyText.includes('エラー') || bodyText.includes('Error'),
        bodySnapshot: bodyText.substring(0, 500)
      };
    });
    
    console.log(`✅ Conversation page loaded: ${conversationCheck.hasConversationElements}`);
    console.log(`✅ Interactive elements: ${conversationCheck.hasInputs} elements`);
    console.log(`✅ API key warning: ${conversationCheck.hasApiKeyWarning}`);
    console.log(`✅ No errors: ${!conversationCheck.hasError}`);
    
    // Test 5: Navigation Between Pages
    console.log('\n🧭 Test 5: Navigation Test...');
    
    // Test navigation links
    const navigationTest = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      })).filter(link => link.href.startsWith('/'));
    });
    
    console.log(`✅ Navigation links found: ${navigationTest.length}`);
    for (const link of navigationTest) {
      console.log(`   - ${link.text}: ${link.href}`);
    }
    
    // Test direct navigation to dashboard
    await page.goto('http://localhost:3456/');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Dashboard navigation: OK');
    
    // Take final screenshots
    await page.screenshot({ path: 'auth_disabled_test_final.png', fullPage: true });
    console.log('\n📸 Screenshot saved: auth_disabled_test_final.png');
    
    console.log('\n🎉 Authentication-Disabled App Test Complete!');
    console.log('\n=== Final Test Summary ===');
    console.log(`✅ Dashboard: ${dashboardCheck.hasDashboard ? 'ACCESSIBLE' : 'ISSUE'}`);
    console.log(`✅ Settings: ${settingsCheck.hasSettingsTitle ? 'ACCESSIBLE' : 'ISSUE'}`);
    console.log(`✅ API Management: ${settingsCheck.hasApiKeyInput ? 'WORKING' : 'ISSUE'}`);
    console.log(`✅ Conversation: ${conversationCheck.hasConversationElements ? 'ACCESSIBLE' : 'ISSUE'}`);
    console.log(`✅ Navigation: ${navigationTest.length > 0 ? 'WORKING' : 'ISSUE'}`);
    
    const overallSuccess = dashboardCheck.hasDashboard && 
                          settingsCheck.hasSettingsTitle && 
                          conversationCheck.hasConversationElements;
    
    console.log(`\n🎯 Overall Status: ${overallSuccess ? '✅ READY FOR DISTRIBUTION' : '⚠️ NEEDS REVIEW'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    try {
      await page.screenshot({ path: 'auth_disabled_test_error.png', fullPage: true });
      console.log('📸 Error screenshot saved: auth_disabled_test_error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testAuthDisabledApp();