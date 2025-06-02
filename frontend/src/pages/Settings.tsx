import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  useEffect(() => {
    // ローカルストレージからAPIキーを読み込み
    const savedKey = localStorage.getItem('openai_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      toast.success('APIキーを保存しました');
    } else {
      localStorage.removeItem('openai_api_key');
      toast.info('APIキーを削除しました');
    }
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('APIキーを入力してください');
      return;
    }

    setIsTestingKey(true);
    try {
      // OpenAI APIのテスト（モデル一覧を取得）
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        }
      });

      if (response.ok) {
        toast.success('APIキーが有効です！');
      } else {
        toast.error('APIキーが無効です');
      }
    } catch (error) {
      toast.error('APIキーの検証中にエラーが発生しました');
    } finally {
      setIsTestingKey(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* OpenAI API設定 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              OpenAI API設定
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800">
                AI月報生成機能を使用するには、OpenAI APIキーが必要です。
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline ml-1 font-medium"
                >
                  こちら
                </a>
                から取得できます。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                  APIキー
                </label>
                <div className="mt-1 relative">
                  <input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showKey ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  APIキーは暗号化されてローカルストレージに保存されます
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={saveApiKey}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  保存
                </button>
                <button
                  onClick={testApiKey}
                  disabled={isTestingKey}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingKey ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      検証中...
                    </>
                  ) : (
                    'APIキーをテスト'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 使用方法 */}
          <div className="border-t pt-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">
              APIキーの取得方法
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>
                <a 
                  href="https://platform.openai.com/signup" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  OpenAIアカウント
                </a>
                を作成
              </li>
              <li>ログイン後、API keysページにアクセス</li>
              <li>「Create new secret key」をクリック</li>
              <li>生成されたキーをコピーして上記フィールドに貼り付け</li>
            </ol>
          </div>

          {/* 注意事項 */}
          <div className="border-t pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ 注意事項
              </h4>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                <li>APIキーは第三者と共有しないでください</li>
                <li>使用量に応じてOpenAIから課金されます</li>
                <li>月報1件の生成で約¥10-30程度の費用がかかります</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
};

export default Settings;