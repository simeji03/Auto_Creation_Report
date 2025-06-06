import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { api } from '../services/api';
import { toast } from 'react-toastify';

interface ReportFormData {
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
}

const CreateReport: React.FC = () => {
  const navigate = useNavigate();
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  
  // 現在の年月を初期値として設定
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [formData, setFormData] = useState<ReportFormData>({
    report_month: defaultMonth,
    current_phase: '',
    family_status: '',
    total_work_hours: 0,
    coding_hours: 0,
    meeting_hours: 0,
    sales_hours: 0,
    sales_emails_sent: 0,
    sales_replies: 0,
    sales_meetings: 0,
    contracts_signed: 0,
    received_amount: 0,
    delivered_amount: 0,
    good_points: '',
    challenges: '',
    improvements: '',
    next_month_goals: '',
  });

  const createMutation = useMutation(
    async (data: ReportFormData) => {
      const response = await api.post('/reports', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('月報を作成しました');
        navigate(`/reports/${data.id}`);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.detail || '作成に失敗しました';
        toast.error(errorMessage);
      },
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: processedValue };
      
      // 稼働時間の自動計算
      if (['coding_hours', 'meeting_hours', 'sales_hours'].includes(name)) {
        updated.total_work_hours = 
          (name === 'coding_hours' ? parseFloat(value) || 0 : prev.coding_hours) +
          (name === 'meeting_hours' ? parseFloat(value) || 0 : prev.meeting_hours) +
          (name === 'sales_hours' ? parseFloat(value) || 0 : prev.sales_hours);
      }
      
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleAIAssist = async (type: 'reflection' | 'improvement' | 'goals') => {
    setIsAIAssisting(true);
    try {
      const response = await api.post('/ai/analyze', {
        report_data: formData,
        analysis_type: type,
      });
      
      const { suggestions, summary } = response.data;
      
      switch (type) {
        case 'reflection':
          setFormData(prev => ({
            ...prev,
            good_points: summary || suggestions.join('\n'),
          }));
          break;
        case 'improvement':
          setFormData(prev => ({
            ...prev,
            challenges: suggestions[0] || '',
            improvements: suggestions.slice(1).join('\n') || '',
          }));
          break;
        case 'goals':
          setFormData(prev => ({
            ...prev,
            next_month_goals: summary || suggestions.join('\n'),
          }));
          break;
      }
      
      toast.success('AI分析が完了しました');
    } catch (error) {
      toast.error('AI分析に失敗しました');
    } finally {
      setIsAIAssisting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">新規月報作成</h1>
        <p className="mt-2 text-sm text-gray-600">
          月次の活動報告を作成します
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本情報 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="report_month" className="block text-sm font-medium text-gray-700">
                対象月
              </label>
              <input
                type="month"
                name="report_month"
                id="report_month"
                required
                value={formData.report_month}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="current_phase" className="block text-sm font-medium text-gray-700">
                どんな暮らしや働き方を目指してる？
              </label>
              <input
                type="text"
                name="current_phase"
                id="current_phase"
                value={formData.current_phase}
                onChange={handleChange}
                placeholder="例：子どもの送迎をしながら、週4稼働で月50万円。自分の好きな仕事だけで生計を立てたい。"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="family_status" className="block text-sm font-medium text-gray-700">
                家庭や生活で何か変化や大きな出来事はあった？
              </label>
              <input
                type="text"
                name="family_status"
                id="family_status"
                value={formData.family_status}
                onChange={handleChange}
                placeholder="例：子どもが発熱で2日休み。夫が出張でワンオペ多めだった。健康診断で再検査の連絡がきた。"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 稼働時間 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">今月の稼働時間・収入</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="coding_hours" className="block text-sm font-medium text-gray-700">
                案件作業時間（時間）
              </label>
              <input
                type="number"
                name="coding_hours"
                id="coding_hours"
                step="0.1"
                min="0"
                value={formData.coding_hours}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="meeting_hours" className="block text-sm font-medium text-gray-700">
                会議・打ち合わせ時間（時間）
              </label>
              <input
                type="number"
                name="meeting_hours"
                id="meeting_hours"
                step="0.1"
                min="0"
                value={formData.meeting_hours}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="sales_hours" className="block text-sm font-medium text-gray-700">
                営業・学習時間（時間）
              </label>
              <input
                type="number"
                name="sales_hours"
                id="sales_hours"
                step="0.1"
                min="0"
                value={formData.sales_hours}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="total_work_hours" className="block text-sm font-medium text-gray-700">
                総稼働時間（自動計算）
              </label>
              <input
                type="number"
                name="total_work_hours"
                id="total_work_hours"
                step="0.1"
                value={formData.total_work_hours}
                readOnly
                className="mt-1 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 営業活動 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">今月やったこと（営業・案件・学び）</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="sales_emails_sent" className="block text-sm font-medium text-gray-700">
                送信メール数
              </label>
              <input
                type="number"
                name="sales_emails_sent"
                id="sales_emails_sent"
                min="0"
                value={formData.sales_emails_sent}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="sales_replies" className="block text-sm font-medium text-gray-700">
                返信数
              </label>
              <input
                type="number"
                name="sales_replies"
                id="sales_replies"
                min="0"
                value={formData.sales_replies}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="sales_meetings" className="block text-sm font-medium text-gray-700">
                商談数
              </label>
              <input
                type="number"
                name="sales_meetings"
                id="sales_meetings"
                min="0"
                value={formData.sales_meetings}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="contracts_signed" className="block text-sm font-medium text-gray-700">
                成約数
              </label>
              <input
                type="number"
                name="contracts_signed"
                id="contracts_signed"
                min="0"
                value={formData.contracts_signed}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 収入情報 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">収入情報</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="received_amount" className="block text-sm font-medium text-gray-700">
                受領金額（円）
              </label>
              <input
                type="number"
                name="received_amount"
                id="received_amount"
                min="0"
                value={formData.received_amount}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="delivered_amount" className="block text-sm font-medium text-gray-700">
                納品金額（円）
              </label>
              <input
                type="number"
                name="delivered_amount"
                id="delivered_amount"
                min="0"
                value={formData.delivered_amount}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 振り返り */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">振り返り</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="good_points" className="block text-sm font-medium text-gray-700">
                  今月「これできるようになった！」と思えた成長や変化
                </label>
                <button
                  type="button"
                  onClick={() => handleAIAssist('reflection')}
                  disabled={isAIAssisting}
                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  AI分析
                </button>
              </div>
              <textarea
                name="good_points"
                id="good_points"
                rows={3}
                value={formData.good_points}
                onChange={handleChange}
                placeholder="例：外注にタスクを振るのが前よりスムーズになった。コーディングのスピードが上がった。"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="challenges" className="block text-sm font-medium text-gray-700">
                今月「これは大変だった」「困ったな」と思ったこと
              </label>
              <textarea
                name="challenges"
                id="challenges"
                rows={3}
                value={formData.challenges}
                onChange={handleChange}
                placeholder="例：営業を後回しにしてしまい動けなかった。子どもの送迎でスケジュールが崩れた。"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="improvements" className="block text-sm font-medium text-gray-700">
                  今月「これ気づいた！」とか「こうすればよかった！」と思ったこと
                </label>
                <button
                  type="button"
                  onClick={() => handleAIAssist('improvement')}
                  disabled={isAIAssisting}
                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  AI分析
                </button>
              </div>
              <textarea
                name="improvements"
                id="improvements"
                rows={3}
                value={formData.improvements}
                onChange={handleChange}
                placeholder="例：タスクは翌日に持ち越さず、その日のうちに終わらせた方が楽だった。外注を使うと負担が減ると気づいた。"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="next_month_goals" className="block text-sm font-medium text-gray-700">
                  来月の目標・力を入れたいこと
                </label>
                <button
                  type="button"
                  onClick={() => handleAIAssist('goals')}
                  disabled={isAIAssisting}
                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  AI分析
                </button>
              </div>
              <textarea
                name="next_month_goals"
                id="next_month_goals"
                rows={3}
                value={formData.next_month_goals}
                onChange={handleChange}
                placeholder="例：営業50件送信、案件3件納品、家庭時間を増やす、外注活用を1件以上試す。"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                作成中...
              </span>
            ) : (
              '月報を作成'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateReport;