import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function MobileBlock() {
  const { t } = useI18n();
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 在开发环境中禁用移动设备检测
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('mobile_block.device_restriction', '设备限制')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('mobile_block.desktop_only', '后台管理系统仅支持桌面端访问')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('mobile_block.use_computer', '请使用电脑浏览器访问此页面')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}