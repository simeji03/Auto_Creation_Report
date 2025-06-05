import React from 'react';
import { Link } from 'react-router-dom';
// import { useQuery } from 'react-query';
// import { api } from '../services/api';

interface MonthlyStats {
  month: string;
  total_hours: number;
  total_income: number;
  projects_count: number;
  efficiency_score: number;
}

interface UserStats {
  total_reports: number;
  total_hours: number;
  total_income: number;
  average_monthly_hours: number;
  recent_months: MonthlyStats[];
}

interface RecentReport {
  id: number;
  report_month: string;
  total_work_hours: number;
  received_amount: number;
  created_at: string;
}

const Dashboard: React.FC = () => {
  // 認証機能無効化版 - 実際のAPIからデータを取得
  const user = { name: 'ユーザー' };
  const [stats, setStats] = React.useState({ total_reports: 0, total_income: 0 });
  const [recentReports, setRecentReports] = React.useState<RecentReport[]>([]);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [reportsLoading, setReportsLoading] = React.useState(true);

  // データ取得
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // 月報データを取得（統計用に多めに取得）
        const response = await fetch('http://localhost:8000/api/reports/?page=1&size=50');
        if (response.ok) {
          const data = await response.json();
          // 最新5件のみを表示用に保存
          setRecentReports(data.slice(0, 5));
          
          // 統計データを計算（全データを使用）
          const totalIncome = data.reduce((sum: number, report: any) => sum + (report.received_amount || 0), 0);
          setStats({
            total_reports: data.length,
            total_income: totalIncome
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setStatsLoading(false);
        setReportsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          ダッシュボード
        </h1>
        <p className="mt-2 text-gray-600">
          月報作成支援ツールへようこそ。簡単に美しい月報を作成できます。
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              総月報数
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {statsLoading ? '...' : stats?.total_reports || 0}
            </dd>
          </div>
        </div>

        {/* <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              総稼働時間
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {statsLoading ? '...' : `${stats?.total_hours.toFixed(1) || 0}h`}
            </dd>
          </div>
        </div> */}

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              総収入
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {statsLoading ? '...' : formatCurrency(stats?.total_income || 0)}
            </dd>
          </div>
        </div>

        {/* <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              月平均稼働時間
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {statsLoading ? '...' : `${stats?.average_monthly_hours.toFixed(1) || 0}h`}
            </dd>
          </div>
        </div> */}
      </div>

      {/* クイックアクション */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="/reports/conversation"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              🎤 対話で月報作成
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              月報一覧を見る
            </Link>
            <button
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              disabled
            >
              レポートをエクスポート（準備中）
            </button>
          </div>
        </div>
      </div>

      {/* 最近の月報 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            最近の月報
          </h2>
          {reportsLoading ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                読み込み中...
              </div>
            </div>
          ) : recentReports && recentReports.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      月
                    </th>
                    {/* <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      稼働時間
                    </th> */}
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      受領金額
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th className="px-6 py-3 bg-gray-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatMonth(report.report_month)}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.total_work_hours.toFixed(1)}h
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(report.received_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/reports/${report.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">まだ月報がありません</p>
              <Link
                to="/reports/conversation"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                🎤 対話で月報を作成
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;