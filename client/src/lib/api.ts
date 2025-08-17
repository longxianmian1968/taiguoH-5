import { apiRequest } from "./queryClient";

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface Activity {
  id: string;
  title: string;
  titleTh?: string;
  type: 'coupon' | 'group' | 'presale' | 'franchise';
  coverUrl: string;
  quantity: number;
  claimedCount?: number; // 已领取/预约数量
  price: number;
  listPrice?: number;
  startAt: string;
  endAt: string;
  rules?: string;
  rulesTh?: string;
  status: 'draft' | 'published' | 'paused' | 'archived';
  coverage?: {
    canParticipate: boolean;
    cities: string[];
  };
}

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  distanceKm?: number;
  mapsUrl?: string;
}

export interface Coupon {
  id: string;
  activityId: string;
  userId: string;
  code: string;
  status: 'active' | 'used' | 'expired';
  claimedAt: string;
  usedAt?: string;
}

// Frontend API functions
export const api = {
  // User-related endpoints
  async getUserCoupons(userId: string) {
    const response = await fetch(`/api/users/${userId}/coupons`);
    return response.json().then(data => data.data || []);
  },

  async getUserRedeems(userId: string) {
    const response = await fetch(`/api/users/${userId}/redeems`);
    return response.json().then(data => data.data || []);
  },
  // Activities
  getActivities: async (params?: {
    type?: string;
    q?: string;
    cursor?: string;
    page_size?: number;
  }): Promise<Activity[]> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    
    const url = `/api/activities${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await apiRequest('GET', url);
    const result: ApiResponse<Activity[]> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data || [];
  },

  getActivity: async (id: string, params?: {
    ipCity?: string;
    lat?: number;
    lng?: number;
  }): Promise<Activity> => {
    const searchParams = new URLSearchParams();
    if (params?.ipCity) searchParams.set('ipCity', params.ipCity);
    if (params?.lat) searchParams.set('lat', params.lat.toString());
    if (params?.lng) searchParams.set('lng', params.lng.toString());
    
    const url = `/api/activities/${id}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiRequest('GET', url);
    const result: ApiResponse<Activity> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message || 'Activity not found');
    }
    
    if (!result.data) {
      throw new Error('Activity data is missing');
    }
    return result.data;
  },

  getActivityStoresNearby: async (id: string, params?: {
    lat?: number;
    lng?: number;
    limit?: number;
  }): Promise<Store[]> => {
    const searchParams = new URLSearchParams();
    if (params?.lat) searchParams.set('lat', params.lat.toString());
    if (params?.lng) searchParams.set('lng', params.lng.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const url = `/api/activities/${id}/stores-nearby${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiRequest('GET', url);
    const result: ApiResponse<Store[]> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data || [];
  },

  // Coupons
  claimCoupon: async (data: { activityId: string; userId: string }): Promise<Coupon> => {
    const response = await apiRequest('POST', '/api/coupons', data);
    const result: ApiResponse<Coupon> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data!;
  },

  // Verification
  verifyCoupon: async (data: {
    code: string;
    storeId: string;
    staffId: string;
    lineUserId: string;
  }): Promise<any> => {
    const response = await apiRequest('POST', '/api/verify', data);
    const result: ApiResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data;
  },

  // Translation
  translateUI: async (data: {
    text: string;
    from: string;
    to: string;
  }): Promise<string> => {
    const response = await apiRequest('POST', '/api/i18n/translate/ui', data);
    const result: ApiResponse<{ translated: string }> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data?.translated || data.text;
  },

  translateContent: async (data: {
    text: string;
    from: string;
    to: string;
  }): Promise<string> => {
    const response = await apiRequest('POST', '/api/i18n/translate/content', data);
    const result: ApiResponse<{ translated: string }> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data?.translated || data.text;
  },

  // Group buying methods
  joinGroupBuying: async (activityId: string, userId: string): Promise<any> => {
    const response = await apiRequest('POST', '/api/group-buying/create-instance', {
      activityId,
      userId
    });
    const result: ApiResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data;
  },

  createGroupInstance: async (data: {
    activityId: string;
    leaderUser: string;
    expireAt: string;
    status: string;
  }): Promise<any> => {
    // 转换数据格式以匹配服务器端期望的参数
    const requestData = {
      activityId: data.activityId,
      userId: data.leaderUser  // 将leaderUser映射为userId
    };
    const response = await apiRequest('POST', '/api/group-buying/create-instance', requestData);
    const result: ApiResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data;
  },

  // Presale methods
  getUserPresaleReservation: async (activityId: string, userId: string): Promise<any> => {
    const response = await fetch(`/api/presale/${activityId}/reservation/${userId}`);
    const result: ApiResponse = await response.json();
    
    if (result.code === 0 && result.data) {
      return result.data;
    }
    return null;
  },

  createPresaleReservation: async (data: {
    activityId: string;
    userId: string;
    qty: number;
  }): Promise<any> => {
    const response = await apiRequest('POST', '/api/presale/reservation', data);
    const result: ApiResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data;
  },
};

// Admin API functions
export const adminApi = {
  // Activities
  getActivities: async (filters?: {
    search?: string;
    type?: string;
    status?: string;
    cityId?: number;
  }): Promise<Activity[]> => {
    const searchParams = new URLSearchParams();
    if (filters?.search) searchParams.set('search', filters.search);
    if (filters?.type) searchParams.set('type', filters.type);
    if (filters?.status) searchParams.set('status', filters.status);
    if (filters?.cityId) searchParams.set('cityId', filters.cityId.toString());
    
    const url = `/admin/activities${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiRequest('GET', url);
    const result: ApiResponse<Activity[]> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data || [];
  },

  createActivity: async (data: any): Promise<Activity> => {
    const response = await apiRequest('POST', '/admin/activities', data);
    const result: ApiResponse<Activity> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data!;
  },

  updateActivity: async (id: string, data: any): Promise<Activity> => {
    const response = await apiRequest('PUT', `/admin/activities/${id}`, data);
    const result: ApiResponse<Activity> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data!;
  },

  deleteActivity: async (id: string): Promise<void> => {
    const response = await apiRequest('DELETE', `/admin/activities/${id}`);
    const result: ApiResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
  },

  // Cities
  getCities: async (): Promise<any[]> => {
    const response = await apiRequest('GET', '/admin/cities');
    const result: ApiResponse<any[]> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data || [];
  },

  // Stores
  getStores: async (filters?: {
    cityId?: number;
    search?: string;
  }): Promise<Store[]> => {
    const searchParams = new URLSearchParams();
    if (filters?.cityId) searchParams.set('cityId', filters.cityId.toString());
    if (filters?.search) searchParams.set('search', filters.search);
    
    const url = `/admin/stores${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiRequest('GET', url);
    const result: ApiResponse<Store[]> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data || [];
  },

  createStore: async (data: any): Promise<Store> => {
    const response = await apiRequest('POST', '/admin/stores', data);
    const result: ApiResponse<Store> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data!;
  },

  getStoreStaff: async (storeId: string): Promise<any[]> => {
    const response = await apiRequest('GET', `/admin/stores/${storeId}/staff`);
    const result: ApiResponse<any[]> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data || [];
  },

  // Redeems
  getRedeems: async (filters?: {
    storeId?: string;
    staffId?: string;
    activityId?: string;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (filters?.storeId) searchParams.set('storeId', filters.storeId);
    if (filters?.staffId) searchParams.set('staffId', filters.staffId);
    if (filters?.activityId) searchParams.set('activityId', filters.activityId);
    if (filters?.status) searchParams.set('status', filters.status);
    if (filters?.from) searchParams.set('from', filters.from);
    if (filters?.to) searchParams.set('to', filters.to);
    
    const url = `/admin/redeems${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiRequest('GET', url);
    const result: ApiResponse<any[]> = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data || [];
  },

  cancelRedeem: async (id: string, reason: string): Promise<void> => {
    const response = await apiRequest('POST', `/admin/redeems/${id}/cancel`, { reason });
    const result: ApiResponse = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
  },
};
