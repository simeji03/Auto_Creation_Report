import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

// ページコンポーネント
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportList from './pages/ReportList';
import ReportDetail from './pages/ReportDetail';
import ConversationalReport from './pages/ConversationalReport';
import AIGeneratedReport from './pages/AIGeneratedReport';
import Settings from './pages/Settings';

// レイアウトコンポーネント
import Layout from './components/Layout';
import AuthProvider from './contexts/AuthContext';
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
          <AuthProvider>
            <div className="App min-h-screen bg-gray-50">
              <Routes>
                {/* 認証不要のルート */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 認証必要のルート */}
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
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;