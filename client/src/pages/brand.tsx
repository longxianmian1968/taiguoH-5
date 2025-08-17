import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/contexts/I18nContext';
import { Ticket, Users, Clock, Building2 } from 'lucide-react';

export default function BrandPage() {
  const { t, currentLang, switchLanguage } = useI18n();

  const handleLanguageSwitch = () => {
    const newLang = currentLang === 'zh' ? 'th' : 'zh';
    switchLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="brand-page">
      {/* Header */}
      <header className="sticky top-0 bg-background z-40 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary" data-testid="brand-title">
                {t('brand.title', 'WiseNest Marketing')}
              </h1>
              <p className="text-sm text-muted-foreground" data-testid="brand-subtitle">
                {t('brand.subtitle', '品牌介绍与服务')}
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white" data-testid="hero-section">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4" data-testid="hero-title">
              {currentLang === 'th' ? 'แพลตฟอร์มการตลาดชั้นนำของไทย' : t('brand.hero_title', '泰国领先的营销平台')}
            </h2>
            <p className="text-lg opacity-90 mb-6" data-testid="hero-description">
              {currentLang === 'th' ? 'เชื่อมต่อแบรนด์กับผู้บริโภค มให้บริการทางการตลาดที่มีคุณภาพ' : t('brand.hero_desc', '连接品牌与消费者，提供优质的营销服务')}
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90" data-testid="explore-button">
                {currentLang === 'th' ? 'สำรวจบริการ' : t('brand.explore', '探索服务')}
              </Button>
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90" data-testid="contact-button">
                {currentLang === 'th' ? 'ติดต่อเรา' : t('brand.contact', '联系我们')}
              </Button>
              <Button 
                size="lg" 
                className="bg-white text-primary border-2 border-white hover:bg-gray-100" 
                data-testid="staff-verify-button"
                onClick={() => window.location.href = '/verify'}
              >
                {currentLang === 'th' ? 'พนักงานตรวจสอบ' : t('brand.staff_verify', '店员核销')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Introduction Section */}
      <section className="py-8 px-4 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {currentLang === 'th' ? 'ระบบการตลาด H5' : t('product.title', 'H5营销系统')}
          </h2>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {currentLang === 'th' ? 'แพลตฟอร์มการตลาดที่รวม LINE เข้าด้วยกัน ออกแบบมาโดยเฉพาะสำหรับตลาดไทย มีโซลูชันการตลาดดิจิทัลที่ครบถ้วน' : t('product.subtitle', '专为泰国市场设计的LINE集成营销平台，提供完整的数字化营销解决方案')}
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            {/* Staff Verification Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">
                    {currentLang === 'th' ? 'สำหรับพนักงานร้าน' : '店员专用'}
                  </h4>
                  <p className="text-blue-700 text-xs">
                    {currentLang === 'th' ? 
                      'สแกนคิวอาร์โค้ดด้วย LINE หรือใช้ปุ่ม "พนักงานตรวจสอบ" เพื่อกรอกรหัสด้วยตนเอง' : 
                      '优先使用LINE扫码核销，点击"店员核销"按钮进行手动兜底'}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {currentLang === 'th' ? 'รวม LINE' : t('product.feature1', 'LINE集成')}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLang === 'th' ? 'ประสบการณ์ LINE แท้' : t('product.feature1_desc', '原生LINE体验')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {currentLang === 'th' ? 'หลายภาษา' : t('product.feature2', '多语言')}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLang === 'th' ? 'รองรับจีน-ไทย' : t('product.feature2_desc', '中泰双语支持')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {currentLang === 'th' ? 'ตำแหน่งทางภูมิศาสตร์' : t('product.feature3', '地理定位')}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLang === 'th' ? 'นำทางร้านค้า' : t('product.feature3_desc', '门店定位导航')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 6a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {currentLang === 'th' ? 'การจัดการอัจฉริยะ' : t('product.feature4', '智能管理')}
                </h3>
                <p className="text-sm text-gray-600">
                  {currentLang === 'th' ? 'ระบบแบ็กเอนด์ที่สมบูรณ์' : t('product.feature4_desc', '完整后台系统')}
                </p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {currentLang === 'th' 
                ? 'ระบบการตลาด H5 ของเราถูกสร้างขึ้นโดยเฉพาะสำหรับตลาดไทย รวมแพลตฟอร์ม LINE เข้าด้วยกัน รองรับภาษาจีน-ไทย มีรูปแบบการตลาดหลากหลาย เช่น คูปอง กลุ่มซื้อ พรีเซล และแฟรนไชส์ ระบบมีฟีเจอร์การระบุตำแหน่งทางภูมิศาสตร์ที่สมบูรณ์ บริการแปลอัจฉริยะ และการจัดการแบ็กเอนด์แบบมืออาชีพ ช่วยให้แบรนด์ขยายตลาดในประเทศไทยได้อย่างรวดเร็ว'
                : t('product.description', '我们的H5营销系统专门为泰国市场打造，集成LINE平台，支持中泰双语，提供优惠券、团购、预售、招商等多种营销模式。系统具备完整的地理定位功能、智能翻译服务和专业的后台管理，帮助品牌快速拓展泰国市场。')
              }
            </p>
          </div>
        </div>
      </section>

      {/* Services Section - Compact Matrix */}
      <section className="py-6 px-4 bg-white" data-testid="services-section">
        <div className="container mx-auto">
          <h3 className="text-2xl font-bold text-center mb-6" data-testid="services-title">
            {currentLang === 'th' ? 'บริการของเรา' : t('brand.services_title', '我们的服务')}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 hover:shadow-md transition-shadow text-center" data-testid="service-coupons">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-sm mb-1">
                {currentLang === 'th' ? 'การตลาดคูปอง' : t('brand.service_coupons', '优惠券营销')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {currentLang === 'th' ? 'การแจกจ่ายและการจัดการคูปองดิจิทัล' : t('brand.service_coupons_desc', '数字化优惠券发放与管理')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 hover:shadow-md transition-shadow text-center" data-testid="service-group">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-sm mb-1">
                {currentLang === 'th' ? 'กิจกรรมกลุ่มซื้อ' : t('brand.service_group', '团购活动')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {currentLang === 'th' ? 'การตลาดชุมชนและการจัดการกลุ่มซื้อ' : t('brand.service_group_desc', '社群营销与团购管理')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 hover:shadow-md transition-shadow text-center" data-testid="service-presale">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-sm mb-1">
                {currentLang === 'th' ? 'การจัดการพรีเซล' : t('brand.service_presale', '预售管理')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {currentLang === 'th' ? 'การพรีเซลสินค้าใหม่และการจัดการสต็อก' : t('brand.service_presale_desc', '新品预售与库存管理')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 hover:shadow-md transition-shadow text-center" data-testid="service-franchise">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-sm mb-1">
                {currentLang === 'th' ? 'สรรหาแฟรนไชส์' : t('brand.service_franchise', '招商加盟')}
              </h4>
              <p className="text-xs text-muted-foreground">
                {currentLang === 'th' ? 'การขยายแบรนด์และการจัดการแฟรนไชส์' : t('brand.service_franchise_desc', '品牌扩张与加盟管理')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-12" data-testid="news-section">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-8" data-testid="news-title">
            {currentLang === 'th' ? 'ข่าวสารล่าสุด' : t('brand.news_title', '最新资讯')}
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card data-testid="news-1">
              <CardContent className="p-6">
                <div className="w-full h-32 bg-muted rounded-lg mb-4"></div>
                <Badge className="mb-2">
                  {currentLang === 'th' ? 'เทคนิคการตลาด' : '营销技巧'}
                </Badge>
                <h4 className="font-semibold mb-2">
                  {currentLang === 'th' ? '5 กลยุทธ์สำคัญของ WiseNest Marketing' : t('brand.news_1_title', 'WiseNest营销的5个关键策略')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {currentLang === 'th' ? 'เรียนรู้วิธีเพิ่มอิทธิพลแบรนด์ผ่านแพลตฟอร์ม LINE...' : t('brand.news_1_desc', '了解如何通过LINE平台提升品牌影响力...')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">2024-12-15</p>
              </CardContent>
            </Card>
            <Card data-testid="news-2">
              <CardContent className="p-6">
                <div className="w-full h-32 bg-muted rounded-lg mb-4"></div>
                <Badge className="mb-2">
                  {currentLang === 'th' ? 'แนวโน้มอุตสาหกรรม' : '行业动态'}
                </Badge>
                <h4 className="font-semibold mb-2">
                  {currentLang === 'th' ? 'แนวโน้มตลาดการตลาดดิจิทัลไทย' : t('brand.news_2_title', '泰国数字营销市场趋势')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {currentLang === 'th' ? 'รายงานการพัฒนาอุตสาหกรรมการตลาดดิจิทัลไทยปี 2024...' : t('brand.news_2_desc', '2024年泰国数字营销行业发展报告...')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">2024-12-10</p>
              </CardContent>
            </Card>
            <Card data-testid="news-3">
              <CardContent className="p-6">
                <div className="w-full h-32 bg-muted rounded-lg mb-4"></div>
                <Badge className="mb-2">
                  {currentLang === 'th' ? 'เคสศึกษา' : '成功案例'}
                </Badge>
                <h4 className="font-semibold mb-2">
                  {currentLang === 'th' ? 'เคสศึกษาการตลาดแบรนด์ร้านอาหารที่ประสบความสำเร็จ' : t('brand.news_3_title', '餐饮品牌营销成功案例')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {currentLang === 'th' ? 'ดูว่าแบรนด์ร้านอาหารชื่อดังใช้แพลตฟอร์มของเราอย่างไร...' : t('brand.news_3_desc', '看某知名餐饮品牌如何通过我们的平台...')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">2024-12-05</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-muted/50" data-testid="cta-section">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4" data-testid="cta-title">
            {currentLang === 'th' ? 'พร้อมเริ่มต้นเส้นทางการตลาดของคุณแล้วหรือยัง?' : t('brand.cta_title', '准备开始您的营销之旅？')}
          </h3>
          <p className="text-muted-foreground mb-6" data-testid="cta-description">
            {currentLang === 'th' ? 'ติดต่อทีมผู้เชี่ยวชาญของเราทันที เพื่อสร้างกลยุทธ์การตลาดเฉพาะสำหรับคุณ' : t('brand.cta_desc', '立即联系我们的专业团队，制定专属的营销策略')}
          </p>
          <Button size="lg" data-testid="cta-button">
            {currentLang === 'th' ? 'ปรึกษาฟรี' : t('brand.cta_button', '免费咨询')}
          </Button>
        </div>
      </section>
    </div>
  );
}