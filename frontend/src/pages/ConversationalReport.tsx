import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from '../utils/toast';

interface ConversationSession {
  session_id: string;
  question: string | null;
  question_type: string;
  category: string;
  progress: number;
  total_questions: number;
  session_data: any;
  is_complete: boolean;
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
  const isUserStoppedRef = useRef(false);
  const recognitionInstanceRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

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
      const response = await api.post('/conversation/start');
      setSession(response.data);
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
      const response = await api.post('/conversation/answer', {
        session_id: session.session_id,
        answer: currentAnswer.trim(),
        session_data: session.session_data
      });

      const newSession = response.data;
      setSession(newSession);
      setCurrentAnswer('');
      setInterimText('');
      finalTranscriptRef.current = '';
      
      // 音声認識が動作中の場合は停止
      if (isListening) {
        stopRecording();
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

  // 月報の生成
  const generateReport = async (sessionData: any) => {
    try {
      const response = await api.post('/conversation/generate-report', sessionData);
      toast.success('月報が正常に生成されました！');
      navigate(`/reports/${response.data.report_id}`);
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
      'basic_info': '基本情報',
      'work_time': '稼働時間',
      'sales_activities': '営業活動',
      'financial': '収入',
      'reflection': '振り返り',
      'completed': '完了'
    };
    return categoryNames[category] || category;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
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
            <button
              onClick={startConversation}
              disabled={isLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
            >
              {isLoading ? '準備中...' : '🎤 対話を開始する'}
            </button>
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
          <p className="text-gray-600 mb-6">
            すべての質問にお答えいただき、ありがとうございました。<br />
            月報を生成しています...
          </p>
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
                
                <span className="text-sm text-gray-500">
                  音声またはテキストで回答してください
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