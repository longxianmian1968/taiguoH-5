import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 重定向到登录页
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 未认证用户不显示内容
  if (!isAuthenticated) {
    return null;
  }

  // 已认证用户显示内容
  return <>{children}</>;
}