import axios from 'axios';
import apiKeyService from './apiKeyService';

// APIクライアントのインスタンス
export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンとAPIキーの追加）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // OpenAI APIキーをヘッダーに追加
    const apiKey = apiKeyService.getApiKey();
    if (apiKey) {
      config.headers['X-OpenAI-API-Key'] = apiKey;
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
    // 認証無効化版 - 401エラーでリダイレクトしない
    console.error('API Error:', error.response?.status, error.message);
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