import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { lineService } from '@/lib/line';
import { api, type Activity } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import ActivityCard from '@/components/ui/activity-card';
import { Search } from 'lucide-react';

const ACTIVITY_TYPES = ['all', 'coupon', 'group', 'presale', 'franchise'] as const;
type ActivityType = typeof ACTIVITY_TYPES[number];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, currentLang, switchLanguage } = useI18n();
  
  // State management - simplified without cursor/pagination logic
  const [activeTab, setActiveTab] = useState<ActivityType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Initialize LINE LIFF
  useEffect(() => {
    lineService.init().catch(console.error);
  }, []);

  // Fetch activities with robust error handling
  const { data: activities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/activities', activeTab, debouncedSearch],
    queryFn: async () => {
      const params: any = {
        page_size: 20,
      };
      
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      
      if (debouncedSearch) {
        params.q = debouncedSearch;
      }
      
      // Removed cursor logic for stability

      try {
        const result = await api.getActivities(params);
        // Log for debugging during development
        console.log('📊 Activities fetched:', result?.length || 0, 'items');
        
        // Track page view event
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'evt_page_view_home', {
            lang: currentLang,
            tab: activeTab,
            search: debouncedSearch || '',
          });
        }
        
        return result || [];
      } catch (err) {
        console.error('❌ Failed to fetch activities:', err);
        throw err;
      }
    },
    enabled: true,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
  });

  // Simplified state management - eliminate the complex cursor/allActivities logic
  // Just use the activities directly from the query
  const displayActivities = useMemo(() => {
    return activities || [];
  }, [activities]);

  // Event handlers
  const handleLanguageSwitch = () => {
    const newLang = currentLang === 'zh' ? 'th' : 'zh';
    switchLanguage(newLang);
    
    // Track language switch event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'evt_topbar_lang_switch', {
        from: currentLang,
        to: newLang,
      });
    }
  };

  const handleTabChange = (tab: ActivityType) => {
    setActiveTab(tab);
    
    // Track tab change event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'evt_filter_tab_change', {
        tab,
        lang: currentLang,
      });
    }
  };

  // Removed load more functionality for now to simplify data flow

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      coupon: t('activity.type.coupon', '卡券'),
      group: t('activity.type.group', '团购'),
      presale: t('activity.type.presale', '预售'),
      franchise: t('activity.type.franchise', '招商'),
    };
    return labels[type] || type;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20" data-testid="home-error">
        <div className="text-center mt-20">
          <p className="text-destructive">{t('error.load_failed', '加载失败')}</p>
          <Button onClick={() => refetch()} className="mt-4">
            {t('common.retry', '重试')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="home-page">
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
              <h1 className="text-xl font-bold text-primary" data-testid="app-title">
                {t('app.title', 'WiseNest Marketing')}
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="app-subtitle">
                {t('home.subtitle', '发现您的专属营销活动')}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLanguageSwitch}
              data-testid="language-toggle"
              className="relative"
            >
              <span className="font-medium">
                {currentLang === 'zh' ? '中文' : 'TH'}
              </span>
              <span className="text-xs opacity-60 ml-1">
                | {currentLang === 'zh' ? 'TH' : '中文'}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="sticky top-16 bg-background z-30 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide" data-testid="filter-tabs">
            {ACTIVITY_TYPES.map((type) => (
              <Button
                key={type}
                variant={activeTab === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabChange(type)}
                className="whitespace-nowrap flex-shrink-0"
                data-testid={`tab-${type}`}
              >
                {type === 'all' ? t('home.filter_all', '全部') : getTypeLabel(type)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-1.5 py-1">
        <div className="relative" data-testid="search-container">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t('home.search_placeholder', '搜索活动...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="search-input"
          />
        </div>
      </div>

      {/* Activities Grid */}
      <div className="container mx-auto px-1.5 pt-1 pb-4 bg-cyan-50/30 rounded-t-2xl">
        {isLoading && displayActivities.length === 0 ? (
          <div className="grid grid-cols-2 gap-1.5" data-testid="loading-skeleton">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (displayActivities?.length || 0) === 0 ? (
          <div className="text-center py-20" data-testid="no-activities">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">
              {t('search.no_results', '暂无活动')}
            </h3>
            <p className="text-muted-foreground">
              {debouncedSearch 
                ? t('search.try_different', '请尝试更换搜索关键词')
                : t('search.check_later', '请稍后再来查看新活动')
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5 mb-6" data-testid="activities-grid">
              {(displayActivities || []).map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onClick={() => setLocation(`/activities/${activity.id}`)}
                  data-testid={`activity-${activity.id}`}
                />
              ))}
            </div>
            
            {/* Load More functionality removed for stability */}
          </>
        )}
      </div>
    </div>
  );
}