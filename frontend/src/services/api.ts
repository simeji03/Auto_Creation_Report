import axios from 'axios';

// APIクライアントのインスタンス
export const api = axios.create({
  baseURL: 'http://localhost:8765/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンの追加）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラーの場合はログイン画面へ
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API エンドポイント
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
};

export const reportsAPI = {
  list: (page = 1, limit = 10) =>
    api.get('/reports/', { params: { page, limit } }),
  get: (id: number) => api.get(`/reports/${id}`),
  create: (data: any) => api.post('/reports/', data),
  update: (id: number, data: any) => api.put(`/reports/${id}`, data),
  delete: (id: number) => api.delete(`/reports/${id}`),
  dashboard: () => api.get('/reports/dashboard'),
};

export const usersAPI = {
  me: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
};

export const aiAPI = {
  generateSuggestions: (type: string, context: any) =>
    api.post('/ai/generate-suggestions', { type, context }),
};