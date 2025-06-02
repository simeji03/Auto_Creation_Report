import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface MonthlyReport {
  id: number;
  report_month: string;
  current_phase: string;
  total_work_hours: number;
  coding_hours: number;
  meeting_hours: number;
  sales_hours: number;
  received_amount: number;
  delivered_amount: number;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  items: MonthlyReport[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const ReportList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;
  const queryClient = useQueryClient();
  const location = useLocation();

  // ページに到達した時（削除後の遷移等）にキャッシュを強制更新
  useEffect(() => {
    console.group('📍 ReportList Mount/Route Change');
    console.log('Current pathname:', location.pathname);
    console.log('Current search:', location.search);
    console.log('Current state:', location.state);
    console.log('Executing cache invalidation...');
    
    queryClient.invalidateQueries(['reports']).then(() => {
      console.log('✅ Cache invalidation completed');
      console.groupEnd();
    });
  }, [location.pathname, queryClient]);

  const { data, isLoading, refetch, error } = useQuery<PaginatedResponse>(
    ['reports', page, searchTerm],
    async () => {
      try {
        const response = await api.get('/reports', {
          params: {
            page,
            size: pageSize,
            search: searchTerm || undefined,
          },
        });
        console.group('📡 API Response Analysis');
        console.log('Raw Response:', response);
        console.log('Response Data:', response.data);
        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers);
        console.groupEnd();
        
        // レスポンスデータの構造を検証
        if (!response.data) {
          throw new Error('No response data');
        }
        
        // APIが直接配列を返す場合（実際の仕様）をページネーション構造に変換
        if (Array.isArray(response.data)) {
          console.log('✅ Converting array response to pagination structure');
          const items = response.data;
          return {
            items: items,
            total: items.length,
            page: page,
            size: pageSize,
            pages: Math.ceil(items.length / pageSize)
          };
        }
        
        // 既にページネーション構造の場合（将来的な拡張用）
        if (typeof response.data === 'object' && 'items' in response.data) {
          console.log('✅ Response already in pagination structure');
          return response.data;
        }
        
        console.warn('⚠️ Unknown response structure, providing default');
        return {
          items: [],
          total: 0,
          page: 1,
          size: pageSize,
          pages: 0
        };
      } catch (error) {
        console.error('🚨 API Error:', error);
        // エラー時のデフォルト値
        return {
          items: [],
          total: 0,
          page: 1,
          size: pageSize,
          pages: 0
        };
      }
    },
    {
      keepPreviousData: false, // 削除後の即座更新のため無効化
      retry: 2, // リトライ回数を制限
      retryDelay: 1000,
      staleTime: 0, // 常に最新データを取得
      cacheTime: 0 // キャッシュを保持しない
    }
  );

  // 型ガード関数
  const isValidPaginatedResponse = (data: any): data is PaginatedResponse => {
    return data && 
           typeof data === 'object' && 
           'items' in data && 
           Array.isArray(data.items) &&
           'total' in data &&
           'page' in data &&
           'size' in data &&
           'pages' in data;
  };

  // 詳細デバッグ用ログ
  console.group('🔍 ReportList Debug Info');
  console.log('📊 Query State:', {
    isLoading,
    error: error ? String(error) : 'No error',
    dataExists: !!data,
    dataType: typeof data,
  });
  console.log('📦 Data Structure:', data);
  console.log('✅ Validation Results:', {
    isValidData: isValidPaginatedResponse(data),
    hasItems: data && 'items' in data,
    itemsIsArray: data && Array.isArray(data.items),
    itemsLength: data && data.items ? data.items.length : 'N/A',
    itemsContent: data && data.items ? data.items.slice(0, 2) : 'N/A' // 最初の2件だけ表示
  });
  console.log('🎯 Render Conditions:', {
    showLoading: isLoading,
    showTable: isValidPaginatedResponse(data) && data.items.length > 0,
    showEmpty: !isLoading && (!isValidPaginatedResponse(data) || data.items.length === 0)
  });
  console.groupEnd();

  const handleDelete = async (id: number, month: string) => {
    if (!window.confirm(`${formatMonth(month)}の月報を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await api.delete(`/reports/${id}`);
      
      // 複数の方法でキャッシュを確実に更新
      await queryClient.resetQueries(['reports']); // 全てリセット
      await queryClient.invalidateQueries(['reports']); // 無効化
      await queryClient.refetchQueries(['reports'], { active: true }); // 再取得
      
      // 強制的にコンポーネント再レンダリング
      setPage(prev => prev);
      
      toast.success('月報を削除しました');
      console.log('🗑️ 削除完了後のキャッシュ完全更新実行');
    } catch (error) {
      console.error('🚨 削除エラー:', error);
      toast.error('削除に失敗しました');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">月報一覧</h1>
          <p className="mt-2 text-sm text-gray-700">
            作成済みの月報を管理・確認できます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/reports/conversation"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            🤖 新規月報作成
          </Link>
        </div>
      </div>

      {/* 検索フォーム */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="sm:flex sm:items-center">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="search" className="sr-only">
              検索
            </label>
            <input
              type="text"
              name="search"
              id="search"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="年月で検索（例: 2024-01）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto"
          >
            検索
          </button>
        </form>
      </div>

      {/* 月報テーブル */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              {(() => {
                const renderState = {
                  isLoading,
                  dataExists: !!data,
                  dataStructure: data ? Object.keys(data) : [],
                  hasItems: data && 'items' in data,
                  itemsLength: data?.items?.length,
                  isValidStructure: isValidPaginatedResponse(data),
                  willShowTable: isValidPaginatedResponse(data) && data.items && data.items.length > 0,
                  willShowEmpty: !isLoading && (!isValidPaginatedResponse(data) || !data?.items || data.items.length === 0)
                };
                
                console.log('🎨 Render Decision Point:', renderState);
                
                // DOMに情報を埋め込んでブラウザで確認できるように
                if (typeof window !== 'undefined') {
                  (window as any).reportListDebug = renderState;
                }
                
                return null;
              })()}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    読み込み中...
                  </div>
                </div>
              ) : data && data.items && data.items.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        月
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        フェーズ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        総稼働時間
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        受領金額
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        更新日
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">操作</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.items?.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatMonth(report.report_month)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {report.current_phase || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {report.total_work_hours.toFixed(1)}h
                          </div>
                          <div className="text-xs text-gray-500">
                            コーディング: {report.coding_hours.toFixed(1)}h / 
                            会議: {report.meeting_hours.toFixed(1)}h / 
                            営業: {report.sales_hours.toFixed(1)}h
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(report.received_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.updated_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/reports/${report.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            詳細
                          </Link>
                          <button
                            onClick={() => handleDelete(report.id, report.report_month)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? '検索結果がありません' : 'まだ月報がありません'}
                  </p>
                  {!searchTerm && (
                    <Link
                      to="/reports/conversation"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      🤖 最初の月報を作成
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ページネーション */}
      {data && data.pages && data.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data?.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                全{' '}<span className="font-medium">{data?.total}</span>{' '}件中{' '}
                <span className="font-medium">{(page - 1) * pageSize + 1}</span>{' '}から{' '}
                <span className="font-medium">
                  {Math.min(page * pageSize, data?.total || 0)}
                </span>{' '}
                件を表示
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">前へ</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {[...Array(data?.pages || 0)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === i + 1
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === data?.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">次へ</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;