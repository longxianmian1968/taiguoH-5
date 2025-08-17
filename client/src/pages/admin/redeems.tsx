import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Eye, Calendar, MapPin, User, CheckCircle, X, BarChart3, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileBlock } from '@/components/admin/MobileBlock';
import { useI18n } from '@/contexts/I18nContext';

export default function RedeemsPage() {
  const { t } = useI18n();
  const [filters, setFilters] = useState({
    search: '',
    storeId: '',
    staffId: '',
    activityId: '',
    dateRange: '',
    status: '',
  });
  const [selectedRedeem, setSelectedRedeem] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('records');
  const [statsDateRange, setStatsDateRange] = useState('this_month');

  // Mock data for redeems
  const mockRedeems = [
    {
      id: '1',
      code: 'COUPON001',
      activityName: '满减优惠券活动',
      activityNameTh: 'กิจกรรมคูปองลดราคา',
      storeName: '曼谷天地SPA中心',
      storeNameTh: 'ศูนย์สปาทองหล่อ',
      staffName: '小明',
      staffNameTh: 'น้องเหม',
      userName: '张三',
      userNameTh: 'ผู้ใช้ 001',
      redeemedAt: '2025-08-14T10:30:00Z',
      price: 80.00,
      status: 'completed',
      location: '曼谷市中心',
      locationTh: 'ใจกลางเมืองกรุงเทพ'
    },
    {
      id: '2',
      code: 'COUPON002',
      activityName: '泰式按摩体验券',
      activityNameTh: 'คูปองนวดแผนไทย',
      storeName: '清迈山度假村',
      storeNameTh: 'รีสอร์ทเชียงใหม่',
      staffName: '李四',
      staffNameTh: 'พี่ลี',
      userName: '王五',
      userNameTh: 'ผู้ใช้ 002',
      redeemedAt: '2025-08-14T14:15:00Z',
      price: 299.00,
      status: 'completed',
      location: '清迈古城',
      locationTh: 'เมืองเก่าเชียงใหม่'
    },
    {
      id: '3',
      code: 'COUPON003',
      activityName: '泰菜烹饪课程团购',
      activityNameTh: 'คอร์สทำอาหารไทยกรุ๊ป',
      storeName: '普吉海滩度假区',
      storeNameTh: 'รีสอร์ทหาดภูเก็ต',
      staffName: '赵六',
      staffNameTh: 'คุณชาย',
      userName: '钱七',
      userNameTh: 'ผู้ใช้ 003',
      redeemedAt: '2025-08-14T16:45:00Z',
      price: 1599.00,
      status: 'pending',
      location: '普吉海滩',
      locationTh: 'หาดภูเก็ต'
    }
  ];

  const handleFilterChange = (field: string, value: string) => {
    // Convert "all" back to empty string for filtering logic
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [field]: filterValue }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        color: 'bg-green-100 text-green-800 border-green-200',
        text: t('status.completed', '已完成')
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: t('status.pending', '待处理')
      },
      failed: {
        color: 'bg-red-100 text-red-800 border-red-200',
        text: t('status.failed', '失败')
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.text}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return `฿${price.toFixed(2)}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportData = () => {
    // Export functionality

  };

  // Mock staff statistics data (based on found commission system)
  const mockStaffStats = [
    {
      staffId: '1',
      staffName: '小明',
      staffNameTh: 'น้องเหม',
      storeName: '曼谷天地SPA中心',
      storeNameTh: 'ศูนย์สปาทองหล่อ',
      totalRedemptions: 89,
      totalAmount: 7120.00,
      commission: 356.00, // 5% commission rate
      avgPerRedemption: 80.00,
      thisMonthRedemptions: 23,
      lastWeekRedemptions: 8,
      activities: [
        { name: '满减优惠券活动', nameTh: 'กิจกรรมคูปองลดราคา', count: 45, amount: 3600.00 },
        { name: '泰式按摩体验券', nameTh: 'คูปองนวดแผนไทย', count: 44, amount: 3520.00 }
      ]
    },
    {
      staffId: '2',
      staffName: '李四',
      staffNameTh: 'พี่ลี',
      storeName: '清迈山度假村',
      storeNameTh: 'รีสอร์ทเชียงใหม่',
      totalRedemptions: 67,
      totalAmount: 13433.00,
      commission: 671.65,
      avgPerRedemption: 200.49,
      thisMonthRedemptions: 18,
      lastWeekRedemptions: 6,
      activities: [
        { name: '泰式按摩体验券', nameTh: 'คูปองนวดแผนไทย', count: 45, amount: 13455.00 },
        { name: '泰菜烹饪课程团购', nameTh: 'คอร์สทำอาหารไทยกรุ๊ป', count: 22, amount: 35178.00 }
      ]
    },
    {
      staffId: '3',
      staffName: '赵六',
      staffNameTh: 'คุณชาย',
      storeName: '普吉海滩度假区',
      storeNameTh: 'รีสอร์ทหาดภูเก็ต',
      totalRedemptions: 45,
      totalAmount: 71955.00,
      commission: 3597.75,
      avgPerRedemption: 1599.00,
      thisMonthRedemptions: 12,
      lastWeekRedemptions: 4,
      activities: [
        { name: '泰菜烹饪课程团购', nameTh: 'คอร์สทำอาหารไทยกรุ๊ป', count: 45, amount: 71955.00 }
      ]
    }
  ];

  const exportStaffStats = () => {
    const csvData = [
      ['员工姓名', '门店名称', '核销次数', '核销金额', '平均单次金额', '提成金额', '本月核销', '近7天核销'],
      ...mockStaffStats.map(staff => [
        staff.staffName,
        staff.storeName,
        staff.totalRedemptions,
        staff.totalAmount.toFixed(2),
        staff.avgPerRedemption.toFixed(2),
        staff.commission.toFixed(2),
        staff.thisMonthRedemptions,
        staff.lastWeekRedemptions
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `员工核销统计_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDetailedStats = () => {
    const csvData = [
      ['员工姓名', '门店名称', '活动名称', '核销次数', '核销金额']
    ];
    
    mockStaffStats.forEach(staff => {
      staff.activities.forEach(activity => {
        csvData.push([
          staff.staffName,
          staff.storeName,
          activity.name,
          activity.count.toString(),
          activity.amount.toFixed(2)
        ]);
      });
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `员工活动核销详情_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  <h1 className="text-2xl font-bold text-secondary">{t('redeems.title', '核销记录')}</h1>
                  <p className="text-tertiary mt-1">{t('redeems.subtitle', '查看和管理优惠券核销数据')}</p>
                </div>
                <Button
                  onClick={exportData}
                  className="btn-desktop btn-secondary px-6 font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('redeems.export', '导出')}
                </Button>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="container-desktop px-4 py-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search" className="text-sm font-medium text-secondary mb-2 block">
                    {t('redeems.search_label', '搜索')}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                    <Input
                      id="search"
                      placeholder={t('redeems.search_placeholder', '搜索优惠券码...')}
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-secondary mb-2 block">
                    {t('redeems.status_filter', '状态')}
                  </Label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('redeems.all_status', '全部状态')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('redeems.all_status', '全部状态')}</SelectItem>
                      <SelectItem value="completed">{t('status.completed', '已完成')}</SelectItem>
                      <SelectItem value="pending">{t('status.pending', '待处理')}</SelectItem>
                      <SelectItem value="failed">{t('status.failed', '失败')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateRange" className="text-sm font-medium text-secondary mb-2 block">
                    {t('redeems.date_range', '时间范围')}
                  </Label>
                  <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('redeems.all_dates', '全部时间')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('redeems.all_dates', '全部时间')}</SelectItem>
                      <SelectItem value="today">{t('redeems.today', '今天')}</SelectItem>
                      <SelectItem value="week">{t('redeems.this_week', '本周')}</SelectItem>
                      <SelectItem value="month">{t('redeems.this_month', '本月')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => setFilters({
                      search: '',
                      storeId: '',
                      staffId: '',
                      activityId: '',
                      dateRange: '',
                      status: '',
                    })}
                    variant="outline"
                    className="w-full"
                  >
                    {t('common.reset', '重置')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="container-desktop px-4 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('redeems.total_redeems', '核销总数')}
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">1,234</div>
                  <p className="text-xs text-tertiary">
                    +20.1% {t('redeems.from_last_month', '比上月')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('redeems.total_revenue', '总收入')}
                  </CardTitle>
                  <Download className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">฿45,231</div>
                  <p className="text-xs text-tertiary">
                    +180.1% {t('redeems.from_last_month', '比上月')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('redeems.today_redeems', '今日核销')}
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">89</div>
                  <p className="text-xs text-tertiary">
                    +19% {t('redeems.from_yesterday', '比昨日')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-tertiary">
                    {t('redeems.active_stores', '活跃门店数')}
                  </CardTitle>
                  <MapPin className="h-4 w-4 text-tertiary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">24</div>
                  <p className="text-xs text-tertiary">
                    {t('redeems.of_total_stores', '共32家门店')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Records and Statistics */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="records" className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('redeems.records', '核销记录')}
                </TabsTrigger>
                <TabsTrigger value="statistics" className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t('redeems.staff_statistics', '员工统计')}
                </TabsTrigger>
              </TabsList>

              {/* Records Tab */}
              <TabsContent value="records">
                <div className="bg-white rounded-lg border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-secondary">
                      {t('redeems.recent_redeems', '最近核销记录')}
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.code', '优惠券码')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.activity', '活动')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.store', '门店')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.staff', '员工')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.price', '价格')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.date', '时间')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.status', '状态')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('common.operation', '操作')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mockRedeems.map((redeem) => (
                          <tr key={redeem.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary">
                              {redeem.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                              {redeem.activityNameTh}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                              <div>
                                <div className="font-medium">{redeem.storeNameTh}</div>
                                <div className="text-tertiary text-xs">{redeem.locationTh}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-tertiary" />
                                {redeem.staffNameTh}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary">
                              {formatPrice(redeem.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-tertiary">
                              {formatDateTime(redeem.redeemedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(redeem.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2"
                                onClick={() => {
                                  setSelectedRedeem(redeem);
                                  setShowDetailModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {t('common.view', '查看')}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {mockRedeems.length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle className="mx-auto h-12 w-12 text-tertiary" />
                      <h3 className="mt-2 text-sm font-medium text-secondary">
                        {t('redeems.no_data', '暂无核销记录')}
                      </h3>
                      <p className="mt-1 text-sm text-tertiary">
                        {t('redeems.no_data_desc', '核销记录将显示在这里')}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="statistics">
                {/* Stats Filter and Export */}
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="flex items-center space-x-4">
                    <div>
                      <Label className="text-sm font-medium text-tertiary">
                        {t('redeems.stats_period', '统计周期')}
                      </Label>
                      <Select value={statsDateRange} onValueChange={setStatsDateRange}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="this_week">{t('common.this_week', '本周')}</SelectItem>
                          <SelectItem value="this_month">{t('common.this_month', '本月')}</SelectItem>
                          <SelectItem value="last_month">{t('common.last_month', '上月')}</SelectItem>
                          <SelectItem value="this_quarter">{t('common.this_quarter', '本季度')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={exportStaffStats}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      {t('redeems.export_staff_stats', '导出员工统计')}
                    </Button>
                    <Button
                      onClick={exportDetailedStats}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('redeems.export_detailed', '导出详细统计')}
                    </Button>
                  </div>
                </div>

                {/* Staff Statistics Table */}
                <div className="bg-white rounded-lg border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-secondary flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      {t('redeems.staff_performance', '员工核销绩效统计')}
                    </h3>
                    <p className="text-sm text-tertiary mt-1">
                      {t('redeems.commission_calculation', '用于提成核算的详细数据')}
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('common.staff_name', '员工姓名')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('common.store_name', '门店名称')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.total_redemptions', '总核销次数')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.total_amount', '总核销金额')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.avg_per_redemption', '平均单次金额')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.commission_amount', '提成金额')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.this_month', '本月核销')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-tertiary uppercase tracking-wider">
                            {t('redeems.recent_7_days', '近7天')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mockStaffStats.map((staff) => (
                          <tr key={staff.staffId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-tertiary" />
                                <div>
                                  <div className="text-sm font-medium text-secondary">{staff.staffNameTh}</div>
                                  <div className="text-xs text-tertiary">{staff.staffName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-secondary">{staff.storeNameTh}</div>
                                <div className="text-xs text-tertiary">{staff.storeName}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-primary">
                              {staff.totalRedemptions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-secondary">
                              {formatPrice(staff.totalAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-tertiary">
                              {formatPrice(staff.avgPerRedemption)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <Badge className="bg-green-100 text-green-800 border-green-200 font-bold">
                                {formatPrice(staff.commission)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                              {staff.thisMonthRedemptions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                              {staff.lastWeekRedemptions}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-secondary">
                {t('redeems.detail_title', '核销详情')}
              </DialogTitle>
            </DialogHeader>
            
            {selectedRedeem && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-tertiary">
                      {t('redeems.code', '核销码')}
                    </Label>
                    <div className="text-lg font-mono font-bold text-primary bg-gray-50 p-3 rounded-lg">
                      {selectedRedeem.code}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-tertiary">
                      {t('redeems.status', '状态')}
                    </Label>
                    <div>
                      {getStatusBadge(selectedRedeem.status)}
                    </div>
                  </div>
                </div>

                {/* Activity Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                      {t('redeems.activity_info', '活动信息')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-tertiary">{t('common.activity_name', '活动名称')}</Label>
                      <div className="text-secondary font-medium">{selectedRedeem.activityNameTh}</div>
                      <div className="text-sm text-tertiary">{selectedRedeem.activityName}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-tertiary">{t('redeems.price', '金额')}</Label>
                      <div className="text-lg font-bold text-primary">{formatPrice(selectedRedeem.price)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Store & Staff Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-primary" />
                      {t('redeems.store_staff_info', '门店员工信息')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-tertiary">{t('common.store', '门店')}</Label>
                      <div className="text-secondary font-medium">{selectedRedeem.storeNameTh}</div>
                      <div className="text-sm text-tertiary">{selectedRedeem.storeName}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-tertiary">{t('redeems.location', '位置')}</Label>
                      <div className="text-secondary">{selectedRedeem.locationTh}</div>
                      <div className="text-sm text-tertiary">{selectedRedeem.location}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-tertiary">{t('common.staff', '员工')}</Label>
                      <div className="text-secondary flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {selectedRedeem.staffNameTh} ({selectedRedeem.staffName})
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <User className="w-5 h-5 mr-2 text-primary" />
                      {t('redeems.user_info', '用户信息')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-tertiary">{t('common.user_name', '用户名称')}</Label>
                      <div className="text-secondary">{selectedRedeem.userNameTh} ({selectedRedeem.userName})</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-primary" />
                      {t('redeems.time_info', '时间信息')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-tertiary">{t('redeems.redeemed_at', '核销时间')}</Label>
                      <div className="text-secondary font-medium">{formatDateTime(selectedRedeem.redeemedAt)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                  >
                    {t('common.close', '关闭')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Export single redeem record
                      console.log('Export redeem:', selectedRedeem.id);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('common.export', '导出')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}