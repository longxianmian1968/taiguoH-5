import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Clock, CheckCircle2, XCircle, User, Gift } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { lineService } from '@/lib/line';
import { useLocation } from 'wouter';

// CouponCard component that mimics ActivityCard style
interface CouponCardProps {
  coupon: any;
  onClick: () => void;
}

function CouponCard({ coupon, onClick }: CouponCardProps) {
  const { t, currentLang } = useI18n();
  
  const getDisplayTitle = () => {
    if (currentLang === 'th' && coupon.activity?.titleTh) {
      return coupon.activity.titleTh;
    }
    return coupon.activity?.title || '';
  };

  const formatPrice = (price: string) => {
    return `฿${price}`;
  };

  const typeColors: Record<string, string> = {
    coupon: 'bg-red-500',
    group: 'bg-primary',
    presale: 'bg-orange-500',
    franchise: 'bg-purple-500',
  };

  // Check if coupon is expiring soon (within 3 days)
  const isExpiringSoon = () => {
    if (!coupon.validUntil) return false;
    const expiryDate = new Date(coupon.validUntil);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  };

  const getButtonText = () => {
    switch (coupon.status) {
      case 'used': return t('coupon.status.used', '已核销');
      case 'expired': return t('coupon.status.expired', '已过期');
      case 'active':
        if (isExpiringSoon()) {
          return t('coupon.status.expiring_soon', '即将过期');
        }
        return t('coupon.status.active', '可使用');
      default: return t('coupon.status.unknown', '未知状态');
    }
  };

  const getButtonColor = () => {
    switch (coupon.status) {
      case 'used': return 'bg-gray-500';        // 已核销：灰色
      case 'expired': return 'bg-yellow-500';   // 已过期：黄色
      case 'active':
        if (isExpiringSoon()) {
          return 'bg-orange-500';               // 即将过期：橙色
        }
        return 'bg-green-500';                  // 可使用：绿色
      default: return 'bg-gray-400';
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={onClick}
      data-testid={`coupon-card-${coupon.id}`}
    >
      {/* Image area - matches ActivityCard exactly */}
      <div className="relative w-full" style={{ height: '200px' }}>
        <img 
          src={coupon.activity?.coverUrl} 
          alt={getDisplayTitle()}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.upload-error')) {
              const errorText = t('error.image_load_failed', '图片加载失败');
              const reuploadText = t('error.please_reupload', '请重新上传');
              parent.innerHTML += `<div class="upload-error flex items-center justify-center h-full bg-red-50 border-2 border-dashed border-red-200 rounded">
                <div class="text-center text-red-600">
                  <div class="text-sm font-medium">${errorText}</div>
                  <div class="text-xs mt-1">${reuploadText}</div>
                </div>
              </div>`;
            }
          }}
        />
        
        {/* Status overlay for non-active coupons - lighter overlay */}
        {(coupon.status === 'used' || coupon.status === 'expired') && (
          <div className="absolute inset-0 bg-black/30"></div>
        )}
        
        {/* Activity type badge - top right */}
        <div className={`absolute top-2 right-2 ${typeColors[coupon.activity?.type] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm`}>
          {t(`activity.type.${coupon.activity?.type}`, coupon.activity?.type)}
        </div>
        
        {/* Status warning badges */}
        {coupon.status === 'active' && isExpiringSoon() && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm animate-pulse">
            {t('coupon.warning.expiring_soon', '即将过期')}
          </div>
        )}
        {coupon.status === 'expired' && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            {t('coupon.status.expired', '已过期')}
          </div>
        )}
        {coupon.status === 'used' && (
          <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            {t('coupon.status.used', '已核销')}
          </div>
        )}
        
        {/* Removed action button from image area - moved to content area */}
      </div>
      
      {/* Content area - matches ActivityCard exactly */}
      <div className="p-3" style={{ height: '120px' }}>
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 leading-tight" data-testid="coupon-title">
          {getDisplayTitle()}
        </h3>
        <div className="flex items-end justify-between mb-2">
          <div className="flex flex-col items-start">
            <span className="text-red-500 font-bold text-lg leading-none">
              {formatPrice(coupon.activity?.price || '0')}
            </span>
          </div>
        </div>
        
        {/* Status button and info in content area */}
        <div className="flex items-center justify-between">
          <button 
            className={`${getButtonColor()} text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm hover:opacity-90 transition-opacity ${
              coupon.status === 'used' || coupon.status === 'expired' ? 'opacity-80' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {getButtonText()}
          </button>
          
          {/* Status icon */}
          <div className="text-right">
            {coupon.status === 'used' && <CheckCircle2 className="w-4 h-4 text-gray-500" />}
            {coupon.status === 'expired' && <XCircle className="w-4 h-4 text-yellow-500" />}
            {coupon.status === 'active' && isExpiringSoon() && <Clock className="w-4 h-4 text-orange-500" />}
            {coupon.status === 'active' && !isExpiringSoon() && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          </div>
        </div>
        
        {/* Expiry info - compact version */}
        <div className="text-xs text-gray-400 mt-1">
          {coupon.validUntil && coupon.status === 'expired' && (
            <span>
              {t('coupon.expired_on', '已于') + ' ' + new Date(coupon.validUntil).toLocaleDateString() + ' ' + t('coupon.expired', '过期')}
            </span>
          )}
          {coupon.status === 'used' && coupon.usedAt && (
            <span>
              {t('coupon.used_on', '已于') + ' ' + new Date(coupon.usedAt).toLocaleDateString() + ' ' + t('coupon.redeemed', '核销')}
            </span>
          )}
          {coupon.status === 'active' && coupon.validUntil && (
            <span>
              {t('coupon.valid_until', '有效期至') + ' ' + new Date(coupon.validUntil).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t, currentLang, switchLanguage } = useI18n();
  const [, setLocation] = useLocation();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'coupons' | 'orders'>('coupons');
  const queryClient = useQueryClient();

  // Mark coupons as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (userId: string) => 
      fetch(`/api/users/${userId}/coupons/mark-read`, { method: 'POST' })
        .then(res => res.json()),
    onSuccess: () => {
      // Invalidate coupons query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/users/coupons'] });
    }
  });

  // Initialize LINE and get user profile
  useEffect(() => {
    const initializeUser = async () => {
      try {
        await lineService.init();
        const profile = await lineService.getProfile();
        setUserProfile(profile);
        
        // Mark coupons as read when user visits profile page
        if (profile?.userId) {
          markAsReadMutation.mutate(profile.userId);
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
        const fallbackProfile = {
          userId: 'mock-line-user-id',
          displayName: '测试用户',
          pictureUrl: null,
          statusMessage: '欢迎使用LINE营销系统'
        };
        setUserProfile(fallbackProfile);
        
        // Mark coupons as read for fallback user
        markAsReadMutation.mutate(fallbackProfile.userId);
      }
    };

    initializeUser();
  }, []);

  // Fetch user coupons
  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ['/api/users/coupons', userProfile?.userId],
    queryFn: () => userProfile ? api.getUserCoupons(userProfile.userId) : [],
    enabled: !!userProfile,
  });

  // Fetch user's redeems (order history)
  const { data: redeems = [], isLoading: redeemsLoading } = useQuery({
    queryKey: ['/api/redeems', userProfile?.userId],
    queryFn: () => userProfile ? api.getUserRedeems(userProfile.userId) : [],
    enabled: !!userProfile,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'used': return <CheckCircle2 className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };



  return (
    <div className="min-h-screen bg-background pb-20" data-testid="profile-page">
      {/* Header */}
      <header 
        className="sticky top-0 bg-background z-40 border-b mobile-header"
        style={{ 
          paddingTop: 'var(--safe-area-inset-top)',
          paddingLeft: 'var(--safe-area-inset-left)', 
          paddingRight: 'var(--safe-area-inset-right)'
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary" data-testid="profile-title">
                {t('profile.title', '我的')}
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="profile-subtitle">
                {t('profile.subtitle', '个人中心')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* User Profile Section */}
        <Card className="mb-6" data-testid="user-profile-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {userProfile?.pictureUrl ? (
                  <img 
                    src={userProfile.pictureUrl} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold" data-testid="user-name">
                  {userProfile?.displayName || t('profile.loading', '加载中...')}
                </h2>
                <p className="text-muted-foreground" data-testid="user-status">
                  {userProfile?.statusMessage || t('profile.welcome', '欢迎使用LINE营销系统')}
                </p>
                <p className="text-xs text-muted-foreground mt-1" data-testid="line-info">
                  {t('profile.line_synced', 'LINE账户同步')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-3 justify-center">
            <Button
              variant={activeTab === 'coupons' ? 'default' : 'outline'}
              onClick={() => setActiveTab('coupons')}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-base font-medium rounded-xl"
              data-testid="tab-coupons"
            >
              <Gift className="w-5 h-5" />
              {t('profile.my_coupons', '我的卡券')}
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              onClick={() => setActiveTab('orders')}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-base font-medium rounded-xl"
              data-testid="tab-orders"
            >
              <Ticket className="w-4 h-4" />
              {t('profile.my_orders', '我的订单')}
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'coupons' && (
          <Card className="mb-6" data-testid="my-coupons-card">
            <CardContent className="pt-6">
            {couponsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">{t('common.loading', '加载中...')}</div>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('profile.no_coupons', '暂无卡券')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3" data-testid="coupons-grid">
                {coupons.map((coupon: any) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onClick={() => setLocation(`/activities/${coupon.activity.id}?coupon=${coupon.code}`)}
                    data-testid={`coupon-${coupon.id}`}
                  />
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'orders' && (
          <Card data-testid="order-history-card">
            <CardContent className="pt-6">
              {redeemsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">{t('common.loading', '加载中...')}</div>
                </div>
              ) : redeems.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('profile.no_orders', '暂无订单记录')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redeems.map((redeem: any) => (
                    <div key={redeem.id} className="border rounded-lg p-4" data-testid={`order-${redeem.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg" data-testid="order-title">
                            {redeem.activity?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1" data-testid="order-store">
                            {t('profile.used_at_store', '使用门店')}: {redeem.store?.name}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid="order-date">
                            {t('profile.verified_at', '核销时间')}: {new Date(redeem.verifiedAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800" data-testid="order-status">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {t('status.verified', '已核销')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}