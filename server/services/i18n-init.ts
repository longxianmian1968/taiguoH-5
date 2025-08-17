import { db } from '../db';
import { i18nTranslations } from '@shared/schema';

// 基础UI翻译数据
const baseUITranslations = {
  // Navigation and Layout
  'nav.home': '首页',
  'nav.dashboard': '仪表板',
  'nav.activities': '活动管理',
  'nav.stores': '门店管理',
  'nav.staff': '员工管理',
  'nav.statistics': '数据统计',
  'nav.i18n': '多语言管理',
  'nav.logout': '退出登录',
  
  // Bottom Navigation
  'brand.title': '品牌',
  'profile.title': '我的',
  
  // Common UI Elements
  'common.search': '搜索',
  'common.filter': '筛选',
  'common.add': '添加',
  'common.edit': '编辑',
  'common.delete': '删除',
  'common.save': '保存',
  'common.cancel': '取消',
  'common.confirm': '确认',
  'common.loading': '加载中...',
  'common.no_data': '暂无数据',
  'common.operation': '操作',
  'common.status': '状态',
  'common.date': '日期',
  'common.time': '时间',
  'common.export': '导出',
  'common.import': '导入',
  'common.refresh': '刷新',
  'common.reset': '重置',
  'common.back': '返回',
  'common.submit': '提交',
  'common.view': '查看',
  'common.manage': '管理',
  'common.settings': '设置',
  'common.retry': '重试',
  'common.expand': '展开',
  'common.collapse': '收起',
  
  // Activity Types
  'activity.type.coupon': '卡券',
  'activity.type.group': '团购',
  'activity.type.presale': '预售',
  'activity.type.franchise': '招商',
  
  // Activity Status
  'activity.status.published': '已发布',
  'activity.status.draft': '草稿',
  'activity.status.paused': '已暂停',
  'activity.status.archived': '已归档',
  
  // Activity Detail Page
  'activity.scan_instruction': '门店员工扫描此二维码进行核销',
  'activity.manual_code': '手动核销码',
  'activity.claim_instruction': '领取后显示专属核销码',
  'activity.qr_alt': '活动二维码',
  'discount.limited_time': '限时',
  
  // Time Units
  'time.remaining': '剩余时间',
  'time.expired': '已结束',
  'time.day': '天',
  'time.hour': '小时',
  'time.minute': '分钟',
  
  // Form and Quantity
  'form.quantity': '数量',
  'quantity.remaining': '剩余',
  'quantity.unit': '份',
  
  // Location and Stores
  'button.nearby': '附近门店',
  'restriction.cities': '本活动仅在：',
  'restriction.available': ' 可用',
  
  // Home Page
  'home.subtitle': '发现专属营销活动',
  'home.search_placeholder': '搜索活动...',
  'home.filter_all': '全部',
  
  // Buttons
  'button.claim': '立即领取',
  'button.join_group': '参与团购',
  'button.presale': '立即预订',
  'button.franchise': '查看详情',
  'button.load_more': '加载更多',
  
  // Errors and Empty States
  'error.load_failed': '加载失败',
  'search.no_results': '暂无活动',
  'search.try_different': '请尝试其他搜索词',
  'search.check_later': '请稍后再来查看新活动',
  
  // Dashboard
  'dashboard.title': '数据统计',
  'dashboard.subtitle': '查看活动数据和绩效统计',
  'dashboard.total_activities': '总活动数',
  'dashboard.total_stores': '总门店数',
  'dashboard.total_staff': '总员工数',
  'dashboard.total_redemptions': '总核销数',
  'dashboard.recent_activities': '最近活动',
  'dashboard.view_all': '查看全部',
  'dashboard.create_first_activity': '创建首个活动',
  'dashboard.price': '价格',
  'dashboard.quantity': '数量',
  'dashboard.store_redemption_ranking': '门店核销排行',
  'dashboard.store_redemption_ranking_desc': '各门店核销成绩排行',
  'dashboard.activity_type_distribution': '活动类型分布',
  'dashboard.activity_type_distribution_desc': '按活动类型统计核销分布',
  'dashboard.redemptions': '次核销',
  
  // Activities Management
  'activities.title': '活动管理',
  'activities.subtitle': '管理活动的创建、编辑和发布',
  'activities.create_new': '创建新活动',
  'activities.list_title': '活动列表',
  'activities.search_placeholder': '搜索活动名称...',
  'activities.filter_type': '全部类型',
  'activities.filter_status': '全部状态',
  'activities.title_col': '活动信息',
  'activities.type_col': '类型',
  'activities.status_col': '状态',
  'activities.price_col': '价格',
  'activities.usage_col': '使用情况',
  'activities.created_col': '创建时间',
  'activities.action_col': '操作',
  'activities.edit_btn': '编辑',
  'activities.view_btn': '查看',
  'activities.analytics_title': '活动数据统计',
  'activities.commission_analytics': '活动数据统计（用于提成核算）',
  'activities.show_all_data': '显示所有门店和导购的核销数据',
  
  // Time Filters
  'common.last_7_days': '最近7天',
  'common.last_30_days': '最近30天',
  'common.last_90_days': '最近90天',
  'common.last_1_year': '最近1年',
  'common.export_data': '导出数据',
  'common.view_details': '查看详情',
  'common.create_demo_data': '创建演示数据',
  'common.data_load_failed': '数据加载失败',
  'common.try_create_demo': '请尝试创建演示数据查看效果',
  'common.no_activity_data': '暂无活动数据',
  'common.click_create_demo': '点击"创建演示数据"查看效果',
};

export class I18nInitService {
  async initializeUITranslations() {
    console.log('🌍 开始初始化UI翻译数据...');
    
    try {
      // Clear existing UI translations
      await db.delete(i18nTranslations);
      
      // Insert Chinese (source) translations
      const chineseTranslations = Object.entries(baseUITranslations).map(([key, value]) => ({
        lang: 'zh' as const,
        key,
        value,
        role: 'ui' as const,
        isOverride: false,
        needsReview: false
      }));
      
      await db.insert(i18nTranslations).values(chineseTranslations);
      console.log(`✅ 插入 ${chineseTranslations.length} 条中文UI翻译`);
      
      // Create basic Thai translations (manual pre-translated for deployment)
      console.log('🔄 插入基础泰文翻译...');
      const thaiTranslations = Object.entries(baseUITranslations).map(([key, value]) => ({
        lang: 'th' as const,
        key,
        value: key === 'app.title' ? 'WiseNest Marketing' : value, // Keep original for now
        role: 'ui' as const,
        isOverride: false,
        needsReview: false
      }));
      
      await db.insert(i18nTranslations).values(thaiTranslations);
      console.log(`✅ 插入 ${thaiTranslations.length} 条泰文UI翻译`);
      
      console.log('🎉 UI翻译数据初始化完成！');
      return { success: true, count: chineseTranslations.length + thaiTranslations.length };
    } catch (error) {
      console.error('❌ UI翻译数据初始化失败:', error);
      throw error;
    }
  }
}

export const i18nInitService = new I18nInitService();