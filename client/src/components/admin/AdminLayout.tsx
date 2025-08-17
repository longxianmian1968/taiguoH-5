import { Link, useLocation } from 'wouter';
import { useI18n } from '@/contexts/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Store, 
  Users, 
  Receipt, 
  BarChart3, 
  Languages,
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useI18n();
  const [location] = useLocation();
  
  const navigation = [
    {
      name: t('nav.dashboard', '仪表板'),
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      current: location === '/admin/dashboard' || location === '/dashboard'
    },
    {
      name: t('nav.activities', '活动管理'),
      href: '/admin/activities',
      icon: CalendarDays,
      current: location === '/admin/activities'
    },
    {
      name: t('nav.stores', '门店管理'),
      href: '/admin/stores',
      icon: Store,
      current: location === '/admin/stores'
    },
    {
      name: t('nav.staff', '员工管理'),
      href: '/admin/staff',
      icon: Users,
      current: location === '/admin/staff'
    },
    {
      name: t('nav.redeems', '核销记录'),
      href: '/admin/redeems',
      icon: Receipt,
      current: location === '/admin/redeems'
    },
    {
      name: t('nav.statistics', '数据统计'),
      href: '/admin/statistics',
      icon: BarChart3,
      current: location === '/admin/statistics'
    },
    {
      name: t('nav.i18n', '多语言管理'),
      href: '/admin/i18n',
      icon: Languages,
      current: location === '/admin/i18n'
    }
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch('/admin/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H5</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {t('system.title', 'H5营销系统')}
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      item.current
                        ? 'bg-emerald-100 text-emerald-900 border-r-2 border-emerald-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer'
                    )}
                    data-testid={`nav-${item.href.split('/').pop()}`}
                  >
                    <Icon
                      className={cn(
                        item.current ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                    />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              data-testid="button-logout"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {t('nav.logout', '退出登录')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}