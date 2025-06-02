import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// ページコンポーネント
import Dashboard from './pages/Dashboard';
import ReportList from './pages/ReportList';
import ReportDetail from './pages/ReportDetail';
import ConversationalReport from './pages/ConversationalReport';
import AIGeneratedReport from './pages/AIGeneratedReport';
import Settings from './pages/Settings';

// レイアウトコンポーネント
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// React Query クライアント
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Routes>
              {/* すべてのルート - 認証無効化 */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="reports" element={<ReportList />} />
                <Route path="reports/conversation" element={<ConversationalReport />} />
                <Route path="reports/ai-generated" element={<AIGeneratedReport />} />
                <Route path="reports/:id" element={<ReportDetail />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;