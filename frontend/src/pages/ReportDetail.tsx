import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface MonthlyReport {
  id: number;
  report_month: string;
  current_phase: string;
  family_status: string;
  total_work_hours: number;
  coding_hours: number;
  meeting_hours: number;
  sales_hours: number;
  sales_emails_sent: number;
  sales_replies: number;
  sales_meetings: number;
  contracts_signed: number;
  received_amount: number;
  delivered_amount: number;
  good_points: string;
  challenges: string;
  improvements: string;
  next_month_goals: string;
  created_at: string;
  updated_at: string;
}

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'rich' | 'raw'>('rich');
  const [copied, setCopied] = useState(false);

  const { data: report, isLoading } = useQuery<MonthlyReport>(
    ['report', id],
    async () => {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    },
    {
      enabled: !!id, // idが存在する場合のみクエリを実行
    }
  );

  const deleteMutation = useMutation(
    async () => {
      if (!id) throw new Error('レポートIDが見つかりません');
      await api.delete(`/reports/${id}`);
    },
    {
      onSuccess: async () => {
        console.group('🗑️ 削除処理開始');
        console.log('1. 削除API成功');
        
        // キャッシュを完全にクリアしてから遷移
        console.log('2. キャッシュリセット開始');
        await queryClient.resetQueries(['reports']);
        console.log('3. キャッシュ無効化開始');
        await queryClient.invalidateQueries(['reports']);
        console.log('4. キャッシュ処理完了');
        
        // 遷移前に少し待機してキャッシュ更新を確実にする
        console.log('5. 遷移待機中...');
        setTimeout(() => {
          console.log('6. /reports に遷移実行');
          navigate('/reports', { replace: true });
          toast.success('月報を削除しました');
          console.groupEnd();
        }, 100);
      },
      onError: () => {
        toast.error('削除に失敗しました');
      },
    }
  );

  // AI生成月報かどうかを判定（good_pointsに大量のテキスト+Markdownがある場合）
  const isAIGeneratedReport = (report: MonthlyReport | undefined) => {
    if (!report || !report.good_points) return false;
    return report.good_points.length > 500 && 
           (report.good_points.includes('# ') || report.good_points.includes('## '));
  };

  // Notionコピー機能
  const handleNotionCopy = async () => {
    if (!report?.good_points) return;
    try {
      await navigator.clipboard.writeText(report.good_points);
      setCopied(true);
      toast.success('Notion貼り付け用でクリップボードにコピーしました！');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('コピーに失敗しました');
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const handleDelete = () => {
    if (window.confirm('この月報を削除してもよろしいですか？')) {
      deleteMutation.mutate();
    }
  };

  // 削除処理中の場合は何も表示しない
  if (deleteMutation.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-flex items-center">
          <svg className="animate-spin h-5 w-5 mr-3 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          削除中...
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-flex items-center">
          <svg className="animate-spin h-5 w-5 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          読み込み中...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">月報が見つかりません</p>
            <Link to="/reports" className="text-indigo-600 hover:text-indigo-500">
              月報一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {report && isAIGeneratedReport(report) ? '🤖 ' : '📋 '}
                {formatMonth(report.report_month)}の月報
              </h1>
              <p className="text-gray-600 mt-1">
                作成日: {new Date(report.created_at).toLocaleDateString('ja-JP')} / 
                最終更新: {new Date(report.updated_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div className="flex space-x-3">
              {/* AI生成月報の場合は表示モード切替を表示 */}
              {report && isAIGeneratedReport(report) && (
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
              )}
              
              {/* AI生成月報の場合はNotionコピーボタンを表示 */}
              {report && isAIGeneratedReport(report) && (
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
              )}

              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isLoading ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>

        {/* AI生成月報の場合はリッチ表示 */}
        {report && isAIGeneratedReport(report) ? (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              {viewMode === 'rich' ? (
                /* リッチ表示（Notionライク） */
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
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
                    {report.good_points}
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
                    {report.good_points}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 従来の月報表示 */
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">現在のフェーズ</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.current_phase || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">家族の状況</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.family_status || '-'}</dd>
                </div>
              </div>
            </div>

            {/* 稼働時間 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">稼働時間</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">総稼働時間</dt>
                  <dd className="mt-1 text-2xl font-semibold text-indigo-600">
                    {report.total_work_hours.toFixed(1)}h
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">コーディング</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.coding_hours.toFixed(1)}h</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">会議</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.meeting_hours.toFixed(1)}h</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">営業</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.sales_hours.toFixed(1)}h</dd>
                </div>
              </div>
            </div>

            {/* 営業活動 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">営業活動</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">送信メール数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.sales_emails_sent}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">返信数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.sales_replies}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">商談数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.sales_meetings}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">成約数</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.contracts_signed}</dd>
                </div>
              </div>
            </div>

            {/* 収入情報 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">収入情報</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">受領金額</dt>
                  <dd className="mt-1 text-2xl font-semibold text-green-600">
                    {formatCurrency(report.received_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">納品金額</dt>
                  <dd className="mt-1 text-2xl font-semibold text-blue-600">
                    {formatCurrency(report.delivered_amount)}
                  </dd>
                </div>
              </div>
            </div>

            {/* 振り返り */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">振り返り</h2>
              <div className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">良かった点</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                    {report.good_points || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">課題・反省点</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                    {report.challenges || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">改善点</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                    {report.improvements || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">来月の目標</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                    {report.next_month_goals || '-'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 戻るリンク */}
        <div className="mt-6 text-center">
          <Link
            to="/reports"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            ← 月報一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;