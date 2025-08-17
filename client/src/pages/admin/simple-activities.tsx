import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SimpleUploadButton } from '@/components/SimpleUploadButton';
import { Upload } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  titleTh?: string;
  type: 'coupon' | 'group' | 'presale' | 'franchise';
  status: 'published' | 'draft' | 'paused' | 'archived';
  price: string;
  listPrice?: string;
  quantity: number;
  usedCount?: number;
  coverUrl: string;
  rules?: string;
  rulesTh?: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt?: string;
  // 统一架构：使用activity_store映射表，不再使用appliesAllStores和includeStoreIds
  storeIds?: string[]; // 适用门店ID列表（从activity_store表加载）
}

interface ActivityFormData {
  title: string;
  type: string;
  status: string;
  price: string;
  listPrice: string;
  quantity: string;
  coverUrl: string;
  coverUrls?: string[]; // 多图轮播数组
  rules: string;
  startAt: string;
  endAt: string;
  selectedStoreIds: string[]; // 统一架构：直接使用selectedStoreIds
  selectedCityId: string;
  
  // 团购专用字段
  groupNRequired?: number;
  groupTimeLimitHours?: number;
  groupUseValidHours?: number;
  groupAllowCrossStore?: boolean;
  
  // 预售专用字段
  presalePickupStart?: string;
  presalePickupEnd?: string;
  presaleArrivalNotice?: boolean;
  
  // 招商专用字段
  franchiseFormFields?: any[];
  franchiseDefaultOwner?: string;
}

// 活动内容创建模块 - Activity Content Creation Module
export default function SimpleActivitiesPage() {
  const { t } = useI18n();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  });
  const [cities, setCities] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 加载活动数据
  useEffect(() => {
    loadActivities();
    loadCities();
    loadStores();
  }, [filters]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getActivities(filters);
      setActivities(data || []);
    } catch (error) {
      console.error('Load activities error:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const cities = await adminApi.getCities();
      setCities(cities || []);
    } catch (error) {
      console.error('Load cities error:', error);
    }
  };

  const loadStores = async (cityId?: string) => {
    try {
      const stores = await adminApi.getStores(cityId ? { cityId: parseInt(cityId) } : {});
      setStores(stores || []);
    } catch (error) {
      console.error('Load stores error:', error);
    }
  };

  const handleCreateActivity = async (formData: ActivityFormData) => {
    try {
      // 创建活动 - 共用底座+模块化架构版本
      const activity = await adminApi.createActivity({
        title: formData.title,
        type: formData.type,
        status: formData.status,
        price: formData.price,
        listPrice: formData.listPrice || undefined,
        quantity: parseInt(formData.quantity),
        coverUrl: formData.coverUrl,
        rules: formData.rules,
        startAt: new Date(formData.startAt),
        endAt: new Date(formData.endAt),
        // 模块化配置数据
        moduleConfig: {
          // 团购配置
          ...(formData.type === 'group' && {
            groupNRequired: formData.groupNRequired,
            groupTimeLimitHours: formData.groupTimeLimitHours,
            groupUseValidHours: formData.groupUseValidHours,
            groupAllowCrossStore: formData.groupAllowCrossStore
          }),
          // 预售配置
          ...(formData.type === 'presale' && {
            presalePickupStart: formData.presalePickupStart,
            presalePickupEnd: formData.presalePickupEnd,
            presaleArrivalNotice: formData.presaleArrivalNotice
          }),
          // 招商配置
          ...(formData.type === 'franchise' && {
            franchiseDefaultOwner: formData.franchiseDefaultOwner
          })
        }
      });

      // 保存门店映射关系
      if (activity?.id && formData.selectedStoreIds.length > 0) {
        await fetch(`/admin/api/activities/${activity.id}/stores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeIds: formData.selectedStoreIds })
        });
      }
      
      setShowCreateForm(false);
      loadActivities();
    } catch (error) {
      console.error('Create activity error:', error);
      alert(t('activities.create_failed', '创建活动失败，请重试'));
    }
  };

  const handleEditActivity = async (formData: ActivityFormData) => {
    if (!editingActivity) return;
    
    try {
      // 更新活动基本信息
      await adminApi.updateActivity(editingActivity.id, {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        price: parseFloat(formData.price),
        listPrice: formData.listPrice ? parseFloat(formData.listPrice) : undefined,
        quantity: parseInt(formData.quantity),
        coverUrl: formData.coverUrl,
        rules: formData.rules
      });

      // 更新门店映射关系 - 统一架构
      await fetch(`/admin/api/activities/${editingActivity.id}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeIds: formData.selectedStoreIds })
      });
      
      setEditingActivity(null);
      loadActivities();
    } catch (error) {
      console.error('Update activity error:', error);
      alert(t('activities.update_failed', '更新活动失败，请重试'));
    }
  };

  const typeLabels: Record<string, string> = {
    coupon: t('activities.type_coupon', '优惠券'),
    group: t('activities.type_group', '团购'),
    presale: t('activities.type_presale', '预售'),
    franchise: t('activities.type_franchise', '招商')
  };

  const statusLabels: Record<string, string> = {
    published: t('activities.status_published', '已发布'),
    draft: t('activities.status_draft', '草稿'),
    paused: t('activities.status_paused', '暂停'),
    archived: t('activities.status_archived', '已归档')
  };

  const getTypeLabel = (type: string) => typeLabels[type] || type;
  const getStatusLabel = (status: string) => statusLabels[status] || status;
  
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const formatted = Number(numPrice).toFixed(2);
    return '฿' + formatted;
  };

  return (
    <AdminLayout>
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {t('activities.page_title', '活动管理')}
          </h1>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {t('activities.create_new', '创建新活动')}
          </button>
        </div>

        {/* 筛选器 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <input
            type="text"
            placeholder={t('activities.search_placeholder', '搜索活动标题...')}
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            style={{
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
          
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            style={{
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            <option value="">{t('activities.all_types', '所有类型')}</option>
            <option value="coupon">{t('activities.type_coupon', '优惠券')}</option>
            <option value="group">{t('activities.type_group', '团购')}</option>
            <option value="presale">{t('activities.type_presale', '预售')}</option>
            <option value="franchise">{t('activities.type_franchise', '招商')}</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            style={{
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          >
            <option value="">{t('activities.all_statuses', '所有状态')}</option>
            <option value="published">{t('activities.status_published', '已发布')}</option>
            <option value="draft">{t('activities.status_draft', '草稿')}</option>
            <option value="paused">{t('activities.status_paused', '暂停')}</option>
            <option value="archived">{t('activities.status_archived', '已归档')}</option>
          </select>
        </div>

        {/* 活动列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            {t('common.loading', '加载中...')}
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            {t('activities.no_activities', '暂无活动数据')}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px' 
          }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    backgroundColor: activity.status === 'published' ? '#10b981' : activity.status === 'draft' ? '#6c757d' : activity.status === 'paused' ? '#f59e0b' : '#ef4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {getStatusLabel(activity.status)}
                  </span>
                  <span style={{
                    backgroundColor: '#e9ecef',
                    color: '#495057',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {getTypeLabel(activity.type)}
                  </span>
                </div>

                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#2d3748'
                }}>
                  {activity.title}
                </h3>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                    {activity?.price ? formatPrice(activity.price) : '฿0.00'}
                  </span>
                  {activity?.listPrice && activity.listPrice > (activity?.price || 0) && (
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#6c757d', 
                      textDecoration: 'line-through',
                      marginLeft: '8px'
                    }}>
                      {formatPrice(activity.listPrice)}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
                  {t('activities.quantity_used', '库存')}: {(activity?.usedCount || 0)}/{activity?.quantity || 0}
                </div>

                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '15px' }}>
                  {t('activities.created_at', '创建时间')}: {activity?.createdAt ? new Date(activity.createdAt).toLocaleDateString() : '-'}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setEditingActivity(activity)}
                    style={{
                      flex: 1,
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {t('common.edit', '编辑')}
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (confirm(t('activities.delete_confirm', '确认删除此活动？'))) {
                        try {
                          await adminApi.deleteActivity(activity.id);
                          alert(t('activities.delete_success', '删除成功'));
                          loadActivities();
                        } catch (error) {
                          console.error('Delete error:', error);
                          alert(t('activities.delete_failed', '删除失败，请重试'));
                        }
                      }
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {t('common.delete', '删除')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 创建表单弹窗 */}
        {showCreateForm && (
          <ActivityForm
            onSubmit={handleCreateActivity}
            onCancel={() => setShowCreateForm(false)}
            cities={cities}
            stores={stores}
            onLoadStores={loadStores}
            uploadingImage={uploadingImage}
            setUploadingImage={setUploadingImage}
          />
        )}

        {/* 编辑表单弹窗 */}
        {editingActivity && (
          <ActivityForm
            activity={editingActivity}
            onSubmit={handleEditActivity}
            onCancel={() => setEditingActivity(null)}
            cities={cities}
            stores={stores}
            onLoadStores={loadStores}
            uploadingImage={uploadingImage}
            setUploadingImage={setUploadingImage}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// 活动表单组件
interface ActivityFormProps {
  activity?: Activity;
  onSubmit: (formData: ActivityFormData) => Promise<void>;
  onCancel: () => void;
  cities: any[];
  stores: any[];
  onLoadStores: (cityId?: string) => void;
  uploadingImage: boolean;
  setUploadingImage: (uploading: boolean) => void;
}

function ActivityForm({ activity, onSubmit, onCancel, cities, stores, onLoadStores, uploadingImage, setUploadingImage }: ActivityFormProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<ActivityFormData>({
    title: activity?.title || '',
    type: activity?.type || 'coupon',
    status: activity?.status || 'draft',
    price: activity?.price || '',
    listPrice: activity?.listPrice || '',
    quantity: activity?.quantity?.toString() || '',
    coverUrl: activity?.coverUrl || '', // 活动封面图片
    rules: activity?.rules || '',
    startAt: activity?.startAt ? new Date(activity.startAt).toISOString().slice(0, 16) : '',
    endAt: activity?.endAt ? new Date(activity.endAt).toISOString().slice(0, 16) : '',
    selectedStoreIds: activity?.storeIds || [], // 统一架构：从activity.storeIds加载
    selectedCityId: ''
  });

  // 加载活动的门店映射关系
  useEffect(() => {
    if (activity?.id) {
      loadActivityStores(activity.id);
    }
  }, [activity?.id]);

  const loadActivityStores = async (activityId: string) => {
    try {
      const response = await fetch(`/admin/api/activities/${activityId}/stores`);
      if (response.ok) {
        const data = await response.json();
        const storeIds = data.data?.map((store: any) => store.id) || [];
        setFormData(prev => ({ ...prev, selectedStoreIds: storeIds }));
      }
    } catch (error) {
      console.error('Failed to load activity stores:', error);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.title || !formData.price || !formData.quantity || (!formData.coverUrl && (!formData.coverUrls || formData.coverUrls.length === 0))) {
      alert(t('activities.required_fields', '请填写必填字段（至少需要一张封面图片）'));
      return;
    }

    if (!activity && (!formData.startAt || !formData.endAt)) {
      alert(t('activities.time_selection_required', '请选择活动开始和结束时间'));
      return;
    }

    if (formData.selectedStoreIds.length === 0) {
      alert(t('activities.store_selection_required', '请至少选择一家门店'));
      return;
    }

    // 确保数据类型正确
    const submitData: ActivityFormData = {
      ...formData,
      price: formData.price, // 保持字符串格式
      listPrice: formData.listPrice, // 保持字符串格式
      quantity: formData.quantity, // 保持字符串格式
      startAt: formData.startAt,
      endAt: formData.endAt,
      coverUrls: formData.coverUrls || [], // 多图轮播数组
    };

    onSubmit(submitData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px' }}>
          {activity ? t('activities.form_title_edit', '编辑活动') : t('activities.form_title_create', '创建新活动')}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {t('activities.activity_title_label', '活动标题')} * 
              <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '8px' }}>
                {t('activities.multi_lang_support', '(支持中文/泰语输入，系统自动翻译)')}
              </span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder={t('activities.title_placeholder', '请输入活动标题（中文或泰语）')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '5px'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {t('activities.activity_type_label', '活动类型')} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px'
                }}
                required
              >
                <option value="coupon">{t('activities.type_coupon', '优惠券')}</option>
                <option value="group">{t('activities.type_group', '团购')}</option>
                <option value="presale">{t('activities.type_presale', '预售')}</option>
                <option value="franchise">{t('activities.type_franchise', '招商')}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {t('activities.status_label', '状态')} *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px'
                }}
                required
              >
                <option value="draft">{t('activities.status_draft', '草稿')}</option>
                <option value="published">{t('activities.status_published', '已发布')}</option>
                <option value="paused">{t('activities.status_paused', '暂停')}</option>
                <option value="archived">{t('activities.status_archived', '已归档')}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {t('activities.price_label', '价格')} (฿) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {t('activities.list_price_label', '原价')} (฿)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.listPrice}
                onChange={(e) => setFormData({...formData, listPrice: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {t('activities.quantity_label', '数量')} *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '5px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {t('activities.cover_images_label', '封面图片')} * 
              <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '8px' }}>
                (支持1-5张图片轮播)
              </span>
            </label>
            <div style={{ border: '2px dashed #e5e7eb', borderRadius: '8px', padding: '20px' }}>
              {/* 已上传的图片展示 */}
              {(formData.coverUrls && formData.coverUrls.length > 0) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {formData.coverUrls.map((url, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={url} 
                          alt={`封面 ${index + 1}`}
                          style={{ 
                            width: '80px', 
                            height: '80px', 
                            objectFit: 'cover', 
                            borderRadius: '6px',
                            border: '2px solid #e5e7eb'
                          }}
                        />
                        {index === 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '-8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            fontWeight: 'bold'
                          }}>
                            主图
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newUrls = formData.coverUrls!.filter((_, i) => i !== index);
                            setFormData({
                              ...formData,
                              coverUrls: newUrls,
                              coverUrl: newUrls[0] || ''
                            });
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 上传按钮 */}
              {(!formData.coverUrls || formData.coverUrls.length < 5) && (
                <SimpleUploadButton
                  onUploadSuccess={(url) => {
                    const currentUrls = formData.coverUrls || [];
                    const newUrls = [...currentUrls, url];
                    setFormData({
                      ...formData,
                      coverUrls: newUrls,
                      coverUrl: newUrls[0] || url // 第一张作为主图
                    });
                  }}
                  disabled={uploadingImage}
                  // multiple={true}
                >
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '20px',
                    color: '#6b7280'
                  }}>
                    <Upload style={{ width: '24px', height: '24px' }} />
                    <span>
                      {uploadingImage ? '上传中...' : 
                       !formData.coverUrls?.length ? '选择图片 (1-5张)' : 
                       `添加更多图片 (${formData.coverUrls.length}/5)`
                      }
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      支持轮播展示，第一张为主图
                    </span>
                  </div>
                </SimpleUploadButton>
              )}
            </div>
          </div>

          {!activity && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {t('activities.start_date_label', '开始时间')} *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({...formData, startAt: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {t('activities.end_date_label', '结束时间')} *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({...formData, endAt: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px'
                  }}
                  required
                />
              </div>
            </div>
          )}

          {/* 团购专用配置 */}
          {formData.type === 'group' && (
            <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', color: '#065f46' }}>
                {t('activities.group_settings', '团购设置')}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('activities.group_required_participants', '成团人数')} *
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={formData.groupNRequired || 2}
                    onChange={(e) => setFormData({...formData, groupNRequired: parseInt(e.target.value) || 2})}
                    placeholder="2"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '5px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('activities.group_time_limit', '成团时限')} *
                    <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '4px' }}>(小时)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.groupTimeLimitHours || 24}
                    onChange={(e) => setFormData({...formData, groupTimeLimitHours: parseInt(e.target.value) || 24})}
                    placeholder="24"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '5px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('activities.group_use_valid', '券使用期限')} *
                    <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '4px' }}>(小时)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={formData.groupUseValidHours || 72}
                    onChange={(e) => setFormData({...formData, groupUseValidHours: parseInt(e.target.value) || 72})}
                    placeholder="72"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '5px'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={formData.groupAllowCrossStore || false}
                    onChange={(e) => setFormData({...formData, groupAllowCrossStore: e.target.checked})}
                  />
                  <span>{t('activities.group_allow_cross_store', '允许跨店核销')}</span>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>
                    ({t('activities.group_cross_store_desc', '勾选后用户可在任意适用门店核销')})
                  </span>
                </label>
              </div>

              <div style={{ backgroundColor: '#ecfccb', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#365314' }}>
                <strong>{t('activities.group_workflow_title', '团购流程说明')}:</strong><br />
                1. {t('activities.group_workflow_1', '用户开团，邀请好友参团')}<br />
                2. {t('activities.group_workflow_2', `达到${formData.groupNRequired || 2}人且在${formData.groupTimeLimitHours || 24}小时内成团`)}<br />
                3. {t('activities.group_workflow_3', `成团后自动发券，券在${formData.groupUseValidHours || 72}小时内有效`)}<br />
                4. {t('activities.group_workflow_4', '用户持券到店付款取货，员工扫码核销')}
              </div>
            </div>
          )}

          {/* 预售专用配置 */}
          {formData.type === 'presale' && (
            <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px', backgroundColor: '#fef3c7' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>
                {t('activities.presale_settings', '预售设置')}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('activities.presale_pickup_start', '提货开始时间')} *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.presalePickupStart || ''}
                    onChange={(e) => setFormData({...formData, presalePickupStart: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '5px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('activities.presale_pickup_end', '提货结束时间')} *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.presalePickupEnd || ''}
                    onChange={(e) => setFormData({...formData, presalePickupEnd: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '5px'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={formData.presaleArrivalNotice !== false}
                    onChange={(e) => setFormData({...formData, presaleArrivalNotice: e.target.checked})}
                  />
                  <span>{t('activities.presale_arrival_notice', '开启到货提醒')}</span>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>
                    ({t('activities.presale_notice_desc', '勾选后到货时自动通知用户')})
                  </span>
                </label>
              </div>

              <div style={{ backgroundColor: '#fef3e2', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>
                <strong>{t('activities.presale_workflow_title', '预售流程说明')}:</strong><br />
                1. {t('activities.presale_workflow_1', '用户预付款预约商品')}<br />
                2. {t('activities.presale_workflow_2', '商品到货后系统自动通知用户')}<br />
                3. {t('activities.presale_workflow_3', '用户在提货时间窗内到店提取商品')}<br />
                4. {t('activities.presale_workflow_4', '员工扫码核销，完成预售流程')}
              </div>
            </div>
          )}

          {/* 招商专用配置 */}
          {formData.type === 'franchise' && (
            <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px', backgroundColor: '#f0f4ff' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>
                {t('activities.franchise_settings', '招商设置')}
              </h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {t('activities.franchise_form_name', '表单名称')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder={t('activities.franchise_form_placeholder', '如：泰国地区加盟申请表')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {t('activities.franchise_default_owner', '默认负责人')}
                </label>
                <select
                  value={formData.franchiseDefaultOwner || ''}
                  onChange={(e) => setFormData({...formData, franchiseDefaultOwner: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px'
                  }}
                >
                  <option value="">{t('activities.franchise_select_owner', '选择负责人')}</option>
                  <option value="admin">{t('activities.franchise_admin', '管理员')}</option>
                  {/* TODO: 从users表加载实际用户列表 */}
                </select>
              </div>

              <div style={{ backgroundColor: '#dbeafe', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#1e40af' }}>
                <strong>{t('activities.franchise_workflow_title', '招商流程说明')}:</strong><br />
                1. {t('activities.franchise_workflow_1', '用户填写加盟申请表单')}<br />
                2. {t('activities.franchise_workflow_2', '系统生成线索记录，分配给负责人')}<br />
                3. {t('activities.franchise_workflow_3', '负责人跟进联系：new → contacted → intent → visit → negotiation')}<br />
                4. {t('activities.franchise_workflow_4', '最终结果：signed(签约成功) 或 dropped(放弃)')}
                <br /><br />
                <strong>{t('activities.franchise_form_fields_note', '注意')}:</strong>
                {t('activities.franchise_form_fields_desc', '招商表单字段将根据标准模板自动生成（姓名、手机、城市、预算、意向等），支持中泰双语')}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {t('activities.rules_label', '规则说明')} 
              <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '8px' }}>
                {t('activities.multi_lang_support', '(支持中文/泰语输入，系统自动翻译)')}
              </span>
            </label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({...formData, rules: e.target.value})}
              placeholder={formData.type === 'group' ? 
                t('activities.group_rules_placeholder', '请输入团购规则说明（如：商品描述、使用限制、退款政策等）') :
                t('activities.rules_placeholder', '请输入活动规则说明（中文或泰语）')
              }
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '5px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 门店选择部分 */}
          <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
              {t('activities.store_selection', '门店选择')}
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '14px', color: '#6c757d', margin: '0 0 10px 0' }}>
                {t('activities.store_selection_desc', '请选择活动适用的门店。用户将在这些门店中看到「就近推荐」功能。')}
              </p>
            </div>

            <div>
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('activities.select_city', '选择城市')}
                  </label>
                  <select
                    value={formData.selectedCityId}
                    onChange={(e) => {
                      setFormData({...formData, selectedCityId: e.target.value, selectedStoreIds: []});
                      onLoadStores(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '5px'
                    }}
                  >
                    <option value="">{t('activities.all_cities', '所有城市')}</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('activities.select_stores', '选择门店')} ({formData.selectedStoreIds.length} {t('activities.stores_selected', '已选择')})
                  </label>
                  <div style={{ 
                    maxHeight: '200px', 
                    overflow: 'auto', 
                    border: '1px solid #ced4da', 
                    borderRadius: '5px',
                    padding: '10px'
                  }}>
                    {stores.length > 0 ? (
                      stores.map((store) => (
                        <label key={store.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            checked={formData.selectedStoreIds.includes(store.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({...formData, selectedStoreIds: [...formData.selectedStoreIds, store.id]});
                              } else {
                                setFormData({...formData, selectedStoreIds: formData.selectedStoreIds.filter(id => id !== store.id)});
                              }
                            }}
                          />
                          <span>{store.name} - {store.address}</span>
                        </label>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                        {t('activities.no_stores', '暂无门店数据')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
                  {formData.selectedStoreIds.length > 0 ? 
                    t('activities.coverage_summary', `已选择 ${formData.selectedStoreIds.length} 家门店`) :
                    t('activities.no_store_selected', '请至少选择一家门店')
                  }
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                border: '1px solid #ced4da',
                borderRadius: '5px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {t('common.cancel', '取消')}
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                backgroundColor: '#10b981',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {activity ? t('common.save', '保存') : t('common.create', '创建')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}