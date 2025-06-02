const puppeteer = require('puppeteer');

async function testReportCreationAndDisplay() {
  console.log('📝 Testing Report Creation and Display...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Monitor console for API errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('api')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Step 1: Check Dashboard (should show existing reports)
    console.log('🏠 Step 1: Check Dashboard for existing reports...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for API calls
    
    const dashboardCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasRecentReports: !bodyText.includes('まだ月報がありません'),
        hasTable: !!document.querySelector('table'),
        reportsCount: document.querySelectorAll('table tbody tr').length,
        bodySnapshot: bodyText.substring(0, 400)
      };
    });
    
    console.log(`✅ Dashboard reports visible: ${dashboardCheck.hasRecentReports}`);
    console.log(`✅ Reports table present: ${dashboardCheck.hasTable}`);
    console.log(`✅ Reports count: ${dashboardCheck.reportsCount}`);
    
    // Step 2: Check Reports List Page
    console.log('\n📋 Step 2: Check Reports List page...');
    await page.goto('http://localhost:3456/reports');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for API calls
    
    const reportsPageCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasReports: !bodyText.includes('月報がありません'),
        hasTable: !!document.querySelector('table'),
        reportsCount: document.querySelectorAll('table tbody tr').length,
        hasLoadingSpinner: bodyText.includes('読み込み'),
        bodySnapshot: bodyText.substring(0, 400)
      };
    });
    
    console.log(`✅ Reports list loaded: ${reportsPageCheck.hasReports}`);
    console.log(`✅ Reports table present: ${reportsPageCheck.hasTable}`);
    console.log(`✅ Reports count: ${reportsPageCheck.reportsCount}`);
    console.log(`✅ No loading spinner: ${!reportsPageCheck.hasLoadingSpinner}`);
    
    // Step 3: Test Conversation Page
    console.log('\n💬 Step 3: Test Conversation page functionality...');
    await page.goto('http://localhost:3456/reports/conversation');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const conversationCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasStartButton: bodyText.includes('対話を開始') || bodyText.includes('テストデータで即座に月報生成'),
        hasApiKeySection: bodyText.includes('APIキー'),
        hasErrors: bodyText.includes('エラー') || bodyText.includes('Error'),
        bodySnapshot: bodyText.substring(0, 500)
      };
    });
    
    console.log(`✅ Conversation page loaded: ${conversationCheck.hasStartButton}`);
    console.log(`✅ No error messages: ${!conversationCheck.hasErrors}`);
    
    // Step 4: Test creating a new report (if test data button available)
    if (conversationCheck.hasStartButton) {
      console.log('\n🧪 Step 4: Test report creation...');
      
      // Look for test data button
      const testButtons = await page.$$('button');
      let testButtonClicked = false;
      
      for (const button of testButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('テストデータで即座に月報生成') || text.includes('テストデータ')) {
          await button.click();
          testButtonClicked = true;
          console.log('✅ Test data button clicked');
          break;
        }
      }
      
      if (testButtonClicked) {
        // Wait for report creation
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Check if report was created successfully
        const creationResult = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          return {
            hasSuccessMessage: bodyText.includes('作成されました') || bodyText.includes('完了'),
            hasError: bodyText.includes('エラー') || bodyText.includes('Error'),
            bodySnapshot: bodyText.substring(0, 300)
          };
        });
        
        console.log(`✅ Report creation attempted: ${testButtonClicked}`);
        console.log(`✅ Success message: ${creationResult.hasSuccessMessage}`);
        console.log(`✅ No errors: ${!creationResult.hasError}`);
      }
    }
    
    // Step 5: Re-check Dashboard for new report
    console.log('\n🔄 Step 5: Re-check Dashboard for new reports...');
    await page.goto('http://localhost:3456');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalDashboardCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent;
      return {
        hasRecentReports: !bodyText.includes('まだ月報がありません'),
        hasTable: !!document.querySelector('table'),
        reportsCount: document.querySelectorAll('table tbody tr').length,
        bodySnapshot: bodyText.substring(0, 400)
      };
    });
    
    console.log(`✅ Final dashboard check - reports visible: ${finalDashboardCheck.hasRecentReports}`);
    console.log(`✅ Final reports count: ${finalDashboardCheck.reportsCount}`);
    
    // Take screenshots
    await page.screenshot({ path: 'report_test_dashboard.png', fullPage: true });
    
    await page.goto('http://localhost:3456/reports');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'report_test_list.png', fullPage: true });
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - report_test_dashboard.png');
    console.log('   - report_test_list.png');
    
    // Check for API errors
    console.log(`\n🔍 API errors during test: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('API errors found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🎯 Test Results Summary:');
    console.log(`✅ Dashboard shows reports: ${dashboardCheck.hasRecentReports || finalDashboardCheck.hasRecentReports}`);
    console.log(`✅ Reports list functional: ${reportsPageCheck.hasReports}`);
    console.log(`✅ Conversation page functional: ${conversationCheck.hasStartButton}`);
    console.log(`✅ No API errors: ${consoleErrors.length === 0}`);
    
    const overallSuccess = (dashboardCheck.hasRecentReports || finalDashboardCheck.hasRecentReports) && 
                          reportsPageCheck.hasReports && 
                          conversationCheck.hasStartButton && 
                          consoleErrors.length === 0;
    
    console.log(`\n🎉 Overall Test Result: ${overallSuccess ? '✅ SUCCESS - Reports working properly!' : '⚠️ ISSUES REMAIN'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    try {
      await page.screenshot({ path: 'report_test_error.png', fullPage: true });
      console.log('📸 Error screenshot saved: report_test_error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testReportCreationAndDisplay();