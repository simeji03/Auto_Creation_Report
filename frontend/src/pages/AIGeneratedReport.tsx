import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from '../utils/toast';

const AIGeneratedReport: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rich' | 'raw'>('rich');

  const { aiContent, reportId } = location.state || {};

  // AIコンテンツがない場合はリダイレクト
  if (!aiContent) {
    navigate('/reports');
    return null;
  }

  // Notionコピー機能（生データをそのまま）
  const handleNotionCopy = async () => {
    try {
      await navigator.clipboard.writeText(aiContent);
      setCopied(true);
      toast.success('Notion貼り付け用でクリップボードにコピーしました！');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('コピーに失敗しました');
    }
  };

  // 月報詳細画面に移動
  const goToReportDetail = () => {
    navigate(`/reports/${reportId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">🤖 AI生成月報</h1>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  OpenAI API使用
                </div>
              </div>
              <p className="text-gray-600">音声入力を基にGPT-4で自動生成された高品質な月報です</p>
            </div>
            <div className="flex space-x-3">
              {/* 表示モード切替 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('rich')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'rich'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  リッチ表示
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'raw'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  生データ
                </button>
              </div>
              
              {/* Notionコピーボタン */}
              <button
                onClick={handleNotionCopy}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${
                  copied
                    ? 'text-green-700 bg-green-100 border-green-300'
                    : 'text-purple-700 bg-purple-100 hover:bg-purple-200 border-purple-300'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    コピー完了
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Notionコピー
                  </>
                )}
              </button>
              
              <button
                onClick={goToReportDetail}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                従来表示
              </button>
            </div>
          </div>
        </div>

        {/* AI生成コンテンツ */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            {viewMode === 'rich' ? (
              /* リッチ表示（Notionライク） */
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // カスタムスタイリング
                    h1: ({node, ...props}) => (
                      <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200" {...props} />
                    ),
                    h2: ({node, ...props}) => (
                      <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4 flex items-center" {...props} />
                    ),
                    h3: ({node, ...props}) => (
                      <h3 className="text-xl font-medium text-gray-700 mt-6 mb-3" {...props} />
                    ),
                    p: ({node, ...props}) => (
                      <p className="text-gray-700 leading-relaxed mb-4" {...props} />
                    ),
                    strong: ({node, ...props}) => (
                      <strong className="font-semibold text-gray-900" {...props} />
                    ),
                    ul: ({node, ...props}) => (
                      <ul className="space-y-2 mb-4" {...props} />
                    ),
                    li: ({node, ...props}) => (
                      <li className="text-gray-700 ml-4 flex items-start">
                        <span className="text-blue-500 mr-2 mt-2 text-xs">●</span>
                        <span {...props} />
                      </li>
                    ),
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto mb-6">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => (
                      <thead className="bg-gray-50" {...props} />
                    ),
                    th: ({node, ...props}) => (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" {...props} />
                    ),
                    td: ({node, ...props}) => (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-100" {...props} />
                    ),
                    tbody: ({node, ...props}) => (
                      <tbody className="bg-white divide-y divide-gray-100" {...props} />
                    ),
                    hr: ({node, ...props}) => (
                      <hr className="my-8 border-gray-200" {...props} />
                    ),
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props} />
                    )
                  }}
                >
                  {aiContent}
                </ReactMarkdown>
              </div>
            ) : (
              /* 生データ表示 */
              <div className="prose max-w-none">
                <div 
                  className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    lineHeight: '1.7'
                  }}
                >
                  {aiContent}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            この月報は音声入力を元にOpenAI GPT-4が自動生成しました
          </div>
          
          {/* API使用詳細 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                ✨ AI生成機能が使用されました
              </span>
            </div>
            <ul className="text-xs text-green-700 space-y-1 text-left max-w-md mx-auto">
              <li>• あなたのAPIキーでOpenAI GPT-4を使用</li>
              <li>• 推定コスト: ¥10-30程度</li>
              <li>• 2000-3000文字の高品質な月報を自動生成</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-2">
              💡 <strong>使い方のヒント:</strong>
            </p>
            <ul className="text-xs text-blue-700 space-y-1 text-left max-w-md mx-auto">
              <li>• <strong>リッチ表示</strong>: Notionライクな見やすい表示</li>
              <li>• <strong>生データ</strong>: 元のMarkdown形式の確認</li>
              <li>• <strong>Notionコピー</strong>: Notionにそのまま貼り付けられる形式</li>
            </ul>
          </div>
          <div>
            <button
              onClick={() => navigate('/reports')}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              ← 月報一覧に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratedReport;