import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<MonthlyReport>>({});

  const { data: report, isLoading } = useQuery<MonthlyReport>(
    ['report', id],
    async () => {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setEditData(data);
      },
    }
  );

  const updateMutation = useMutation(
    async (data: Partial<MonthlyReport>) => {
      const response = await api.patch(`/reports/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['report', id]);
        toast.success('月報を更新しました');
        setIsEditing(false);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.detail || '更新に失敗しました';
        toast.error(errorMessage);
      },
    }
  );

  const deleteMutation = useMutation(
    async () => {
      await api.delete(`/reports/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('月報を削除しました');
        navigate('/reports');
      },
      onError: () => {
        toast.error('削除に失敗しました');
      },
    }
  );

  const generatePDFMutation = useMutation(
    async () => {
      const response = await api.post(`/reports/${id}/generate-pdf`, {
        template_type: 'default',
      }, {
        responseType: 'blob',
      });
      
      // ダウンロード処理
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monthly_report_${report?.report_month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    {
      onSuccess: () => {
        toast.success('PDFを生成しました');
      },
      onError: () => {
        toast.error('PDF生成に失敗しました');
      },
    }
  );

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(report || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(report || {});
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleDelete = () => {
    if (window.confirm('この月報を削除してもよろしいですか？')) {
      deleteMutation.mutate();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setEditData(prev => {
      const updated = { ...prev, [name]: processedValue };
      
      // 稼働時間の自動計算
      if (['coding_hours', 'meeting_hours', 'sales_hours'].includes(name)) {
        const coding = name === 'coding_hours' ? parseFloat(value) || 0 : prev.coding_hours || 0;
        const meeting = name === 'meeting_hours' ? parseFloat(value) || 0 : prev.meeting_hours || 0;
        const sales = name === 'sales_hours' ? parseFloat(value) || 0 : prev.sales_hours || 0;
        updated.total_work_hours = coding + meeting + sales;
      }
      
      return updated;
    });
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
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">月報が見つかりません</p>
        <Link
          to="/reports"
          className="text-indigo-600 hover:text-indigo-500"
        >
          月報一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {formatMonth(report.report_month)}の月報
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              作成日: {new Date(report.created_at).toLocaleDateString('ja-JP')} / 
              最終更新: {new Date(report.updated_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  編集
                </button>
                <button
                  onClick={() => generatePDFMutation.mutate()}
                  disabled={generatePDFMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {generatePDFMutation.isLoading ? 'PDF生成中...' : 'PDF出力'}
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  削除
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateMutation.isLoading ? '保存中...' : '保存'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">現在のフェーズ</dt>
            {isEditing ? (
              <input
                type="text"
                name="current_phase"
                value={editData.current_phase || ''}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.current_phase || '-'}</dd>
            )}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">家族の状況</dt>
            {isEditing ? (
              <input
                type="text"
                name="family_status"
                value={editData.family_status || ''}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.family_status || '-'}</dd>
            )}
          </div>
        </div>
      </div>

      {/* 稼働時間 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">稼働時間</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">総稼働時間</dt>
            <dd className="mt-1 text-2xl font-semibold text-indigo-600">
              {isEditing ? editData.total_work_hours?.toFixed(1) : report.total_work_hours.toFixed(1)}h
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">コーディング</dt>
            {isEditing ? (
              <input
                type="number"
                name="coding_hours"
                step="0.1"
                value={editData.coding_hours || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.coding_hours.toFixed(1)}h</dd>
            )}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">会議</dt>
            {isEditing ? (
              <input
                type="number"
                name="meeting_hours"
                step="0.1"
                value={editData.meeting_hours || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.meeting_hours.toFixed(1)}h</dd>
            )}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">営業</dt>
            {isEditing ? (
              <input
                type="number"
                name="sales_hours"
                step="0.1"
                value={editData.sales_hours || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.sales_hours.toFixed(1)}h</dd>
            )}
          </div>
        </div>
      </div>

      {/* 営業活動 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">営業活動</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">送信メール数</dt>
            {isEditing ? (
              <input
                type="number"
                name="sales_emails_sent"
                value={editData.sales_emails_sent || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.sales_emails_sent}</dd>
            )}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">返信数</dt>
            {isEditing ? (
              <input
                type="number"
                name="sales_replies"
                value={editData.sales_replies || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.sales_replies}</dd>
            )}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">商談数</dt>
            {isEditing ? (
              <input
                type="number"
                name="sales_meetings"
                value={editData.sales_meetings || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.sales_meetings}</dd>
            )}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">成約数</dt>
            {isEditing ? (
              <input
                type="number"
                name="contracts_signed"
                value={editData.contracts_signed || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-sm text-gray-900">{report.contracts_signed}</dd>
            )}
          </div>
        </div>
      </div>

      {/* 収入情報 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">収入情報</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">受領金額</dt>
            {isEditing ? (
              <input
                type="number"
                name="received_amount"
                value={editData.received_amount || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-2xl font-semibold text-green-600">
                {formatCurrency(report.received_amount)}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">納品金額</dt>
            {isEditing ? (
              <input
                type="number"
                name="delivered_amount"
                value={editData.delivered_amount || 0}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="mt-1 text-2xl font-semibold text-blue-600">
                {formatCurrency(report.delivered_amount)}
              </dd>
            )}
          </div>
        </div>
      </div>

      {/* 振り返り */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">振り返り</h2>
        <div className="space-y-6">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">良かった点</dt>
            {isEditing ? (
              <textarea
                name="good_points"
                rows={3}
                value={editData.good_points || ''}
                onChange={handleChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                {report.good_points || '-'}
              </dd>
            )}
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">課題・反省点</dt>
            {isEditing ? (
              <textarea
                name="challenges"
                rows={3}
                value={editData.challenges || ''}
                onChange={handleChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                {report.challenges || '-'}
              </dd>
            )}
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">改善点</dt>
            {isEditing ? (
              <textarea
                name="improvements"
                rows={3}
                value={editData.improvements || ''}
                onChange={handleChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                {report.improvements || '-'}
              </dd>
            )}
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">来月の目標</dt>
            {isEditing ? (
              <textarea
                name="next_month_goals"
                rows={3}
                value={editData.next_month_goals || ''}
                onChange={handleChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            ) : (
              <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                {report.next_month_goals || '-'}
              </dd>
            )}
          </div>
        </div>
      </div>

      {/* 戻るリンク */}
      <div className="mt-8 text-center">
        <Link
          to="/reports"
          className="text-indigo-600 hover:text-indigo-500"
        >
          ← 月報一覧に戻る
        </Link>
      </div>
    </div>
  );
};

export default ReportDetail;