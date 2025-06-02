import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import apiKeyService from '../services/apiKeyService';

interface ConversationSession {
  session_id: string;
  question: string | null;
  question_type: string;
  category: string;
  progress: number;
  total_questions: number;
  session_data: any;
  is_complete: boolean;
  example?: string;
}

const ConversationalReport: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const isUserStoppedRef = useRef(false);
  const recognitionInstanceRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // APIキーの確認
  useEffect(() => {
    const checkApiKey = () => {
      setHasApiKey(apiKeyService.hasApiKey());
    };
    
    checkApiKey();
    
    // ページがフォーカスされた時にも確認（設定画面から戻ってきた時など）
    const handleFocus = () => checkApiKey();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 音声認識の初期化（一度だけ実行）
  useEffect(() => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'ja-JP';
        recognitionInstance.maxAlternatives = 1;
        
        // インスタンスをrefに保存
        recognitionInstanceRef.current = recognitionInstance;
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // すべての結果を処理してfinalとinterimを分ける
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript = transcript; // 最新のinterimのみ保持
          }
        }
        
        // finalTranscriptが前回と異なる場合のみ更新
        if (finalTranscript !== finalTranscriptRef.current) {
          finalTranscriptRef.current = finalTranscript;
          setCurrentAnswer(finalTranscript);
        }
        
        // interim結果を更新
        setInterimText(interimTranscript);
      };
      
      recognitionInstance.onstart = () => {
        console.log('音声認識が開始されました');
        setIsListening(true);
        setIsRecording(true);
        setInterimText('');
        isUserStoppedRef.current = false;
      };
      
      recognitionInstance.onend = () => {
        console.log('音声認識が終了しました');
        setInterimText('');
        
        // ユーザーが手動で停止した場合は再開しない
        if (isUserStoppedRef.current) {
          console.log('ユーザーが停止したため終了');
          setIsListening(false);
          setIsRecording(false);
          return;
        }
        
        // 自然終了の場合のみ再開
        if (isListening && !isUserStoppedRef.current) {
          console.log('自動再開を試みます');
          setTimeout(() => {
            if (isListening && !isUserStoppedRef.current) {
              try {
                recognitionInstance.start();
              } catch (error) {
                console.error('音声認識の再開に失敗:', error);
                setIsListening(false);
                setIsRecording(false);
              }
            }
          }, 500);
        } else {
          setIsListening(false);
          setIsRecording(false);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        
        if (event.error === 'no-speech') {
          console.log('音声が検出されませんでした - 継続します');
          // no-speechは正常な状態なので継続
          return;
        }
        
        if (event.error === 'audio-capture' || event.error === 'not-allowed') {
          setIsListening(false);
          setIsRecording(false);
          setInterimText('');
          isUserStoppedRef.current = true;
          toast.error('マイクへのアクセスが拒否されました');
          return;
        }
        
        if (event.error === 'aborted') {
          console.log('音声認識が中断されました');
          // abortedエラーの場合は状態をクリアして終了
          if (!isUserStoppedRef.current) {
            setIsListening(false);
            setIsRecording(false);
          }
          return;
        }
        
        // その他のエラーの場合
        console.log('音声認識エラー - 再開を試みます:', event.error);
        if (isListening) {
          setTimeout(() => {
            if (isListening) {
              try {
                recognitionInstance.start();
              } catch (error) {
                console.error('音声認識の再開に失敗:', error);
                setIsListening(false);
                setIsRecording(false);
                setInterimText('');
                isUserStoppedRef.current = true;
              }
            }
          }, 500);
        }
      };
        
        setRecognition(recognitionInstance);
      }
    } catch (error) {
      console.error('音声認識の初期化エラー:', error);
      toast.error('音声認識の初期化に失敗しました');
    }
    
    // クリーンアップ関数
    return () => {
      if (recognitionInstanceRef.current) {
        try {
          recognitionInstanceRef.current.stop();
        } catch (error) {
          // 無視
        }
      }
    };
  }, []); // 空の依存配列で一度だけ実行

  // 対話セッションの開始
  const startConversation = async () => {
    setIsLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const response = await fetch('http://localhost:8000/api/conversation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          report_month: currentMonth
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      const data = await response.json();
      setSession(data);
      toast.success('対話型月報作成を開始しました');
    } catch (error) {
      console.error('セッション開始エラー:', error);
      toast.error('セッションの開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 音声認識の停止関数
  const stopRecording = () => {
    console.log('ユーザーが音声認識を停止しました');
    isUserStoppedRef.current = true;
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.stop();
      } catch (error) {
        console.error('音声認識停止エラー:', error);
      }
    }
    setIsListening(false);
    setIsRecording(false);
    setInterimText('');
  };

  // 音声認識の開始関数
  const startRecording = () => {
    if (!recognitionInstanceRef.current) {
      toast.error('音声認識はサポートされていません');
      return;
    }

    console.log('ユーザーが音声認識を開始しました');
    try {
      // 音声認識開始時に現在の確定テキストを保存
      finalTranscriptRef.current = currentAnswer;
      setInterimText('');
      isUserStoppedRef.current = false;
      recognitionInstanceRef.current.start();
      toast.info('音声認識を開始しました。話してください。');
    } catch (error) {
      console.error('音声認識の開始に失敗:', error);
      setIsListening(false);
      setIsRecording(false);
      setInterimText('');
      toast.error('音声認識の開始に失敗しました');
    }
  };

  // 音声認識の開始/停止トグル
  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 回答の送信
  const submitAnswer = async () => {
    if (!currentAnswer.trim() || !session) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/conversation/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: session.session_id,
          answer: currentAnswer.trim(),
          session_data: session.session_data
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const newSession = await response.json();
      setSession(newSession);
      setCurrentAnswer('');
      setInterimText('');
      finalTranscriptRef.current = '';
      
      // 音声認識が動作中の場合は停止して、インスタンスをリセット
      if (isListening) {
        stopRecording();
      }
      
      // 音声認識インスタンスをリセット（前の内容をクリア）
      if (recognitionInstanceRef.current) {
        try {
          recognitionInstanceRef.current.abort();
        } catch (error) {
          // エラーは無視
        }
      }

      if (newSession.is_complete) {
        // 対話完了、月報生成
        await generateReport(newSession.session_data);
      }
    } catch (error) {
      console.error('回答送信エラー:', error);
      toast.error('回答の送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // テスト用ダミーデータ
  const testAnswers: { [key: string]: string } = {
    'ideal_lifestyle': 'フリーランスエンジニアとして在宅で働きながら、家族との時間も大切にして月40万円の安定収入を得たいです。',
    'core_values': '相手目線で動く、夜遅くまで作業しない、毎朝スケジュール確認をする。',
    'ideal_daily_life': '朝7時起床、子供を学校に送った後9時から作業開始、15時に終業して家族時間を確保する生活。',
    'monthly_goals': '新規案件2件獲得、月40万円達成、家族との時間を週20時間確保する。',
    'goal_achievement': '新規案件1件獲得済み、月35万円達成、家族時間は目標をクリア。80%の達成率です。',
    'monthly_activities': 'WebアプリケーションのReact開発案件、API設計と実装、フロントエンド全般を担当しました。',
    'project_details': 'EC サイトのカート機能実装で、決済システム連携が難しかったですが無事完成できました。',
    'sales_activities': '営業メール40件送信、返信5件、面談2件実施。LinkedIn経由での問い合わせも2件ありました。',
    'learning_highlights': 'Next.js 14の新機能を学習、TypeScriptの型設計スキルが向上しました。',
    'work_hours': '160時間くらいですね。平日8時間、土日は家族時間を優先しました。',
    'monthly_income': '35万円でした。目標の40万円には届きませんでしたが、前月比10%アップです。',
    'life_changes': '子供の習い事が増えて送迎が忙しくなりましたが、在宅勤務で対応できています。',
    'life_balance': '仕事8、家庭7、自分時間3くらいの配分で、まずまずバランス取れていると思います。',
    'roles_responsibilities': '家計を支える稼ぎ手として、そして子育てのサポート役として頑張っています。',
    'challenges': 'クライアントとの認識合わせに時間がかかって、開発時間が圧迫されることがありました。',
    'discoveries': '仕様確認は面倒でも最初に丁寧にやった方が結果的に早く終わることに気づきました。',
    'growth_points': 'TypeScriptの複雑な型定義ができるようになった。営業文章の書き方も上達しました。',
    'happy_moments': '初めて単価60万円の案件を受注できて嬉しかったです。子供の運動会にも参加できました。',
    'next_month_goals': '月45万円達成、新技術のNext.js App Router習得、家族旅行の計画実行。',
    'things_to_stop': '夜遅くまでのコーディング、SNSの見過ぎ、完璧主義的な考え方をやめたいです。'
  };

  // カテゴリーと質問インデックスから質問IDを特定する構造
  const questionFlow: { [key: string]: { questions: { id: string }[] } } = {
    'vision_values': {
      questions: [
        { id: 'ideal_lifestyle' },
        { id: 'core_values' },
        { id: 'ideal_daily_life' }
      ]
    },
    'monthly_goals': {
      questions: [
        { id: 'monthly_goals' },
        { id: 'goal_achievement' }
      ]
    },
    'work_activities': {
      questions: [
        { id: 'monthly_activities' },
        { id: 'project_details' },
        { id: 'sales_activities' },
        { id: 'learning_highlights' }
      ]
    },
    'time_management': {
      questions: [
        { id: 'work_hours' },
        { id: 'monthly_income' }
      ]
    },
    'life_balance': {
      questions: [
        { id: 'life_changes' },
        { id: 'life_balance' },
        { id: 'roles_responsibilities' }
      ]
    },
    'reflection': {
      questions: [
        { id: 'challenges' },
        { id: 'discoveries' },
        { id: 'growth_points' },
        { id: 'happy_moments' }
      ]
    },
    'next_month': {
      questions: [
        { id: 'next_month_goals' },
        { id: 'things_to_stop' }
      ]
    }
  };

  // テスト用自動入力機能（現在の質問のみ）
  const fillTestData = () => {
    if (!session) return;
    
    const currentCategory = session.category;
    const currentQuestionIndex = session.session_data.current_question_index;
    const currentQuestionId = questionFlow[currentCategory]?.questions[currentQuestionIndex]?.id;
    const testAnswer = testAnswers[currentQuestionId] || 'テスト用の回答が設定されていません。';
    
    setCurrentAnswer(testAnswer);
    finalTranscriptRef.current = testAnswer;
    toast.success('テスト用データを入力しました！');
  };

  // 全質問一括テストデータ入力機能（対話中）
  const fillAllTestData = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      // 現在のセッションデータをコピー
      let currentSessionData = { ...session.session_data };
      
      // 全ての質問に対してテストデータで回答
      for (const [categoryKey, categoryData] of Object.entries(questionFlow)) {
        for (let questionIndex = 0; questionIndex < categoryData.questions.length; questionIndex++) {
          const questionId = categoryData.questions[questionIndex].id;
          const testAnswer = testAnswers[questionId] || 'テスト用の回答';
          
          // 回答データを追加
          if (!currentSessionData.answers) {
            currentSessionData.answers = {};
          }
          currentSessionData.answers[questionId] = {
            answer: testAnswer,
            additional_context: null
          };
        }
      }

      // 最終的に月報生成
      await generateReport(currentSessionData);
      toast.success('全質問にテストデータを入力して月報を生成しました！');
    } catch (error) {
      console.error('一括テストデータ入力エラー:', error);
      toast.error('一括入力に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 最初から一括テストデータで月報生成（セッション不要）
  const fillAllTestDataDirectly = async () => {
    setIsLoading(true);
    try {
      // 完全なテストデータセッションを作成（正しいスキーマ形式）
      const testSessionData = {
        user_id: 4, // 仮のユーザーID
        current_category: "completed",
        current_question_index: 0,
        answers: {} as { [key: string]: any },
        completed_categories: ["vision_values", "monthly_goals", "work_activities", "time_management", "life_balance", "reflection", "next_month"]
      };

      // 全ての質問に対してテストデータで回答
      for (const [categoryKey, categoryData] of Object.entries(questionFlow)) {
        for (let questionIndex = 0; questionIndex < categoryData.questions.length; questionIndex++) {
          const questionId = categoryData.questions[questionIndex].id;
          const testAnswer = testAnswers[questionId] || 'テスト用の回答';
          
          testSessionData.answers[questionId] = {
            answer: testAnswer,
            additional_context: null
          };
        }
      }

      // 新しいテストデータAPIを使用
      const response = await fetch('http://localhost:8000/api/test/generate-test-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate test report');
      }
      
      const responseData = await response.json();
      if (responseData.ai_generated_content) {
        // AI生成コンテンツがある場合は、AI月報表示画面に遷移
        navigate('/reports/ai-generated', { 
          state: { 
            aiContent: responseData.ai_generated_content,
            reportId: responseData.report_id 
          } 
        });
      } else {
        // 従来の月報詳細画面に遷移
        navigate(`/reports/${responseData.report_id}`);
      }
      toast.success('テストデータで月報を生成しました！');
    } catch (error) {
      console.error('一括テストデータ生成エラー:', error);
      toast.error('月報生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 月報の生成
  const generateReport = async (sessionData: any) => {
    try {
      // API使用状況の表示
      if (hasApiKey) {
        toast.info('🤖 OpenAI APIで高品質な月報を生成中...');
      } else {
        toast.info('📝 標準形式で月報を生成中...');
      }
      
      const response = await fetch('http://localhost:8000/api/conversation/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const responseData = await response.json();
      if (responseData.ai_generated_content) {
        // AI生成コンテンツがある場合は、AI月報表示画面に遷移
        navigate('/reports/ai-generated', { 
          state: { 
            aiContent: responseData.ai_generated_content,
            reportId: responseData.report_id 
          } 
        });
        toast.success('🎉 AI月報が正常に生成されました！');
      } else {
        // 従来の月報詳細画面に遷移
        navigate(`/reports/${responseData.report_id}`);
        toast.success('📄 標準月報が正常に生成されました！');
      }
    } catch (error) {
      console.error('月報生成エラー:', error);
      toast.error('月報の生成に失敗しました');
    }
  };

  // 進捗率の計算
  const progressPercentage = session ? Math.round((session.progress / session.total_questions) * 100) : 0;

  // カテゴリーの日本語名
  const getCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      'vision_values': 'ビジョン・価値観',
      'monthly_goals': '今月の目標',
      'work_activities': '仕事の活動',
      'time_management': '時間管理',
      'life_balance': '生活バランス',
      'reflection': '振り返り',
      'next_month': '来月に向けて',
      'completed': '完了'
    };
    return categoryNames[category] || category;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          {/* APIキー未設定の警告 */}
          {!hasApiKey && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    ⚠️ OpenAI APIキーが未設定です
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    AI月報生成を利用するには、OpenAI APIキーの設定が必要です。
                  </p>
                  <Link
                    to="/settings"
                    className="inline-flex items-center text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
                  >
                    ⚙️ 設定画面でAPIキーを設定する
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎤 対話型月報作成
            </h1>
            <p className="text-gray-600 mb-8">
              AIが質問をしますので、音声または文字で答えてください。<br />
              自然に会話するだけで、月報が自動的に作成されます。
            </p>
            <div className="space-y-4">
              <button
                onClick={startConversation}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {isLoading ? '準備中...' : '🎤 対話を開始する'}
              </button>
              
              <button
                onClick={fillAllTestDataDirectly}
                disabled={isLoading}
                className="w-full bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors font-semibold"
              >
                ⚡ テストデータで即座に月報生成
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                「テストデータで即座に月報生成」は開発テスト用です
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.is_complete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">対話完了！</h2>
          <p className="text-gray-600 mb-4">
            すべての質問にお答えいただき、ありがとうございました。
          </p>
          
          {/* API使用状況の表示 */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            hasApiKey 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {hasApiKey ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                🤖 AI高品質月報を生成中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4z" clipRule="evenodd" />
                </svg>
                📝 標準月報を生成中...
              </>
            )}
          </div>
          
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">対話型月報作成</h1>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              {getCategoryName(session.category)}
            </span>
          </div>
          
          {/* 進捗バー */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>進捗状況</span>
              <span>{session.progress} / {session.total_questions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-500 mt-1">
              {progressPercentage}% 完了
            </div>
          </div>
        </div>

        {/* 質問エリア */}
        <div className="bg-white shadow-lg p-8">
          <div className="mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">質問</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{session.question}</p>
                {session.example && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">{session.example}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 回答エリア */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                あなたの回答
              </label>
              <div className="relative">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => {
                    setCurrentAnswer(e.target.value);
                    // テキスト変更時はfinalTranscriptRefも更新
                    finalTranscriptRef.current = e.target.value;
                  }}
                  placeholder="ここに回答を入力するか、音声入力ボタンを使用してください..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
                {interimText && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <span className="text-xs text-gray-500">音声認識中: </span>
                    <span className="text-sm text-gray-700">{interimText}</span>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-2 right-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded animate-pulse">
                    録音中...
                  </div>
                )}
              </div>
            </div>

            {/* 音声入力とボタン */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {recognition && (
                  <button
                    onClick={toggleRecording}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isRecording 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        <span>録音停止</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span>音声入力</span>
                      </>
                    )}
                  </button>
                )}
                
                {/* テスト用データ入力ボタン */}
                <button
                  onClick={fillTestData}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>テストデータ</span>
                </button>
                
                <span className="text-sm text-gray-500">
                  音声・テキスト・テストデータで回答
                </span>
              </div>

              <button
                onClick={submitAnswer}
                disabled={!currentAnswer.trim() || isLoading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '送信中...' : '次へ →'}
              </button>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 rounded-b-2xl shadow-lg p-4 text-center text-sm text-gray-600">
          💡 自然に会話するように答えてください。詳細な情報ほど、より良い月報が作成されます。
        </div>
      </div>
    </div>
  );
};

export default ConversationalReport;