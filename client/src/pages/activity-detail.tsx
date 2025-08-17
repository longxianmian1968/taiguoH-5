import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { useGeolocation } from '@/hooks/use-geolocation';
import { lineService } from '@/lib/line';
import { api, type Activity, type Store } from '@/lib/api';
import NearbySheet from '@/components/ui/nearby-sheet';
import { Share2, MapPin, Clock, Package, ChevronDown, ChevronUp, QrCode, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export default function ActivityDetailPage() {
  const [, params] = useRoute('/activities/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, currentLang } = useI18n();
  const { position, error: locationError, requestLocation } = useGeolocation();
  
  // State management - 确保所有hooks在组件顶部
  const [nearbySheetOpen, setNearbySheetOpen] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [userCoupon, setUserCoupon] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activityId = params?.id;
  
  // Check if this is accessed from a coupon (user already has this coupon)
  const isFromCoupon = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('coupon');

  // Initialize LINE LIFF
  useEffect(() => {
    lineService.init().catch(console.error);
  }, []);

  // Track page view
  useEffect(() => {
    if (activityId && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'evt_detail_view', {
        activity_id: activityId,
        lang: currentLang,
      });
    }
  }, [activityId, currentLang]);

  // Fetch activity details with language support
  const { data: rawActivity, isLoading, error } = useQuery({
    queryKey: ['/api/activities', activityId],
    queryFn: async () => {
      if (!activityId) throw new Error('Activity ID is required');
      
      const params: any = {};
      if (position) {
        params.lat = position.lat;
        params.lng = position.lng;
      }
      
      return await api.getActivity(activityId, params);
    },
    enabled: !!activityId,
    retry: 3,
    staleTime: 1000 * 60 * 5 // 5分钟缓存
  });

  // Get activity with language support
  const activity = rawActivity;

  // Fetch module-specific data based on activity type
  const { data: groupConfig } = useQuery({
    queryKey: ['/api/activities', activityId, 'group-config'],
    queryFn: async () => {
      if (!activityId || activity?.type !== 'group') return null;
      const response = await fetch(`/api/activities/${activityId}/group-config`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!activityId && activity?.type === 'group',
  });

  const { data: groupInstances } = useQuery({
    queryKey: ['/api/activities', activityId, 'group-instances'],
    queryFn: async () => {
      if (!activityId || activity?.type !== 'group') return null;
      const response = await fetch(`/api/activities/${activityId}/group-instances`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!activityId && activity?.type === 'group',
  });

  // 自动轮播效果 - 在activity数据获取后启动
  useEffect(() => {
    const images = (activity as any)?.coverUrls || [];
    if (!Array.isArray(images) || images.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    }, 4000); // 4秒自动切换

    return () => clearInterval(interval);
  }, [(activity as any)?.coverUrls, isTransitioning]);

  // Check if user has coupon for this activity
  useEffect(() => {
    const checkUserCoupon = async () => {
      if (!activityId) return;
      
      try {
        const user = lineService.getCurrentUser();
        if (!user) return;
        
        const coupons = await api.getUserCoupons(user.userId);
        const activityCoupon = coupons.find((c: any) => 
          c.activityId === activityId && c.status === 'active'
        );
        setUserCoupon(activityCoupon);
      } catch (error) {
        console.error('Failed to check user coupon:', error);
      }
    };

    checkUserCoupon();
  }, [activityId]);

  // Claim coupon mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!activityId) throw new Error('Activity ID is required');
      
      const user = lineService.getCurrentUser();
      if (!user) {
        await lineService.login();
        return;
      }

      return await api.claimCoupon({
        activityId,
        userId: user.userId,
      });
    },
    onSuccess: (coupon) => {
      if (coupon) {
        setUserCoupon(coupon);
        toast({
          title: t('success.coupon_claimed', '领取成功'),
          description: t('success.coupon_claimed_desc', `券码：${coupon.code}`),
        });
        
        // Track successful claim
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'cta_purchase_success', {
            activity_id: activityId,
            coupon_code: coupon.code,
          });
        }
      }
    },
    onError: (error) => {
      toast({
        title: t('error.claim_failed', '领取失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Get nearby stores
  const fetchNearbyStores = async () => {
    if (!activityId || !position) return;

    try {
      const stores = await api.getActivityStoresNearby(activityId, {
        lat: position.lat,
        lng: position.lng,
        limit: 3,
      });
      
      setNearbyStores(stores);
      setNearbySheetOpen(true);
      
      // Track nearby stores shown
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'nearby_shown', {
          activity_id: activityId,
          stores_count: stores.length,
        });
      }
    } catch (error) {
      toast({
        title: t('error.nearby_failed', '获取附近门店失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // Event handlers
  const handleShare = async () => {
    if (!activity) return;

    try {
      const result = await lineService.shareActivity(activity.id, getDisplayTitle());
      
      // Track share event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'share_click', {
          activity_id: activity.id,
          method: result.method,
        });
      }
      
      // 根据分享方法显示不同的成功消息
      if (result.method === 'line_native') {
        toast({
          title: t('success.shared', '分享成功'),
          description: t('success.shared_desc', '活动已分享到LINE'),
        });
      } else if (result.method === 'web_share') {
        toast({
          title: t('success.shared', '分享成功'),
          description: t('success.web_shared_desc', '活动已通过系统分享'),
        });
      } else {
        toast({
          title: t('success.copied', '已复制活动链接'),
          description: t('success.copied_desc', '链接已复制到剪贴板，可手动分享到LINE'),
        });
      }
    } catch (error) {
      console.error('Share completely failed:', error);
      toast({
        title: t('error.share_failed', '分享失败'),
        description: t('error.share_failed_desc', '请手动复制链接分享'),
        variant: 'destructive',
      });
    }
  };

  const handleClaim = () => {
    // Track CTA click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cta_purchase_click', {
        activity_id: activityId,
      });
    }
    
    // 根据活动类型执行不同的操作
    switch (activity?.type) {
      case 'coupon':
        claimMutation.mutate();
        break;
      case 'group':
        handleCreateGroup();
        break;
      case 'presale':
        handlePresaleReservation();
        break;
      case 'franchise':
        handleFranchiseInquiry();
        break;
      default:
        claimMutation.mutate();
    }
  };

  // 发起团购组团逻辑
  const handleCreateGroup = async () => {
    try {
      // 确保LINE服务已初始化并获取用户信息
      await lineService.init();
      let user = lineService.getCurrentUser();
      
      if (!user) {
        user = await lineService.login();
        if (!user) {
          // 如果仍然没有用户，使用mock用户
          user = {
            userId: 'mock-line-user-id',
            displayName: 'Mock User',
          };
        }
      }

      // 导航到组团分享页面
      setLocation(`/group-share/${activityId}`);
      
    } catch (error) {
      toast({
        title: t('error.create_group_failed', '发起组团失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // 参与现有团购逻辑
  const handleGroupJoin = async () => {
    try {
      // 确保LINE服务已初始化
      await lineService.init();
      let user = lineService.getCurrentUser();
      
      if (!user) {
        user = await lineService.login();
        if (!user) {
          // 如果仍然没有用户，使用mock用户
          user = {
            userId: 'mock-line-user-id',
            displayName: 'Mock User',
          };
        }
      }

      // 检查是否已有进行中的团购实例
      const existingGroup = groupInstances?.data?.find((group: any) => 
        group.status === 'pending' && 
        group.members?.some((member: any) => member.userId === user.userId)
      );

      if (existingGroup) {
        toast({
          title: t('group.already_joined', '您已参与此团购'),
          description: t('group.wait_for_complete', '等待成团中...'),
          variant: 'destructive',
        });
        return;
      }

      // 创建新团购实例或加入现有团购
      const result = await api.joinGroupBuying(activityId, user.userId);
      
      toast({
        title: t('group.join_success', '参团成功'),
        description: t('group.join_success_desc', '等待其他用户参团中...'),
      });
      
      // 刷新团购实例数据
      queryClient.invalidateQueries({ queryKey: ['/api/activities', activityId, 'group-instances'] });
      
    } catch (error) {
      toast({
        title: t('error.group_join_failed', '参团失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // 预售预约逻辑
  const handlePresaleReservation = async () => {
    try {
      const user = lineService.getCurrentUser();
      if (!user) {
        await lineService.login();
        return;
      }

      // 检查是否已有预约
      const existingReservation = await api.getUserPresaleReservation(activityId, user.userId);
      if (existingReservation) {
        toast({
          title: t('presale.already_reserved', '您已预约此商品'),
          description: t('presale.check_status', '请在个人中心查看预约状态'),
          variant: 'destructive',
        });
        return;
      }

      // 创建预约
      const reservation = await api.createPresaleReservation({
        activityId,
        userId: user.userId,
        qty: 1
      });
      
      toast({
        title: t('presale.reservation_success', '预约成功'),
        description: t('presale.reservation_success_desc', '商品到店后将通过LINE通知您'),
      });
      
    } catch (error) {
      toast({
        title: t('error.presale_failed', '预约失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // 招商咨询逻辑
  const handleFranchiseInquiry = () => {
    // 暂时通过分享功能让用户获取更多信息
    toast({
      title: t('franchise.inquiry_sent', '咨询已记录'),
      description: t('franchise.contact_soon', '工作人员将通过LINE联系您'),
    });
  };

  const handleNearbyClick = () => {
    // Track nearby click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'nearby_click', {
        activity_id: activityId,
      });
    }

    if (!position) {
      if (locationError) {
        toast({
          title: t('error.location_failed', '无法获取定位'),
          description: t('error.location_failed_desc', '请在设置中开启定位或稍后重试'),
          variant: 'destructive',
        });
      } else {
        requestLocation();
      }
      return;
    }

    fetchNearbyStores();
  };

  const handleNavigation = (store: Store) => {
    if (store.mapsUrl) {
      lineService.openExternalBrowser(store.mapsUrl);
    }
    setNearbySheetOpen(false);
  };

  const handleRulesToggle = () => {
    setRulesExpanded(!rulesExpanded);
    
    // Track rules toggle
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'rules_toggle', {
        activity_id: activityId,
        expanded: !rulesExpanded,
      });
    }
  };



  // Generate activity QR code - Shows QR code only when user has claimed coupon
  const generateActivityQRCode = () => {
    if (!userCoupon) {
      return null; // 没有券码时不显示QR码
    }

    // 有券码时，生成扫码核销链接
    // 店员使用LINE扫码功能扫描后，会访问这个URL进行核销
    const domains = import.meta.env.VITE_REPLIT_DOMAINS || 'localhost:5000';
    const domain = domains.split(',')[0];
    
    // 构建扫码核销URL，包含券码和必要参数
    const redeemUrl = `https://${domain}/api/redeem/${userCoupon.code}?utm_source=qr_scan&activity_id=${activity?.id}`;
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(redeemUrl)}`;
  };

  // Legacy function for compatibility
  const generateQRCode = (code: string) => generateActivityQRCode();

  // Format time remaining
  const formatTimeRemaining = (endAt: string) => {
    const end = new Date(endAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return t('time.expired', '已结束');
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}${t('time.day', '天')}${hours}${t('time.hour', '小时')}`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}${t('time.hour', '小时')}${minutes}${t('time.minute', '分钟')}`;
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return `฿${price}`;
  };

  const getDisplayTitle = () => {
    if (currentLang === 'th' && activity?.titleTh) {
      return activity.titleTh;
    }
    return activity?.title || '';
  };

  const getDisplayRules = () => {
    if (currentLang === 'th' && activity?.rulesTh) {
      return activity.rulesTh;
    }
    return activity?.rules || '';
  };

  // Check if user can participate in claiming (but can still view nearby stores)
  const canParticipate = activity?.coverage?.canParticipate !== false;
  
  // User cannot claim if they already have an active coupon for this activity
  const hasActiveCoupon = !window.location.search.includes('debug=no-coupon') && userCoupon && userCoupon.status === 'active';
  const canClaim = canParticipate && !isFromCoupon && !hasActiveCoupon;

  // Get CTA button text
  const getCtaText = () => {
    if (isFromCoupon || hasActiveCoupon) {
      return t('button.already_claimed', '已领取');
    }
    if (!canParticipate) {
      return t('error.area_not_supported', '你所在地区暂不支持');
    }
    
    switch (activity?.type) {
      case 'coupon':
        return t('button.claim', '立即领取');
      case 'group':
        return t('button.create_group');
      case 'presale':
        return t('button.presale', '立即预订');
      case 'franchise':
        return t('button.franchise', '了解详情');
      default:
        return t('button.claim', '立即领取');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50">
        {/* Hero skeleton */}
        <Skeleton className="w-full h-64" />
        
        {/* Content skeleton */}
        <div className="bg-white px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-12" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // Production ready - debug logs removed



  // Error state
  if (error || !activity) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-4" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-secondary mb-2">
            {t('error.activity_not_found', '活动不存在')}
          </h2>
          <p className="text-tertiary mb-4">
            {error?.message || t('error.activity_not_found_desc', '该活动可能已下架或不存在')}
          </p>
          <Button 
            onClick={() => setLocation('/brand')}
            className="btn-responsive btn-primary"
          >
            {t('common.back_home', '返回首页')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Hero Cover - 多图轮播 */}
      <div className="relative">
        <div 
          data-testid="hero-img"
          className="aspect-square bg-gradient-to-br from-primary to-green-700 relative overflow-hidden"
        >
{/* 图片展示区域 */}
          {activity && (
            <img 
              src={(activity as any)?.coverUrls?.length > 0 ? (activity as any).coverUrls[currentImageIndex] : activity.coverUrl} 
              alt={`${activity.title} - ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: isTransitioning ? 0.7 : 1 }}
            />
          )}
          
          {/* 左右切换按钮 - 仅在多图时显示 */}
          {(activity as any)?.coverUrls?.length > 1 && (
            <>
              <Button
                onClick={() => {
                  const images = (activity as any).coverUrls;
                  if (!isTransitioning && images.length > 1) {
                    setIsTransitioning(true);
                    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    setTimeout(() => setIsTransitioning(false), 300);
                  }
                }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center p-0 hover:bg-white transition-all duration-200"
                style={{ fontSize: 0 }}
              >
                <ChevronLeft className="w-4 h-4 text-secondary" />
              </Button>
              
              <Button
                onClick={() => {
                  const images = (activity as any).coverUrls;
                  if (!isTransitioning && images.length > 1) {
                    setIsTransitioning(true);
                    setCurrentImageIndex((prev) => (prev + 1) % images.length);
                    setTimeout(() => setIsTransitioning(false), 300);
                  }
                }}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center p-0 hover:bg-white transition-all duration-200"
                style={{ fontSize: 0 }}
              >
                <ChevronRight className="w-4 h-4 text-secondary" />
              </Button>
            </>
          )}
          
          {/* 底部圆点指示器 - 仅在多图时显示 */}
          {(activity as any)?.coverUrls?.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {(activity as any).coverUrls.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isTransitioning && index !== currentImageIndex) {
                      setIsTransitioning(true);
                      setCurrentImageIndex(index);
                      setTimeout(() => setIsTransitioning(false), 300);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white bg-opacity-50'
                  }`}
                  aria-label={`查看第 ${index + 1} 张图片`}
                />
              ))}
            </div>
          )}
          
          {/* 图片计数器 - 仅在多图时显示 */}
          {(activity as any)?.coverUrls?.length > 1 && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-medium">
              {currentImageIndex + 1} / {(activity as any).coverUrls.length}
            </div>
          )}
          
          <Button
            onClick={handleShare}
            className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center p-0"
          >
            <Share2 className="w-5 h-5 text-secondary" />
          </Button>
        </div>
      </div>

      {/* Activity Information */}
      <div className="bg-white px-4 py-6">
        <h1 data-testid="title" className="text-xl font-bold text-secondary mb-4 text-center">
          {getDisplayTitle()}
        </h1>
        
        <div data-testid="price" className="mb-4">
          {/* 原价放在现价上方 */}
          {activity.listPrice && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-tertiary line-through">
                {formatPrice(activity.listPrice)}
              </span>
            </div>
          )}
          {/* 现价和折扣标签在同一行 */}
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(activity.price)}
            </span>
            {activity.listPrice && (activity as any).discount && (
              <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded">
                {t('discount.limited_time', '限时')}
                {(activity as any).discount} {t('discount.suffix', '折')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-tertiary" />
            <span className="text-sm text-tertiary">{t('form.quantity', '数量')}</span>
            <span className="text-sm font-medium text-secondary">
              {t('quantity.remaining', '剩余')} {activity.quantity} {t('quantity.unit', '份')}
            </span>
          </div>
          <div data-testid="countdown" className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-tertiary" />
            <span className="text-sm text-tertiary">{t('time.remaining', '剩余时间')}</span>
            <span className="text-sm font-medium text-red-600">
              {formatTimeRemaining(activity.endAt)}
            </span>
          </div>
        </div>

        {/* Geographic Restriction Notice */}
        {!canParticipate && activity.coverage?.cities && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-orange-800">
              {t('restriction.cities', '本活动仅在：')}
              {activity.coverage.cities.join('、')} 
              {t('restriction.available', ' 可用')}
            </p>
          </div>
        )}

        {/* Module-specific Information */}
        {activity.type === 'group' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('group.info_title')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-blue-700 font-medium">{t('group.required_people')}:</span>
                <span className="ml-2 text-blue-900 font-bold">{groupConfig?.data?.nRequired || 3}{t('group.people_unit')}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">{t('group.time_limit')}:</span>
                <span className="ml-2 text-blue-900 font-bold">{groupConfig?.data?.timeLimitHours || 24}{t('group.hours_unit')}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">{t('group.use_valid')}:</span>
                <span className="ml-2 text-blue-900 font-bold">{groupConfig?.data?.useValidHours || 72}{t('group.hours_unit')}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">{t('group.cross_store')}:</span>
                <span className="ml-2 text-blue-900 font-bold">
                  {groupConfig?.data?.allowCrossStore ? t('common.yes') : t('common.no')}
                </span>
              </div>
            </div>
            
            {/* 团购实例展示 */}
            {groupInstances?.data?.length > 0 && (
              <div className="border-t border-blue-200 pt-4">
                <h4 className="font-medium text-blue-900 mb-3">{t('group.ongoing')}</h4>
                <div className="space-y-3">
                  {groupInstances.data.slice(0, 3).map((group: any) => {
                    const requiredCount = groupConfig?.data?.nRequired || 3;
                    const currentCount = group.memberCount || 0;
                    const progress = (currentCount / requiredCount) * 100;
                    const timeLeft = group.timeLeft || 0;
                    
                    // 使用后端计算的实际状态
                    const actualStatus = group.actualStatus || group.status;
                    
                    return (
                      <div key={group.id} className="bg-white rounded-lg p-3 border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-blue-900">
                            {t('group.progress').replace('{{current}}', currentCount.toString()).replace('{{total}}', requiredCount.toString())}
                          </span>
                          <span className="text-xs text-blue-600">
                            {actualStatus === 'success' ? t('group.completed') : 
                             actualStatus === 'failed' ? t('group.expired') :
                             timeLeft > 0 ? t('group.hours_remaining').replace('{{hours}}', Math.ceil(timeLeft/3600).toString()) : t('group.expired')}
                          </span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              actualStatus === 'success' ? 'bg-green-500' : 
                              actualStatus === 'failed' ? 'bg-red-500' : 
                              'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-600">
                            {actualStatus === 'success' ? t('group.completed') : 
                             actualStatus === 'failed' ? t('group.failed') :
                             currentCount >= requiredCount ? t('group.ready') : 
                             t('group.recruiting')}
                          </span>
                          {actualStatus === 'pending' && currentCount < requiredCount && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleGroupJoin()}
                            >
                              {t('group.join_group')}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {groupInstances.data.filter((g: any) => g.status === 'pending').length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-blue-600 text-sm mb-2">{t('group.no_active')}</p>
                    <p className="text-blue-500 text-xs">{t('group.start_new')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Incentive Message for unclaimed users */}
        {!hasActiveCoupon && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <QrCode className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 font-medium text-sm">
                  {t('incentive.claim_limit', '限领1张，领取后可获取专属核销码！')}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  {t('incentive.usage_desc', '到店出示核销码即可享受优惠')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Button Area - Moved after module-specific information */}
        <div className="flex gap-3 mb-6">
          <Button
            data-testid="btn-claim"
            onClick={handleClaim}
            disabled={!canClaim || claimMutation.isPending}
            className={`flex-1 btn-mobile font-semibold transition-colors ${
              canClaim 
                ? 'btn-primary hover:bg-green-700' 
                : 'btn-disabled cursor-not-allowed'
            }`}
          >
            {claimMutation.isPending ? t('common.loading', '处理中...') : getCtaText()}
          </Button>
          <Button
            data-testid="btn-nearby"
            onClick={handleNearbyClick}
            disabled={!canParticipate}
            className={`flex-1 btn-mobile font-medium transition-colors ${
              canParticipate
                ? 'border border-primary text-primary hover:bg-primary hover:text-white'
                : 'btn-disabled cursor-not-allowed'
            }`}
            variant="outline"
          >
            <MapPin className="w-4 h-4 mr-1" />
            {t('button.activity_stores', '活动门店')}
          </Button>
        </div>

        {activity.type === 'presale' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('presale.info_title', '预售信息')}
            </h3>
            <div className="text-sm text-orange-800 mb-4">
              <p className="mb-2">
                <span className="font-medium">{t('presale.delivery_time', '预计到货时间')}:</span>
                <span className="ml-2">{t('presale.delivery_desc', '活动结束后7-15个工作日')}</span>
              </p>
              <p className="mb-2">
                <span className="font-medium">{t('presale.pickup_notice', '到货通知')}:</span>
                <span className="ml-2">{t('presale.pickup_desc', '商品到店后将通过LINE消息通知您')}</span>
              </p>
              <p className="mb-2">
                <span className="font-medium">{t('presale.pickup_time', '提货时限')}:</span>
                <span className="ml-2">{t('presale.pickup_time_desc', '到货通知后7天内到店提货')}</span>
              </p>
              <p className="text-orange-700 font-medium">
                {t('presale.pickup_reminder', '⚠️ 请确保您的LINE账号能正常接收消息')}
              </p>
            </div>
            
            {/* 预售状态展示 */}
            <div className="border-t border-orange-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-orange-900">{t('presale.stock_status', '预售状态')}</span>
                <span className="text-sm text-orange-600">
                  {t('presale.reserved_count', '已预约')}: {activity.claimedCount || 0} / {activity.quantity}
                </span>
              </div>
              
              {/* 预售进度条 */}
              <div className="w-full bg-orange-100 rounded-full h-3 mb-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(((activity.claimedCount || 0) / activity.quantity) * 100, 100)}%` 
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-orange-700">
                <div>
                  <span className="font-medium">{t('presale.remaining_stock', '剩余数量')}:</span>
                  <span className="ml-1 text-orange-900 font-bold">
                    {Math.max(0, activity.quantity - (activity.claimedCount || 0))}
                  </span>
                </div>
                <div>
                  <span className="font-medium">{t('presale.reservation_rate', '预约率')}:</span>
                  <span className="ml-1 text-orange-900 font-bold">
                    {Math.round(((activity.claimedCount || 0) / activity.quantity) * 100)}%
                  </span>
                </div>
              </div>
              
              {(activity.claimedCount || 0) >= activity.quantity && (
                <div className="mt-3 bg-orange-100 border border-orange-300 rounded-lg p-2 text-center">
                  <p className="text-orange-800 font-medium text-sm">
                    {t('presale.sold_out', '预约已满，等待补货中...')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activity.type === 'franchise' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              {t('franchise.info_title', '招商信息')}
            </h3>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>{t('franchise.benefit_1', '提供完整的品牌授权和运营指导')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>{t('franchise.benefit_2', '专业的市场推广和营销支持')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>{t('franchise.benefit_3', '完善的培训体系和持续服务')}</span>
              </div>
              <p className="text-green-700 font-medium bg-green-100 p-2 rounded">
                {t('franchise.contact_info', '📞 点击"了解详情"填写意向表单，我们将在24小时内联系您')}
              </p>
            </div>
          </div>
        )}





        {/* QR Code Section - Only show after user claims coupon */}
        {userCoupon && (
          <div className="border-t pt-6 mt-6" data-testid="qr-section">
            {/* Coupon Status Banner */}
            {userCoupon.status !== 'active' && (
              <div className={`mb-4 p-4 rounded-lg border-2 ${
                userCoupon.status === 'used' 
                  ? 'bg-gray-50 border-gray-300 text-gray-700'
                  : 'bg-yellow-50 border-yellow-300 text-yellow-700'
              }`}>
                <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                  {userCoupon.status === 'used' ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-gray-600" />
                      <span>{t('coupon.status.used', '优惠券已核销')}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-yellow-600" />
                      <span>{t('coupon.status.expired', '优惠券已过期')}</span>
                    </>
                  )}
                </div>
                {userCoupon.status === 'used' && userCoupon.usedAt && (
                  <p className="text-center text-sm mt-2 text-gray-600">
                    {t('coupon.used_on', '核销时间：') + new Date(userCoupon.usedAt).toLocaleString()}
                  </p>
                )}
                {userCoupon.status === 'expired' && userCoupon.validUntil && (
                  <p className="text-center text-sm mt-2 text-yellow-600">
                    {t('coupon.expired_on', '过期时间：') + new Date(userCoupon.validUntil).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            
            <div className={`rounded-lg p-4 mb-4 ${
              userCoupon.status === 'active' ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
            }`}>
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
                {t('qr.title', '二维码核销')}
              </h3>
              
              <div className="text-center">
                <div className={`bg-white rounded-lg p-4 inline-block shadow-sm mb-3 ${
                  userCoupon.status !== 'active' ? 'grayscale opacity-50' : ''
                }`}>
                  {userCoupon.status === 'active' ? (
                    <img
                      src={generateActivityQRCode() || ''}
                      alt={t('activity.qr_alt', '活动二维码')}
                      className="w-40 h-40 mx-auto"
                      data-testid="qr-code-image"
                      onError={(e) => {
                        console.error('QR Code failed to load:', generateActivityQRCode());
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('QR Code loaded successfully:', generateActivityQRCode());
                      }}
                    />
                  ) : (
                    <div className="w-40 h-40 mx-auto flex items-center justify-center bg-gray-100 text-gray-400">
                      <div className="text-center">
                        <XCircle className="w-16 h-16 mx-auto mb-2" />
                        <p className="text-sm">
                          {userCoupon.status === 'used' ? t('coupon.qr_used', '已核销') : t('coupon.qr_expired', '已过期')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-sm mb-3 ${
                  userCoupon.status === 'active' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {userCoupon.status === 'active' 
                    ? t('qr.scan_instruction', '门店员工扫描此二维码进行核销')
                    : t('qr.inactive', '二维码无法使用')
                  }
                </p>
                
                {/* Manual code section */}
                <div className={`bg-white rounded-lg border-2 p-4 mt-4 ${
                  userCoupon.status === 'active' 
                    ? 'border-primary/20' 
                    : 'border-gray-300 opacity-60'
                }`}>
                  <div className="text-center">
                    <p className={`text-sm mb-3 ${
                      userCoupon.status === 'active' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {t('verification.manual_code', '手动核销码')}
                    </p>
                    
                    <div className="text-center">
                      <p className={`text-3xl font-mono font-bold tracking-wider p-3 rounded-lg ${
                        userCoupon.status === 'active' 
                          ? 'text-primary bg-gray-50' 
                          : 'text-gray-400 bg-gray-100'
                      }`}>
                        {userCoupon.code}
                      </p>
                      <p className={`text-xs mt-2 ${
                        userCoupon.status === 'active' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {userCoupon.status === 'active' 
                          ? t('verification.show_to_staff', '向店员出示此核销码')
                          : t('verification.code_inactive', '此核销码已无法使用')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rules Section */}
        {((currentLang === 'th' && activity.rulesTh) || activity.rules) && (
          <div className="border-t pt-4 mt-6" data-testid="rules-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-secondary">{t('rules.title', '使用规则')}</h3>
              <Button
                onClick={handleRulesToggle}
                variant="ghost"
                size="sm"
                className="text-primary text-sm p-0 h-auto"
                data-testid="rules-toggle"
              >
                {rulesExpanded ? (
                  <>
                    {t('common.collapse', '收起')}
                    <ChevronUp className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    {t('common.expand', '展开')}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
            <div 
              className={`text-sm text-gray-600 space-y-2 ${
                rulesExpanded ? '' : 'line-clamp-3 overflow-hidden'
              }`}
              data-testid="rules-content"
            >
              {getDisplayRules() && getDisplayRules().split('\n').map((rule: string, index: number) => (
                <p key={index} className="leading-relaxed">{rule}</p>
              ))}
            </div>
          </div>
        )}

        {/* Bottom padding for fixed buttons */}
        <div className="h-24"></div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-4 left-4 right-4 z-10 flex gap-3">
        <Button
          onClick={handleNearbyClick}
          variant="outline"
          className="flex-1 btn-responsive bg-white shadow-lg"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {t('button.nearby_stores', '查看门店')}
        </Button>
        
        <Button
          onClick={userCoupon ? () => setLocation('/profile') : handleClaim}
          disabled={!canClaim && !userCoupon}
          className={`flex-2 btn-responsive shadow-lg ${
            !canClaim && !userCoupon ? 'btn-disabled' : 'btn-primary'
          }`}
        >
          {userCoupon ? (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              {t('button.view_coupon', '查看券码')}
            </>
          ) : (
            getCtaText()
          )}
        </Button>
      </div>

      {/* Nearby Stores Sheet */}
      <NearbySheet
        isOpen={nearbySheetOpen}
        onClose={() => setNearbySheetOpen(false)}
        stores={nearbyStores}
        onNavigate={handleNavigation}
      />
    </div>
  );
}
