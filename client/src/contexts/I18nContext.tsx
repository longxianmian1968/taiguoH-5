import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface I18nContextType {
  currentLang: 'zh' | 'th';
  t: (key: string, fallback?: string) => string;
  switchLanguage: (lang: 'zh' | 'th') => void;
  availableLanguages: Array<{ code: 'zh' | 'th'; name: string; nativeName: string }>;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Fetch translations from database
const fetchTranslations = async (lang: 'zh' | 'th'): Promise<Record<string, string>> => {
  try {
    const response = await fetch(`/api/i18n/translations/${lang}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Translation API returned ${response.status} for lang: ${lang}`);
      throw new Error(`HTTP ${response.status}: Failed to fetch translations for ${lang}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.data) {
      console.warn(`Invalid translation data structure for lang: ${lang}`, data);
      throw new Error(`Invalid translation data structure for ${lang}`);
    }
    
    return data.data;
  } catch (error) {
    console.error(`Translation fetch error for ${lang}:`, error);
    
    // 返回基础翻译作为fallback，覆盖更多常用的keys
    const fallbackTranslations = {
      // 导航相关
      'nav.home': lang === 'th' ? 'หน้าแรก' : '首页',
      'nav.dashboard': lang === 'th' ? 'แดชบอร์ด' : '仪表板', 
      'nav.activities': lang === 'th' ? 'กิจกรรม' : '活动',
      'nav.stores': lang === 'th' ? 'ร้านค้า' : '门店',
      'nav.statistics': lang === 'th' ? 'สถิติ' : '统计',
      'nav.messages': lang === 'th' ? 'ข้อความ' : '消息',
      'nav.profile': lang === 'th' ? 'โปรไฟล์' : '个人中心',
      
      // 基础操作
      'common.loading': lang === 'th' ? 'กำลังโหลด...' : '加载中...',
      'common.error': lang === 'th' ? 'เกิดข้อผิดพลาด' : '发生错误',
      'common.success': lang === 'th' ? 'สำเร็จ' : '成功',
      'common.confirm': lang === 'th' ? 'ยืนยัน' : '确认',
      'common.cancel': lang === 'th' ? 'ยกเลิก' : '取消',
      
      // 价格和时间
      'price.currency': lang === 'th' ? '฿' : '฿',
      'time.remaining': lang === 'th' ? 'เวลาที่เหลือ' : '剩余时间',
      'quantity.remaining': lang === 'th' ? 'เหลือ' : '剩余',
      
      // 活动相关
      'activity.claim': lang === 'th' ? 'รับคูปอง' : '领取优惠券',
      'activity.details': lang === 'th' ? 'รายละเอียด' : '活动详情',
    };
    
    return fallbackTranslations;
  }
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [currentLang, setCurrentLang] = useState<'zh' | 'th'>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('admin-language') as 'zh' | 'th';

      // 强制重置并设置为泰文作为默认语言
      const defaultLang = 'th';
      localStorage.setItem('admin-language', defaultLang);
      return defaultLang;
    }
    return 'th'; // 默认泰文
  });

  // Query translations from database
  const { data: translations = {}, isLoading, error } = useQuery({
    queryKey: ['translations', currentLang],
    queryFn: () => fetchTranslations(currentLang),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 3, // Retry 3 times on failure
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Disable refetch on window focus to reduce requests
    refetchOnMount: true,
  });

  // Log errors for debugging but don't break the app
  useEffect(() => {
    if (error) {
      console.error('Translation loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (typeof window !== 'undefined') {

      localStorage.setItem('admin-language', currentLang);
    }
  }, [currentLang]);

  const t = (key: string, fallback?: string) => {
    const translation = translations[key];
    const result = translation || fallback || key;
    

    
    return result;
  };

  const switchLanguage = (lang: 'zh' | 'th') => {

    setCurrentLang(lang);
  };

  const value: I18nContextType = {
    currentLang,
    t,
    switchLanguage,
    availableLanguages: [
      { code: 'zh' as const, name: '中文', nativeName: '中文' },
      { code: 'th' as const, name: 'Thai', nativeName: 'ไทย' }
    ],
    isLoading
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}