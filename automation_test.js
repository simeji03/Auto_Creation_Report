// ブラウザの自動化テストスクリプト
// 実行方法: node automation_test.js

const puppeteer = require('puppeteer');

async function runTests() {
    console.log('🚀 フロントエンド音声認識機能の包括的テストを開始します');
    
    let browser;
    let page;
    
    try {
        // ブラウザを起動
        browser = await puppeteer.launch({ 
            headless: false, // UIを表示してテスト
            args: [
                '--use-fake-ui-for-media-stream', // マイク権限を自動許可
                '--use-fake-device-for-media-stream',
                '--allow-running-insecure-content',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        page = await browser.newPage();
        
        // メディア権限を許可
        const context = browser.defaultBrowserContext();
        await context.overridePermissions('http://localhost:3456', ['microphone']);
        
        console.log('\n📋 1. 基本動作テスト: ログイン');
        
        // メインページにアクセス
        await page.goto('http://localhost:3456', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'test_main_page.png' });
        
        // ログインページに移動
        await page.goto('http://localhost:3456/login', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'test_login_page.png' });
        
        // ログイン情報を入力
        await page.type('input[type="email"]', 'demo@test.com');
        await page.type('input[type="password"]', 'demo123');
        
        // ログインボタンをクリック
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        console.log('✅ ログイン成功');
        
        console.log('\n📋 2. 対話型月報作成ページへ移動');
        
        // 対話型月報作成ページに移動
        await page.goto('http://localhost:3456/reports/conversation', { waitUntil: 'networkidle2' });
        await page.screenshot({ path: 'test_conversation_page.png' });
        
        console.log('✅ 対話型月報作成ページに到達');
        
        console.log('\n📋 3. 音声認識テストスクリプトを実行');
        
        // 音声認識テストスクリプトを注入
        await page.addScriptTag({ path: '/Users/harry/Dropbox/Tool_Development/Auto_Creation_Report/test_speech_recognition.js' });
        
        // テストスクリプトを実行
        const testResults = await page.evaluate(() => {
            return window.speechTests.runAllTests();
        });
        
        console.log('📊 音声認識テスト結果:', testResults);
        
        console.log('\n📋 4. 対話セッション開始テスト');
        
        // 対話を開始ボタンをクリック
        const startButton = await page.$x("//button[contains(text(), '対話を開始')]");
        if (startButton.length > 0) {
            await startButton[0].click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test_conversation_started.png' });
            console.log('✅ 対話セッション開始成功');
        } else {
            console.log('⚠️ 対話開始ボタンが見つかりませんでした');
        }
        
        console.log('\n📋 5. 音声入力ボタンのテスト');
        
        // 音声入力ボタンを探す
        const recordButton = await page.$x("//button[contains(text(), '音声入力')]");
        if (recordButton.length > 0) {
            console.log('✅ 音声入力ボタンが見つかりました');
            
            // ボタンの状態をチェック
            const buttonText = await page.evaluate(btn => btn.textContent, recordButton[0]);
            console.log(`現在のボタンテキスト: ${buttonText}`);
            
            // ボタンをクリック
            await recordButton[0].click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test_recording_started.png' });
            
            // 状態変化をチェック
            const newButtonText = await page.evaluate(btn => btn.textContent, recordButton[0]);
            console.log(`クリック後のボタンテキスト: ${newButtonText}`);
            
            if (newButtonText.includes('録音停止') || newButtonText.includes('停止')) {
                console.log('✅ 音声認識開始成功 - ボタン状態が変更されました');
                
                // 数秒待機してから停止
                await page.waitForTimeout(3000);
                await recordButton[0].click();
                await page.waitForTimeout(1000);
                await page.screenshot({ path: 'test_recording_stopped.png' });
                
                const finalButtonText = await page.evaluate(btn => btn.textContent, recordButton[0]);
                console.log(`停止後のボタンテキスト: ${finalButtonText}`);
                
                if (finalButtonText.includes('音声入力')) {
                    console.log('✅ 音声認識停止成功 - ボタン状態が元に戻りました');
                } else {
                    console.log('⚠️ ボタン状態が正常に戻らない可能性があります');
                }
            } else {
                console.log('⚠️ 音声認識が開始されていない可能性があります');
            }
        } else {
            console.log('❌ 音声入力ボタンが見つかりませんでした');
        }
        
        console.log('\n📋 6. ストレステスト');
        
        // 複数回の開始/停止テスト
        if (recordButton.length > 0) {
            console.log('音声認識の開始/停止を5回繰り返します...');
            for (let i = 0; i < 5; i++) {
                await recordButton[0].click(); // 開始
                await page.waitForTimeout(1000);
                await recordButton[0].click(); // 停止
                await page.waitForTimeout(500);
                console.log(`${i + 1}/5 完了`);
            }
            console.log('✅ ストレステスト完了');
        }
        
        console.log('\n📋 7. コンソールエラーの確認');
        
        // ページのコンソールメッセージを取得
        const logs = [];
        page.on('console', msg => {
            logs.push(`${msg.type()}: ${msg.text()}`);
        });
        
        await page.waitForTimeout(2000);
        
        const errors = logs.filter(log => log.startsWith('error'));
        const warnings = logs.filter(log => log.startsWith('warning'));
        
        console.log(`コンソールエラー: ${errors.length} 件`);
        console.log(`コンソール警告: ${warnings.length} 件`);
        
        if (errors.length > 0) {
            console.log('❌ エラー詳細:');
            errors.forEach(error => console.log(error));
        }
        
        console.log('\n🎉 テスト完了');
        
        return {
            success: true,
            results: testResults,
            errors: errors.length,
            warnings: warnings.length,
            screenshots: [
                'test_main_page.png',
                'test_login_page.png', 
                'test_conversation_page.png',
                'test_conversation_started.png',
                'test_recording_started.png',
                'test_recording_stopped.png'
            ]
        };
        
    } catch (error) {
        console.error('❌ テスト実行中にエラーが発生しました:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// テスト実行
runTests().then(results => {
    console.log('\n📊 最終テスト結果:');
    console.log(JSON.stringify(results, null, 2));
}).catch(error => {
    console.error('テスト実行失敗:', error);
});