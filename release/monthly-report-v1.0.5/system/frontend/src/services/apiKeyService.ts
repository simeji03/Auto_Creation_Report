/**
 * OpenAI APIキー管理サービス
 */

const API_KEY_STORAGE_KEY = 'openai_api_key';

export const apiKeyService = {
  /**
   * APIキーを取得
   */
  getApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  },

  /**
   * APIキーを保存
   */
  setApiKey(apiKey: string): void {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  },

  /**
   * APIキーが設定されているかチェック
   */
  hasApiKey(): boolean {
    const key = this.getApiKey();
    return !!key && key.trim().length > 0;
  },

  /**
   * APIキーをヘッダーに追加
   */
  addApiKeyToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const apiKey = this.getApiKey();
    if (apiKey) {
      return {
        ...headers,
        'X-OpenAI-API-Key': apiKey
      };
    }
    return headers;
  },

  /**
   * APIキーをマスク表示（最初と最後の数文字のみ表示）
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 10) return apiKey;
    
    const firstChars = apiKey.substring(0, 3);
    const lastChars = apiKey.substring(apiKey.length - 4);
    return `${firstChars}...${lastChars}`;
  }
};

export default apiKeyService;