/**
 * API通信サービス - 認証機能無効化版
 */

const API_BASE_URL = 'http://localhost:8000/api';

export const apiService = {
  // APIキーテスト用のヘルスチェック
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/../health`);
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  },

  // 基本的なGETリクエスト
  async get(endpoint: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API GET request failed:', error);
      throw error;
    }
  },

  // 基本的なPOSTリクエスト
  async post(endpoint: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API POST request failed:', error);
      throw error;
    }
  }
};

export default apiService;