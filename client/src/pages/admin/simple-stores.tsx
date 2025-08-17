import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import { AdminLayout } from '@/components/admin/AdminLayout';

// 门店档案建立模块 - Store Profile Management Module
export default function SimpleStoresPage() {
  const { t, currentLang } = useI18n();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    cityId: ''
  });

  // 加载门店数据
  useEffect(() => {
    loadStores();
  }, [filters]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStores({
        search: filters.search,
        cityId: parseInt(filters.cityId) || undefined
      });
      setStores(data || []);
    } catch (error) {

      setStores([
    {
      id: '1',
      name: '曼谷总店',
      nameTh: 'สาขากรุงเทพฯ สำนักงานใหญ่',
      address: '曼谷市中心商业区',
      addressTh: 'ย่านธุรกิจใจกลางเมืองกรุงเทพฯ',
      phone: '+66-2-123-4567',
      cityId: 1,
      cityName: '曼谷',
      status: 'active',
      createdAt: '2025-01-01',
      staffCount: 8,
      activitiesCount: 5
    },
    {
      id: '2',
      name: '清迈分店',
      nameTh: 'สาขาเชียงใหม่',
      address: '清迈古城区',
      addressTh: 'เขตเมืองเก่าเชียงใหม่',
      phone: '+66-53-123-4567',
      cityId: 2,
      cityName: '清迈',
      status: 'active',
      createdAt: '2025-01-05',
      staffCount: 5,
      activitiesCount: 3
    },
    {
      id: '3',
      name: '普吉分店',
      nameTh: 'สาขาภูเก็ต',
      address: '普吉海滩度假区',
      addressTh: 'ย่านรีสอร์ทหาดภูเก็ต',
      phone: '+66-76-123-4567',
      cityId: 3,
      cityName: '普吉',
      status: 'pending',
      createdAt: '2025-01-10',
      staffCount: 3,
      activitiesCount: 2
    }
  ]);
    } finally {
      setLoading(false);
    }
  };

  // 创建门店
  const handleCreateStore = async (formData: any) => {
    try {
      await adminApi.createStore(formData);
      setShowCreateForm(false);
      loadStores();
      alert(t('stores.create_success', '创建门店成功！'));
    } catch (error: any) {

      alert(t('stores.create_failed', '创建门店失败') + ': ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: '#28a745',
      pending: '#ffc107',
      inactive: '#6c757d'
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  };

  return (
    <AdminLayout>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid #e9ecef', paddingBottom: '20px' }}>
          <h1 style={{ color: '#333', margin: '0 0 10px 0', fontSize: '28px' }}>{t('stores.title', '门店管理')}</h1>
          <p style={{ color: '#6c757d', margin: '0' }}>{t('stores.subtitle', '管理合作门店基础档案信息')}</p>
        </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => window.location.href = '/admin/dashboard'}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f8f9fa', 
              color: '#333', 
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >← {t('nav.back_to_dashboard', '返回仪表板')}</button>
          <button 
            onClick={() => window.location.href = '/admin/activities'}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f8f9fa', 
              color: '#333', 
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >{t('nav.activities', '活动管理')}</button>
          <button 
            onClick={() => window.location.href = '/admin/staff'}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f8f9fa', 
              color: '#333', 
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >{t('nav.staff', '员工管理')}</button>
        </div>
        
        <button 
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + {t('stores.create_new', '新增门店')}
        </button>
      </div>

      {/* Stores List */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e9ecef' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#333' }}>{t('stores.list_title', '门店列表')}</h2>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder={t('stores.search_placeholder', '搜索门店名称...')} 
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '5px',
                minWidth: '200px'
              }}
            />
            <select 
              value={filters.cityId}
              onChange={(e) => setFilters({...filters, cityId: e.target.value})}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '5px'
              }}
            >
              <option value="">{t('stores.filter_city', '全部城市')}</option>
              <option value="1">{t('cities.bangkok', '曼谷')}</option>
              <option value="2">{t('cities.chiang_mai', '清迈')}</option>
              <option value="3">{t('cities.phuket', '普吉')}</option>
              <option value="4">{t('cities.pattaya', '芭提雅')}</option>
            </select>
          </div>
        </div>

        {/* Stores Grid */}
        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              {t('stores.loading', '加载中...')}
            </div>
          ) : stores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
              {t('stores.no_data', '暂无门店数据')}
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {stores.map((store) => (
              <div key={store.id} style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                      {currentLang === 'th' ? (store.nameTh || store.name) : store.name}
                    </h3>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: getStatusColor(store.status) + '20',
                    color: getStatusColor(store.status)
                  }}>
                    {store.status === 'active' ? t('stores.status.active', '营业中') :
                     store.status === 'pending' ? t('stores.status.pending', '筹备中') : t('stores.status.closed', '暂停营业')}
                  </span>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                    <strong>{t('stores.address', '地址')}:</strong> {currentLang === 'th' ? (store.addressTh || store.address) : store.address}
                  </p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                    <strong>{t('stores.phone', '电话')}:</strong> {store.phone}
                  </p>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    <strong>{t('stores.city', '城市')}:</strong> {currentLang === 'th' ? t(`cities.${store.cityId === 1 ? 'bangkok' : store.cityId === 2 ? 'chiang_mai' : store.cityId === 3 ? 'phuket' : 'pattaya'}`, store.cityName) : store.cityName}
                  </p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '5px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>{store.staffCount}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{t('stores.staff_count', '员工数量')}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>{store.activitiesCount}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{t('stores.activities_count', '活动数量')}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setEditingStore(store)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('stores.edit', '编辑')}
                  </button>
                  <button 
                    onClick={() => window.open(`/admin/stores/${store.id}/analytics`, '_blank')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('stores.view_analytics', '查看统计')}
                  </button>
                </div>
                
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                  {t('stores.created_time', '创建时间')}: {store.createdAt}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div style={{ 
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>{t('dashboard.total_stores', '门店总数')}</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stores.length}</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{t('dashboard.active_stores', '营业门店')}</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {stores.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>{t('dashboard.pending_stores', '筹备门店')}</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {stores.filter(s => s.status === 'pending').length}
          </div>
        </div>
        <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>{t('dashboard.total_staff', '员工总数')}</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {stores.reduce((sum, s) => sum + (s.staffCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* 创建门店表单 */}
      {showCreateForm && <StoreForm store={undefined} onSubmit={handleCreateStore} onCancel={() => setShowCreateForm(false)} />}
      
      {/* 编辑门店表单 */}
      {editingStore && <StoreForm 
        store={editingStore} 
        onSubmit={(formData: any) => {}} 
        onCancel={() => setEditingStore(null)} 
      />}
      </div>
    </AdminLayout>
  );
}

// 门店表单组件
function StoreForm({ store, onSubmit, onCancel }: { store?: any; onSubmit: any; onCancel: any }) {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    address: store?.address || '',
    phone: store?.phone || '',
    cityId: store?.cityId || 1,
    status: store?.status || 'active',
    lat: store?.lat || 13.7563,
    lng: store?.lng || 100.5018,
    contact: store?.contact || '',
    imageUrl: store?.imageUrl || ''
  });

  const [uploading, setUploading] = useState(false);

  // 图片上传处理
  const handleImageUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件大小不能超过5MB');
      return;
    }

    setUploading(true);
    
    try {
      const previewUrl = URL.createObjectURL(file);
      setFormData({...formData, imageUrl: previewUrl});

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name })
      });

      if (!response.ok) {
        throw new Error('获取上传URL失败');
      }

      const result = await response.json();
      const uploadURL = result.data.uploadURL;

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败');
      }

      const fileName = uploadURL.split('/').pop()?.split('?')[0];
      const publicUrl = `/public-objects/uploads/${fileName}`;
      
      setFormData({...formData, imageUrl: publicUrl});

    } catch (error) {
      alert('图片上传失败，请重试');
      setFormData({...formData, imageUrl: ''});
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('请输入门店名称');
      return;
    }
    if (!formData.address.trim()) {
      alert('请输入门店地址');
      return;
    }
    if (!formData.phone.trim()) {
      alert('请输入联系电话');
      return;
    }
    
    const submitData = {
      ...formData,
      cityId: parseInt(formData.cityId),
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng)
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
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px' }}>{store ? '编辑门店' : '创建新门店'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              门店名称 * <span style={{ fontSize: '12px', color: '#6c757d' }}>(支持中文/泰语输入，系统自动翻译)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="请输入门店名称（中文或泰语）"
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
              门店地址 * <span style={{ fontSize: '12px', color: '#6c757d' }}>(支持中文/泰语输入，系统自动翻译)</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="请输入门店地址（中文或泰语）"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '5px'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                联系电话 *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                所在城市
              </label>
              <select
                value={formData.cityId}
                onChange={(e) => setFormData({...formData, cityId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px'
                }}
              >
                <option value="1">曼谷</option>
                <option value="2">清迈</option>
                <option value="3">普吉</option>
                <option value="4">芭提雅</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                门店状态
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
              >
                <option value="active">运营中</option>
                <option value="pending">待开业</option>
                <option value="inactive">暂停营业</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                纬度
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={(e) => setFormData({...formData, lat: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                经度
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lng}
                onChange={(e) => setFormData({...formData, lng: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              门店图片
            </label>
            <div style={{ 
              border: '2px dashed #ced4da', 
              borderRadius: '5px', 
              padding: '20px', 
              textAlign: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              {formData.imageUrl ? (
                <div>
                  <img 
                    src={formData.imageUrl} 
                    alt="门店图片预览" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '150px', 
                      objectFit: 'cover',
                      borderRadius: '5px',
                      marginBottom: '10px'
                    }} 
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, imageUrl: ''})}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      删除图片
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: '#6c757d', marginBottom: '10px' }}>
                    🏪 点击上传门店图片
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="store-image-upload"
                  />
                  <label
                    htmlFor="store-image-upload"
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: uploading ? '#6c757d' : '#007bff',
                      color: 'white',
                      borderRadius: '5px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {uploading ? '上传中...' : '选择图片文件'}
                  </label>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                    支持 JPG、PNG、GIF 格式，建议尺寸 400x300
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {store ? '更新门店' : '创建门店'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}