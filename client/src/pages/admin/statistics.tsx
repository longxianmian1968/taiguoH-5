import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Store, Calendar, Download, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MobileBlock } from '@/components/admin/MobileBlock';
import { useI18n } from '@/contexts/I18nContext';

interface StatisticsData {
  totalRedemptions: number;
  totalRevenue: number;
  activeStores: number;
  totalUsers: number;
  recentTrend: number;
  storeRanking: Array<{
    id: string;
    name: string;
    nameTh: string;
    redemptions: number;
    revenue: number;
    growth: number;
  }>;
  activityStats: Array<{
    id: string;
    name: string;
    nameTh: string;
    redemptions: number;
    revenue: number;
    conversionRate: number;
  }>;
  staffRanking: Array<{
    id: string;
    name: string;
    nameTh: string;
    store: string;
    storeTh: string;
    redemptions: number;
    commission: number;
  }>;
}

export default function StatisticsPage() {
  const { t, currentLang } = useI18n();
  const [timeRange, setTimeRange] = useState('month');
  const [viewType, setViewType] = useState('overview');

  // Mock statistics data
  const mockStatistics: StatisticsData = {
    totalRedemptions: 2456,
    totalRevenue: 156780.50,
    activeStores: 45,
    totalUsers: 8934,
    recentTrend: 18.5,
    storeRanking: [
      {
        id: '1',
        name: '曼谷天地SPA中心',
        nameTh: 'ศูนย์สปาทองหล่อ',
        redemptions: 234,
        revenue: 18670.00,
        growth: 24.5
      },
      {
        id: '2',
        name: '清迈山度假村',
        nameTh: 'รีสอร์ทเชียงใหม่',
        redemptions: 189,
        revenue: 15420.00,
        growth: 18.2
      },
      {
        id: '3',
        name: '普吉海滩度假区',
        nameTh: 'รีสอร์ทหาดภูเก็ต',
        redemptions: 156,
        revenue: 12340.00,
        growth: 15.8
      }
    ],
    activityStats: [
      {
        id: '1',
        name: '满减优惠券活动',
        nameTh: 'กิจกรรมคูปองลดราคา',
        redemptions: 456,
        revenue: 36480.00,
        conversionRate: 23.4
      },
      {
        id: '2',
        name: '泰式按摩体验券',
        nameTh: 'คูปองนวดแผนไทย',
        redemptions: 234,
        revenue: 23400.00,
        conversionRate: 18.7
      },
      {
        id: '3',
        name: '泰菜烹饪课程团购',
        nameTh: 'คอร์สทำอาหารไทยกรุ๊ป',
        redemptions: 123,
        revenue: 19680.00,
        conversionRate: 15.2
      }
    ],
    staffRanking: [
      {
        id: '1',
        name: '小明',
        nameTh: 'น้องเหม',
        store: '曼谷天地SPA中心',
        storeTh: 'ศูนย์สปาทองหล่อ',
        redemptions: 89,
        commission: 2670.00
      },
      {
        id: '2',
        name: '李四',
        nameTh: 'พี่ลี',
        store: '清迈山度假村',
        storeTh: 'รีสอร์ทเชียงใหม่',
        redemptions: 67,
        commission: 2010.00
      },
      {
        id: '3',
        name: '赵六',
        nameTh: 'คุณชาย',
        store: '普吉海滩度假区',
        storeTh: 'รีสอร์ทหาดภูเก็ต',
        redemptions: 45,
        commission: 1350.00
      }
    ]
  };

  const formatPrice = (price: number) => {
    return `฿${price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  };

  const exportData = () => {

  };

  return (
    <>
      <MobileBlock />
      <AdminLayout>
        <div className="bg-gray-50 min-h-screen">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="container-desktop px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-secondary">{t('statistics.title', '数据统计')}</h1>
                  <p className="text-tertiary mt-1">{t('statistics.subtitle', '分析运营表现和使用统计')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="btn-desktop"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('common.refresh', '刷新')}
                  </Button>
                  <Button
                    onClick={exportData}
                    className="btn-desktop btn-secondary px-6 font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('common.export', '导出')}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="container-desktop px-4 py-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-secondary mb-2 block">
                    {t('statistics.time_range', '时间范围')}
                  </label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">{t('statistics.this_week', '本周')}</SelectItem>
                      <SelectItem value="month">{t('statistics.this_month', '本月')}</SelectItem>
                      <SelectItem value="quarter">{t('statistics.this_quarter', '本季度')}</SelectItem>
                      <SelectItem value="year">{t('statistics.this_year', '本年')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary mb-2 block">
                    {t('statistics.view_type', '视图类型')}
                  </label>
                  <Select value={viewType} onValueChange={setViewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">{t('statistics.overview', '概览')}</SelectItem>
                      <SelectItem value="stores">{t('statistics.by_store', '按门店分析')}</SelectItem>
                      <SelectItem value="activities">{t('statistics.by_activity', '按活动分析')}</SelectItem>
                      <SelectItem value="staff">{t('statistics.by_staff', '按员工分析')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Statistics */}
          <div className="container-desktop px-4 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('statistics.total_redemptions', '总核销数')}
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{mockStatistics.totalRedemptions.toLocaleString()}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{mockStatistics.recentTrend}% {t('statistics.vs_last_period', '对比上期')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('statistics.total_revenue', '总收入')}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{formatPrice(mockStatistics.totalRevenue)}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +22.4% {t('statistics.vs_last_period', '对比上期')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('statistics.active_stores', '活跃门店')}
                  </CardTitle>
                  <Store className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{mockStatistics.activeStores}</div>
                  <p className="text-xs text-tertiary mt-1">
                    {t('statistics.total_network', '全网门店')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('statistics.total_users', '总用户数')}
                  </CardTitle>
                  <Users className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{mockStatistics.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.8% {t('statistics.vs_last_period', '对比上期')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Store Ranking */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-secondary flex items-center">
                    <Store className="w-5 h-5 mr-2" />
                    {t('statistics.store_ranking', '门店排行')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockStatistics.storeRanking.map((store, index) => (
                      <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-secondary">
                              {currentLang === 'th' ? store.nameTh : store.name}
                            </div>
                            <div className="text-sm text-tertiary">
                              {store.redemptions} {t('statistics.redemptions', '次核销')} • {formatPrice(store.revenue)}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          +{store.growth}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Staff Ranking */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-secondary flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {t('statistics.staff_ranking', '员工排行')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockStatistics.staffRanking.map((staff, index) => (
                      <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-secondary">
                              {currentLang === 'th' ? staff.nameTh : staff.name}
                            </div>
                            <div className="text-sm text-tertiary">
                              {currentLang === 'th' ? staff.storeTh : staff.store}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-secondary">{formatPrice(staff.commission)}</div>
                          <div className="text-sm text-tertiary">{staff.redemptions} {t('statistics.redemptions', '次核销')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Performance */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-secondary flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {t('statistics.activity_performance', '活动表现')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-secondary">
                          {t('statistics.activity_name', '活动名称')}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-secondary">
                          {t('statistics.redemptions', '核销数')}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-secondary">
                          {t('statistics.revenue', '收入')}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-secondary">
                          {t('statistics.conversion_rate', '转化率')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockStatistics.activityStats.map((activity) => (
                        <tr key={activity.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-secondary">
                              {currentLang === 'th' ? activity.nameTh : activity.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-secondary">
                            {activity.redemptions.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-secondary">
                            {formatPrice(activity.revenue)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {activity.conversionRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}