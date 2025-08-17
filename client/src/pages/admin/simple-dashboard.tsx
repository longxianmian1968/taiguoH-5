import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, Users, ShoppingBag, CheckCircle, Database, Loader2, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ActivityAnalytics {
  activityId: string;
  activityTitle: string;
  totalClaimed: number;
  totalRedeemed: number;
  storeStats: {
    storeId: string;
    storeName: string;
    redemptionCount: number;
    staffStats: {
      staffId: string;
      staffName: string;
      redemptionCount: number;
    }[];
  }[];
}

function ActivityAnalyticsSection() {
  const { t } = useI18n();
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: analytics, isLoading, error } = useQuery<{ code: number; data: ActivityAnalytics[] }>({
    queryKey: ['/admin/api/activity-analytics'],
    refetchInterval: 30000, // 30秒自动刷新
  });

  const seedDataMutation = useMutation({
    mutationFn: () => apiRequest('/admin/api/seed-demo-data', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/activity-analytics'] });
    },
  });

  const toggleActivity = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const handleExport = (activityId: string, activityTitle: string) => {
    const exportUrl = `/admin/api/export-activity/${activityId}`;
    // 创建临时链接触发下载
    const link = document.createElement('a');
    link.href = exportUrl;
    link.download = `${activityTitle}_提成核算数据.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleStore = (storeKey: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeKey)) {
      newExpanded.delete(storeKey);
    } else {
      newExpanded.add(storeKey);
    }
    setExpandedStores(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('activities.analytics_title', '活动数据统计')}
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const activityData = analytics?.data || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('activities.commission_analytics', '活动数据统计（提成核算专用）')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('activities.show_all_data', '展现所有参与门店及导购的核销数据')}
          </p>
        </div>
        <button
          onClick={() => seedDataMutation.mutate()}
          disabled={seedDataMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {seedDataMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          <span className="text-sm">
            {t('common.create_demo_data', '创建演示数据')}
          </span>
        </button>
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">
            {t('common.data_load_failed', '数据加载失败')}
          </p>
          <p className="text-sm text-gray-500">
            {t('common.try_create_demo', '请尝试创建演示数据来查看效果')}
          </p>
        </div>
      ) : activityData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">
            {t('common.no_activity_data', '暂无活动数据')}
          </p>
          <p className="text-sm">
            {t('common.click_create_demo', '点击"创建演示数据"查看展现效果')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activityData.map((activity) => (
            <div key={activity.activityId} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleActivity(activity.activityId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{activity.activityTitle}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">
                          {t('activities.claimed_count', '领取数')}:
                        </span>
                        <span className="font-semibold text-blue-600">{activity.totalClaimed}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">
                          {t('activities.redeemed_count', '核销数')}:
                        </span>
                        <span className="font-semibold text-green-600">{activity.totalRedeemed}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-600">
                          {t('activities.participating_stores', '参与门店')}:
                        </span>
                        <span className="font-semibold text-purple-600">{activity.storeStats.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(activity.activityId, activity.activityTitle);
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                      title={t('common.export_commission', '导出提成数据')}
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('common.export', '导出')}</span>
                    </button>
                    {expandedActivities.has(activity.activityId) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedActivities.has(activity.activityId) && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {t('activities.store_staff_data', '门店及导购核销数据（提成核算）')}
                  </h4>
                  {activity.storeStats.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      {t('activities.no_participating_stores', '没有参与该活动的门店')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activity.storeStats.map((store) => {
                        const storeKey = `${activity.activityId}-${store.storeId}`;
                        return (
                          <div key={store.storeId} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* 门店信息行 */}
                            <div 
                              className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => toggleStore(storeKey)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <ShoppingBag className="w-4 h-4 text-purple-500" />
                                  <span className="font-medium text-gray-900">{store.storeName}</span>
                                  <span className="text-sm text-gray-500">
                                    {t('activities.store_redemptions', '门店核销')}:
                                  </span>
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                                    {store.redemptionCount}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {t('activities.staff_count', '导购员')}:
                                  </span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                                    {store.staffStats.length}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  {expandedStores.has(storeKey) ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 导购详细信息 */}
                            {expandedStores.has(storeKey) && (
                              <div className="p-3 bg-white">
                                <h5 className="text-sm font-medium text-gray-800 mb-2">
                                  {t('activities.staff_details', '导购员核销明细')}
                                </h5>
                                {store.staffStats.length === 0 ? (
                                  <p className="text-gray-500 text-xs">
                                    {t('activities.no_staff_in_store', '该门店暂无导购员')}
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {store.staffStats.map((staff) => (
                                      <div 
                                        key={staff.staffId} 
                                        className={`flex items-center justify-between p-2 rounded-md text-xs ${
                                          staff.redemptionCount > 0 
                                            ? 'bg-green-50 border border-green-200' 
                                            : 'bg-gray-50 border border-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Users className="w-3 h-3 text-gray-500" />
                                          <span className="font-medium text-gray-900 truncate">
                                            {staff.staffName}
                                          </span>
                                        </div>
                                        <span 
                                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            staff.redemptionCount > 0 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {staff.redemptionCount}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SimpleDashboard() {
  const { t } = useI18n();
  
  return (
    <AdminLayout>
      <div className="p-6 bg-white">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('dashboard.title', '后台管理仪表板')}
          </h1>
          <p className="text-gray-600">
            {t('dashboard.subtitle', '系统数据总览和运营状况')}
          </p>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-800">
                {t('dashboard.total_activities', '总活动数')}
              </h3>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">📅</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900 mb-1">12</div>
            <p className="text-xs text-blue-600">
              {t('dashboard.running_activities', '运营中的营销活动')}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-800">
                {t('dashboard.partner_stores', '合作门店')}
              </h3>
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">🏪</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900 mb-1">8</div>
            <p className="text-xs text-green-600">
              {t('dashboard.registered_stores', '已注册的合作门店')}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-amber-800">
                {t('dashboard.total_redemptions', '总核销量')}
              </h3>
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">✅</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-900 mb-1">245</div>
            <p className="text-xs text-amber-600">
              {t('dashboard.this_month', '本月总核销量')}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-red-800">
                {t('dashboard.active_staff', '活跃员工')}
              </h3>
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">👥</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-900 mb-1">15</div>
            <p className="text-xs text-red-600">
              {t('dashboard.authorized_staff', '拥有核销权限的员工')}
            </p>
          </div>
        </div>

        <ActivityAnalyticsSection />

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-emerald-800 font-medium">
              {t('dashboard.system_status', '系统状态: 正常运行中')} ✓
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}