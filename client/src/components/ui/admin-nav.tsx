import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';
import { 
  Activity, 
  Store, 
  Users, 
  BarChart3, 
  LogOut,
  Settings,
  Languages
} from 'lucide-react';

// Admin Navigation Layout Component
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, currentLang, switchLanguage } = useI18n();

  const navItems = [
    { path: '/admin/dashboard', label: t('admin.nav.dashboard', '总览仪表板'), icon: BarChart3 },
    { path: '/admin/activities', label: t('admin.nav.activities', '活动内容创建'), icon: Activity },
    { path: '/admin/stores', label: t('admin.nav.stores', '门店档案管理'), icon: Store },
    { path: '/admin/staff', label: t('admin.nav.staff', '员工权限管理'), icon: Users },
  ];

  const handleLanguageSwitch = () => {
    const newLang = currentLang === 'zh' ? 'th' : 'zh';
    switchLanguage(newLang);
  };

  const handleLogout = async () => {
    try {
      await fetch('/admin/api/logout', { method: 'POST' });
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-desktop px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard">
              <h1 className="text-xl font-bold text-gray-900">
                {t('system.management', 'H5营销系统管理后台')}
              </h1>
            </Link>

            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLanguageSwitch}
                data-testid="admin-language-toggle"
                className="relative"
              >
                <Languages className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  {currentLang === 'zh' ? '中文' : 'TH'}
                </span>
                <span className="text-xs opacity-60 ml-1">
                  | {currentLang === 'zh' ? 'TH' : '中文'}
                </span>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {t('nav.settings', '设置')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout', '退出登录')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-desktop px-6 py-3">
          <nav className="flex space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === path
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
}

// Mobile Navigation for Admin
export function AdminMobileNav() {
  const [location] = useLocation();

  const navItems = [
    { path: '/admin/dashboard', label: '总览', icon: BarChart3 },
    { path: '/admin/activities', label: '活动', icon: Activity },
    { path: '/admin/stores', label: '门店', icon: Store },
    { path: '/admin/staff', label: '员工', icon: Users },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link key={path} href={path}>
            <div
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs ${
                location === path
                  ? 'bg-primary text-white'
                  : 'text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span>{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}