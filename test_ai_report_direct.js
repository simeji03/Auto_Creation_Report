const puppeteer = require('puppeteer');

async function testAIReportDirect() {
  console.log('🎨 AI生成月報ページの直接表示テスト\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // ローカルストレージにモックデータを設定
    await page.evaluateOnNewDocument(() => {
      // 認証情報のモック
      localStorage.setItem('access_token', 'mock_token');
      localStorage.setItem('user', JSON.stringify({
        id: 3,
        name: 'テストユーザー',
        email: 'test@example.com'
      }));
    });
    
    // AI生成月報ページに直接アクセス（モックデータ付き）
    console.log('1️⃣ AI生成月報ページへ直接移動...');
    await page.goto('http://localhost:3456/ai-report');
    
    // stateデータを注入
    await page.evaluate(() => {
      const mockAIContent = `# 2025年5月 月次報告書

## 📊 定量データサマリー

### 作業時間内訳
| カテゴリ | 時間 | 割合 |
|---------|------|------|
| 開発作業 | 80時間 | 70% |
| バグ修正 | 20時間 | 17% |
| ミーティング | 15時間 | 13% |
| **合計** | **115時間** | **100%** |

## 🎯 今月の成果

### 良かった点
- **チームコミュニケーション**: 開発チームとの連携が非常にスムーズで、仕様の認識齟齬なく開発を進められた
- **開発効率**: 新機能の実装において、予定より20%早く完成させることができた
- **品質管理**: コードレビューの徹底により、本番環境でのバグ発生率が前月比30%減少

### 課題・改善点
- **テスト自動化**: 単体テストのカバレッジが60%に留まっており、目標の80%に届いていない
- **ドキュメント整備**: 新機能の技術仕様書の作成が遅れており、チーム内での知識共有に課題

## 📈 来月の目標

1. **CI/CDパイプラインの改善**
   - ビルド時間を現在の15分から10分以下に短縮
   - 自動テストのカバレッジを80%まで向上

2. **ドキュメント整備**
   - 全ての新機能に対する技術仕様書を作成
   - READMEの更新とAPI仕様書の整備

3. **パフォーマンス最適化**
   - 主要APIのレスポンスタイムを20%改善
   - データベースクエリの最適化

---
*この月報は音声入力を基にAIが自動生成しました*`;

      // React Routerのstateをモック
      window.history.replaceState({
        usr: {
          aiContent: mockAIContent,
          reportId: 1
        }
      }, '', '/ai-report');
      
      // ページをリロードして新しいstateを反映
      window.location.reload();
    });
    
    // ページの読み込みを待つ
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // スクリーンショットを撮影
    console.log('2️⃣ スクリーンショットを撮影...');
    await page.screenshot({ 
      path: 'ai_report_layout_test.png',
      fullPage: true 
    });
    console.log('📸 スクリーンショット保存: ai_report_layout_test.png');
    
    // レイアウトの確認
    const layoutCheck = await page.evaluate(() => {
      const header = document.querySelector('.bg-white.rounded-lg.shadow-sm');
      const modeButtons = document.querySelectorAll('button');
      const conventionalButton = Array.from(modeButtons).find(btn => btn.textContent === '従来表示');
      
      return {
        hasHeader: !!header,
        hasRichButton: Array.from(modeButtons).some(btn => btn.textContent === 'リッチ表示'),
        hasRawButton: Array.from(modeButtons).some(btn => btn.textContent === '生データ'),
        hasNotionButton: Array.from(modeButtons).some(btn => btn.textContent?.includes('Notion')),
        hasConventionalButton: !!conventionalButton
      };
    });
    
    console.log('\n3️⃣ レイアウト確認結果:');
    console.log(`   ヘッダー: ${layoutCheck.hasHeader ? '✅' : '❌'}`);
    console.log(`   リッチ表示ボタン: ${layoutCheck.hasRichButton ? '✅' : '❌'}`);
    console.log(`   生データボタン: ${layoutCheck.hasRawButton ? '✅' : '❌'}`);
    console.log(`   Notionコピーボタン: ${layoutCheck.hasNotionButton ? '✅' : '❌'}`);
    console.log(`   従来表示ボタン: ${layoutCheck.hasConventionalButton ? '❌ 存在する（削除が必要）' : '✅ 削除済み'}`);
    
    if (!layoutCheck.hasConventionalButton) {
      console.log('\n✨ レイアウトが正しく修正されています！');
    }
    
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
  } finally {
    console.log('\n⏸️  ブラウザを開いたまま確認...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
}

testAIReportDirect();