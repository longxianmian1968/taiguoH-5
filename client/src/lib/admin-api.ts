// Admin API client for backend management system
class AdminApiClient {
  private baseUrl = '/admin/api';

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  }

  // Authentication
  async login(credentials: { username: string; password: string }) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(data.message || 'Login failed');
    }

    return data.data;
  }

  async logout() {
    return this.request('/logout', { method: 'POST' });
  }

  // Activities Management
  async getActivities(filters?: { search?: string; type?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString();
    return this.request(`/activities${query ? `?${query}` : ''}`);
  }

  async createActivity(data: any) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActivity(id: string, data: any) {
    return this.request(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteActivity(id: string) {
    return this.request(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  // Stores Management
  async getStores(filters?: { search?: string; cityId?: number }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.cityId) params.append('cityId', filters.cityId.toString());
    
    const query = params.toString();
    return this.request(`/stores${query ? `?${query}` : ''}`);
  }

  async getStore(id: string) {
    return this.request(`/stores/${id}`);
  }

  async createStore(data: any) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cities Management
  async getCities() {
    return this.request('/cities');
  }

  // 智能翻译API
  async smartTranslate(text: string, key: string, type: 'ui' | 'content' = 'content', sourceLanguage?: 'zh' | 'th') {
    const response = await fetch('/api/i18n/smart-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, key, type, sourceLanguage })
    });
    if (!response.ok) throw new Error('智能翻译失败');
    const data = await response.json();
    return data.data;
  }

  // 创建活动（带智能翻译）
  async createActivityWithTranslation(activityData: any) {
    // 先进行智能翻译
    const titleKey = `activity.title.${Date.now()}`;
    const rulesKey = `activity.rules.${Date.now()}`;
    
    const [titleResult, rulesResult] = await Promise.all([
      this.smartTranslate(activityData.title, titleKey, 'content'),
      activityData.rules ? this.smartTranslate(activityData.rules, rulesKey, 'content') : Promise.resolve(null)
    ]);

    // 构建完整的活动数据
    const completeData = {
      ...activityData,
      titleKey,
      rulesKey,
      titleTh: titleResult.thText,
      rulesTh: rulesResult?.thText || ''
    };

    return this.createActivity(completeData);
  }

  // 创建门店（带智能翻译）
  async createStoreWithTranslation(storeData: any) {
    // 先进行智能翻译
    const nameKey = `store.name.${Date.now()}`;
    const addressKey = `store.address.${Date.now()}`;
    
    const [nameResult, addressResult] = await Promise.all([
      this.smartTranslate(storeData.name, nameKey, 'content'),
      this.smartTranslate(storeData.address, addressKey, 'content')
    ]);

    // 构建完整的门店数据
    const completeData = {
      ...storeData,
      nameKey,
      addressKey,
      nameTh: nameResult.thText,
      addressTh: addressResult.thText
    };

    return this.createStore(completeData);
  }

  async getStoreAnalytics(storeId: string, filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const query = params.toString();
    return this.request(`/stores/${storeId}/analytics${query ? `?${query}` : ''}`);
  }

  async getStoreActivities(storeId: string) {
    return this.request(`/stores/${storeId}/activities`);
  }

  async getStoreStaffPerformance(storeId: string, filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const query = params.toString();
    return this.request(`/stores/${storeId}/staff-performance${query ? `?${query}` : ''}`);
  }

  // Staff Management
  async getStaff(filters?: { storeId?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString();
    return this.request(`/staff${query ? `?${query}` : ''}`);
  }

  async createStaff(data: any) {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStaffAuthorization(staffId: string, storeId: string, canVerify: boolean) {
    return this.request(`/staff/${staffId}/authorization`, {
      method: 'PUT',
      body: JSON.stringify({ storeId, canVerify }),
    });
  }

  async removeStaff(staffId: string, storeId: string) {
    return this.request(`/staff/${staffId}`, {
      method: 'DELETE',
      body: JSON.stringify({ storeId }),
    });
  }

  async getStaffDetails(staffId: string, storeId: string) {
    return this.request(`/staff/${staffId}/details?storeId=${storeId}`);
  }

  // LINE Binding Management
  async generateStoreBinding(storeId: string, data: { noteName: string; mobile: string }) {
    return this.request(`/stores/${storeId}/generate-binding`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBindingStatus(staffId: string) {
    return this.request(`/staff/${staffId}/binding-status`);
  }

  // Statistics
  async getOverviewStats(filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const query = params.toString();
    return this.request(`/stats/overview${query ? `?${query}` : ''}`);
  }

  async getRedemptionStats(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const query = params.toString();
    return this.request(`/stats/redemptions${query ? `?${query}` : ''}`);
  }

  // Export functions
  async exportActivitiesCSV() {
    const response = await fetch(`${this.baseUrl}/export/activities`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const adminApi = new AdminApiClient();