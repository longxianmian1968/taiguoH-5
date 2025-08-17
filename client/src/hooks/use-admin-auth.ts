import { useState, useEffect } from 'react';

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 检查认证状态...');
      
      const response = await fetch('/admin/api/auth/status', {
        credentials: 'include'
      });
      
      console.log('📡 认证状态响应:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 认证状态数据:', data);
        
        if (data.isAuthenticated && data.user) {
          console.log('✅ 用户已认证:', data.user);
          setAuthState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true
          });
        } else {
          console.log('❌ 用户未认证');
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      } else {
        console.log('⚠️ 认证检查响应错误:', response.status);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('💥 认证检查异常:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  const login = async (username: string, password: string) => {
    console.log('🔑 开始登录请求...', { username });
    
    const response = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    console.log('📡 登录响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ 响应错误:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ 错误详情:', errorText);
      return { success: false, message: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const data = await response.json();
    console.log('📦 登录响应数据:', data);
    
    if (data.code === 0) {
      console.log('✅ 登录成功，设置用户状态:', data.data);
      setAuthState({
        user: data.data,
        isLoading: false,
        isAuthenticated: true
      });
      return { success: true };
    } else {
      console.log('⚠️ 登录失败:', data.message);
      return { success: false, message: data.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/admin/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    });
  };

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus
  };
}