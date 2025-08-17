import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Building2, User, Ticket } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { lineService } from '@/lib/line';
import { useState, useEffect } from 'react';

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { t } = useI18n();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Get user profile for coupon count
  useEffect(() => {
    async function getUserProfile() {
      try {
        const profile = await lineService.getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to get user profile:', error);
        // Fallback for development
        setUserProfile({
          userId: 'mock-user-id',
          displayName: '用户'
        });
      }
    }
    getUserProfile();
  }, []);

  // Get user's active coupons count
  const { data: coupons = [] } = useQuery({
    queryKey: ['/api/coupons', userProfile?.userId],
    queryFn: () => userProfile ? api.getUserCoupons(userProfile.userId) : [],
    enabled: !!userProfile,
  });

  // Count unread messages (new coupons, expiring coupons, used coupons)
  const getUnreadMessageCount = () => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    let unreadCount = 0;
    
    coupons.forEach((coupon: any) => {
      // 新领取的卡券（未读）
      if (!coupon.isRead && coupon.status === 'active') {
        unreadCount++;
      }
      
      // 即将过期的卡券（3天内过期且未读过期提醒）
      if (coupon.status === 'active' && coupon.expiresAt) {
        const expiresAt = new Date(coupon.expiresAt);
        if (expiresAt <= threeDaysFromNow && expiresAt > now) {
          // 检查是否已查看过期提醒（可以通过lastViewedAt是否在进入即将过期状态之后来判断）
          const lastViewed = coupon.lastViewedAt ? new Date(coupon.lastViewedAt) : null;
          const expiringThreshold = new Date(expiresAt.getTime() - 3 * 24 * 60 * 60 * 1000);
          if (!lastViewed || lastViewed < expiringThreshold) {
            unreadCount++;
          }
        }
      }
      
      // 最近核销的卡券（1天内核销且未读）
      if (coupon.status === 'used' && coupon.usedAt) {
        const usedAt = new Date(coupon.usedAt);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (usedAt >= oneDayAgo) {
          const lastViewed = coupon.lastViewedAt ? new Date(coupon.lastViewedAt) : null;
          if (!lastViewed || lastViewed < usedAt) {
            unreadCount++;
          }
        }
      }
    });
    
    return unreadCount;
  };

  const unreadMessageCount = getUnreadMessageCount();

  const navItems = [
    {
      path: '/home',
      label: t('nav.home', '首页'),
      icon: Home,
      testId: 'nav-home'
    },
    {
      path: '/brand',
      label: t('brand.title', '品牌'),
      icon: Building2,
      testId: 'nav-brand'
    },
    {
      path: '/profile',
      label: t('profile.title', '我的'),
      icon: User,
      testId: 'nav-profile',
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined
    }
  ];

  const isActive = (path: string) => {
    if (path === '/home') {
      return location === '/' || location === '/home';
    }
    return location === path;
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background border-t z-50"
      style={{ 
        paddingBottom: 'var(--safe-area-inset-bottom)',
        paddingLeft: 'var(--safe-area-inset-left)', 
        paddingRight: 'var(--safe-area-inset-right)'
      }}
      data-testid="bottom-nav"
    >
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-auto py-2 px-3 relative ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setLocation(item.path)}
              data-testid={item.testId}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.badge && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center bg-destructive"
                    data-testid={`${item.testId}-badge`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}