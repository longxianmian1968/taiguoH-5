import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Languages, Globe } from 'lucide-react';

export default function I18nPage() {
  const { t, currentLang, switchLanguage } = useI18n();

  return (
    <AdminLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">
            {t('i18n.title', '多语言管理')}
          </h1>
          <p className="text-tertiary">
            {t('i18n.subtitle', '管理系统界面语言和翻译内容')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t('i18n.current_language', '当前语言')}
              </CardTitle>
              <CardDescription>
                {t('i18n.current_language_desc', '系统当前使用的语言')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">
                {currentLang === 'th' ? 'ไทย (Thai)' : '中文 (Chinese)'}
              </div>
              <Button 
                onClick={() => switchLanguage(currentLang === 'th' ? 'zh' : 'th')}
                className="w-full"
              >
                {t('i18n.switch_language', '切换语言')}
              </Button>
            </CardContent>
          </Card>

          {/* Translation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                {t('i18n.translation_status', '翻译状态')}
              </CardTitle>
              <CardDescription>
                {t('i18n.translation_status_desc', '系统翻译数据概览')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>{t('i18n.total_translations', '翻译总数')}</span>
                  <span className="font-bold">396+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('i18n.supported_languages', '支持语言')}</span>
                  <span className="font-bold">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('i18n.completion_rate', '完成率')}</span>
                  <span className="font-bold text-green-600">100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Features */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('i18n.features', '多语言功能')}</CardTitle>
              <CardDescription>
                {t('i18n.features_desc', '覆盖整个应用程序的多语言系统')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">{t('i18n.feature_auto_translation', '自动翻译')}</h4>
                    <p className="text-sm text-tertiary">{t('i18n.feature_auto_translation_desc', '使用ChatGPT API进行实时翻译')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">{t('i18n.feature_context_aware', '上下文感知翻译')}</h4>
                    <p className="text-sm text-tertiary">{t('i18n.feature_context_aware_desc', '理解使用场景的智能翻译')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">{t('i18n.feature_instant_switch', '即时语言切换')}</h4>
                    <p className="text-sm text-tertiary">{t('i18n.feature_instant_switch_desc', '无需刷新页面即可切换语言')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">{t('i18n.feature_unified_system', '统一管理系统')}</h4>
                    <p className="text-sm text-tertiary">{t('i18n.feature_unified_system_desc', '从单一点管理整个系统的语言设置')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}