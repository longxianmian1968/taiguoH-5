import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { adminApi } from '@/lib/admin-api';
import { MobileBlock } from '@/components/admin/MobileBlock';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Search, Users, Store, Shield, ShieldCheck, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminStaffPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    storeId: 'all',
  });

  // Dialog state
  const [newStaffDialogOpen, setNewStaffDialogOpen] = useState(false);
  const [staffDetailsDialogOpen, setStaffDetailsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    lineId: '',
    storeId: '',
    canVerify: false,
  });

  // LINE binding state
  const [showBindingModal, setShowBindingModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [generatedBinding, setGeneratedBinding] = useState<any>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch stores for filter dropdown
  const { data: stores = [] } = useQuery({
    queryKey: ['/admin/api/stores'],
    queryFn: () => adminApi.getStores(),
  });

  // Fetch staff
  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['/admin/api/staff', filters],
    queryFn: () => adminApi.getStaff({
      storeId: filters.storeId || undefined,
      search: filters.search || undefined,
    }),
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: any) => {
      return await adminApi.createStaff(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/staff'] });
      toast({
        title: t('success.staff_created', '员工创建成功'),
      });
      setNewStaffDialogOpen(false);
      setNewStaffData({
        name: '',
        lineId: '',
        storeId: '',
        canVerify: false,
      });
    },
    onError: (error) => {
      toast({
        title: t('error.create_failed', '创建失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Update authorization mutation
  const updateAuthMutation = useMutation({
    mutationFn: async ({ id, storeId, canVerify }: { id: string; storeId: string; canVerify: boolean }) => {
      return await adminApi.updateStaffAuthorization(id, storeId, canVerify);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/staff'] });
      toast({
        title: t('success.auth_updated', '权限更新成功'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error.update_failed', '更新失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async ({ staffId, storeId }: { staffId: string; storeId: string }) => {
      return await adminApi.removeStaff(staffId, storeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/staff'] });
      toast({
        title: t('success.staff_deleted', '员工删除成功'),
      });
      setDeleteConfirmOpen(false);
      setSelectedStaff(null);
    },
    onError: (error) => {
      toast({
        title: t('error.delete_failed', '删除失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Get staff details query
  const { data: staffDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/admin/api/staff-details', selectedStaff?.id, selectedStaff?.storeId],
    queryFn: () => selectedStaff ? adminApi.getStaffDetails(selectedStaff.id, selectedStaff.storeId) : null,
    enabled: !!selectedStaff && staffDetailsDialogOpen,
  });

  // Event handlers
  const handleFilterChange = (field: string, value: string) => {
    if (field === 'storeId' && value === 'all') {
      setFilters(prev => ({ ...prev, [field]: '' }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNewStaff = () => {
    setNewStaffDialogOpen(true);
  };

  const handleCreateStaff = () => {
    if (!newStaffData.name.trim() || !newStaffData.lineId.trim() || !newStaffData.storeId) {
      toast({
        title: t('error.fields_required', '请填写所有必填字段'),
        variant: 'destructive',
      });
      return;
    }

    createStaffMutation.mutate(newStaffData);
  };

  const handleToggleAuth = (staff: any) => {
    updateAuthMutation.mutate({
      id: staff.id,
      storeId: staff.storeId,
      canVerify: !staff.canVerify,
    });
  };

  const handleViewDetails = (staff: any) => {
    setSelectedStaff(staff);
    setStaffDetailsDialogOpen(true);
  };

  const handleDeleteStaff = (staff: any) => {
    setSelectedStaff(staff);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedStaff) {
      deleteStaffMutation.mutate({
        staffId: selectedStaff.id,
        storeId: selectedStaff.storeId,
      });
    }
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find((s: any) => s.id === storeId);
    return store?.name || storeId;
  };

  // Generate QR code when binding is created
  useEffect(() => {
    if (generatedBinding?.qrCodeData && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, generatedBinding.qrCodeData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error: Error | null | undefined) => {
        if (error) {
          console.error('生成二维码失败:', error);
        }
      });
    }
  }, [generatedBinding]);

  // Generate store binding
  const generateStoreBinding = async () => {
    try {
      if (!selectedStoreId) {
        toast({
          title: t('error.fields_required', '请选择门店'),
          variant: 'destructive',
        });
        return;
      }
      
      const result = await adminApi.generateStoreBinding(selectedStoreId, { noteName: '', mobile: '' });
      setGeneratedBinding(result);
    } catch (error) {
      console.error('生成绑定邀请失败:', error);
      toast({
        title: t('error.generate_binding_failed', '生成绑定邀请失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('success.copied', '已复制到剪贴板'),
      });
    } catch (error) {
      toast({
        title: t('error.copy_failed', '复制失败'),
        variant: 'destructive',
      });
    }
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
                <h1 className="text-2xl font-bold text-secondary">{t('staff.title', '员工管理')}</h1>
                <p className="text-tertiary mt-1">{t('staff.subtitle', '管理门店员工及核销权限')}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowBindingModal(true)}
                  className="btn-desktop bg-green-600 hover:bg-green-700 text-white px-6 font-semibold"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('staff.generate_binding', '生成绑定邀请')}
                </Button>
                <Button
                  onClick={handleNewStaff}
                  className="btn-desktop btn-primary px-6 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('staff.create_new', '新增员工')}
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
                <Label htmlFor="search" className="text-sm font-medium text-secondary mb-2 block">
{t('staff.search_placeholder', '员工姓名或LINE ID')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                  <Input
                    id="search"
                    placeholder={t('staff.search_placeholder', '员工姓名或LINE ID')}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="store-filter" className="text-sm font-medium text-secondary mb-2 block">
                  {t('staff.store_filter', '筛选门店')}
                </Label>
                <Select value={filters.storeId || 'all'} onValueChange={(value) => handleFilterChange('storeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('staff.select_store', '选择门店')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('staff.all_stores', '所有门店')}</SelectItem>
                    {stores.map((store: any) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="container-desktop px-4 pb-8">
          <div className="bg-white rounded-lg border">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 rounded-t-lg border-b font-medium text-sm text-secondary">
              <div>{t('staff.name_col', '员工姓名')}</div>
              <div>LINE ID</div>
              <div>{t('staff.store_col', '所属门店')}</div>
              <div>{t('staff.verify_permission', '核销权限')}</div>
              <div>{t('staff.recent_verifications', '最近核销')}</div>
              <div>{t('staff.created_time', '添加时间')}</div>
              <div>{t('staff.actions', '操作')}</div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-8 text-center text-tertiary">
                <Users className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>{t('staff.loading', '正在加载员工列表...')}</p>
              </div>
            )}

            {/* Staff Rows */}
            {!isLoading && (
              <div>
                {staffList.length === 0 ? (
                  <div className="p-8 text-center text-tertiary">
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p>{t('staff.no_data', '暂无员工数据')}</p>
                    <p className="text-sm mt-1">{t('staff.add_instruction', '点击"新增员工"开始管理门店员工')}</p>
                  </div>
                ) : (
                  staffList.map((staff: any) => (
                    <div key={staff.id} className="grid grid-cols-7 gap-4 p-4 border-b hover:bg-gray-50 transition-colors items-center">
                      <div className="font-medium text-secondary">{staff.name}</div>
                      <div className="text-tertiary font-mono text-sm">{staff.lineId}</div>
                      <div className="text-secondary">
                        <div className="flex items-center">
                          <Store className="w-4 h-4 mr-1 text-tertiary" />
                          {staff.storeName}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {staff.canVerify ? (
                              <ShieldCheck className="w-4 h-4 text-green-600 mr-1" />
                            ) : (
                              <Shield className="w-4 h-4 text-gray-400 mr-1" />
                            )}
                            <Badge variant={staff.canVerify ? "default" : "secondary"}>
                              {staff.canVerify ? t('staff.can_verify', '可核销') : t('staff.no_permission', '无权限')}
                            </Badge>
                          </div>
                          <Switch
                            checked={staff.canVerify}
                            onCheckedChange={() => handleToggleAuth(staff)}
                            disabled={updateAuthMutation.isPending}
                          />
                        </div>
                      </div>
                      <div className="text-tertiary text-sm">
                        {staff.recentRedemptions || 0} {t('staff.times', '次')}
                      </div>
                      <div className="text-tertiary text-sm">
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('zh-CN') : '-'}
                      </div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(staff)}>
                              <Eye className="w-4 h-4 mr-2" />
                              {t('staff.view_details', 'ดูรายละเอียด')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleAuth(staff)}
                              disabled={updateAuthMutation.isPending}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              {staff.canVerify ? t('staff.revoke_permission', 'เพิกถอนสิทธิ์') : t('staff.grant_permission', 'มอบสิทธิ์')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStaff(staff)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t('staff.delete', 'ลบพนักงาน')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Staff Dialog */}
        <Dialog open={newStaffDialogOpen} onOpenChange={setNewStaffDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加员工</DialogTitle>
              <DialogDescription>
                为门店添加新员工并设置核销权限
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="staff-name">员工姓名 *</Label>
                <Input
                  id="staff-name"
                  placeholder="请输入员工姓名"
                  value={newStaffData.name}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="line-id">LINE ID *</Label>
                <Input
                  id="line-id"
                  placeholder="请输入LINE用户ID"
                  value={newStaffData.lineId}
                  onChange={(e) => setNewStaffData(prev => ({ ...prev, lineId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="staff-store">所属门店 *</Label>
                <Select 
                  value={newStaffData.storeId} 
                  onValueChange={(value) => setNewStaffData(prev => ({ ...prev, storeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择门店" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store: any) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="can-verify"
                  checked={newStaffData.canVerify}
                  onCheckedChange={(checked) => setNewStaffData(prev => ({ ...prev, canVerify: checked }))}
                />
                <Label htmlFor="can-verify">授予核销权限</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewStaffDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleCreateStaff}
                disabled={createStaffMutation.isPending}
              >
                {createStaffMutation.isPending ? '创建中...' : '创建员工'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Staff Details Dialog */}
        <Dialog open={staffDetailsDialogOpen} onOpenChange={setStaffDetailsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>员工详细信息</DialogTitle>
              <DialogDescription>
                查看员工基本信息和核销绩效统计
              </DialogDescription>
            </DialogHeader>
            {isLoadingDetails ? (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p>加载详情中...</p>
              </div>
            ) : staffDetails ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-secondary">基本信息</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-tertiary">姓名:</span>
                      <span className="ml-2 font-medium">{staffDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-tertiary">LINE ID:</span>
                      <span className="ml-2 font-mono">{staffDetails.lineId}</span>
                    </div>
                    <div>
                      <span className="text-tertiary">所属门店:</span>
                      <span className="ml-2">{staffDetails.storeName}</span>
                    </div>
                    <div>
                      <span className="text-tertiary">核销权限:</span>
                      <Badge variant={staffDetails.canVerify ? "default" : "secondary"} className="ml-2">
                        {staffDetails.canVerify ? '已授权' : '无权限'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-tertiary">入职时间:</span>
                      <span className="ml-2">{staffDetails.createdAt ? new Date(staffDetails.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
                    </div>
                    <div>
                      <span className="text-tertiary">角色:</span>
                      <span className="ml-2">{staffDetails.role === 'staff' ? '员工' : staffDetails.role}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="space-y-3">
                  <h4 className="font-medium text-secondary">核销绩效</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{staffDetails.performance?.totalRedemptions || 0}</div>
                      <div className="text-sm text-blue-600">累计核销</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{staffDetails.performance?.thisMonthRedemptions || 0}</div>
                      <div className="text-sm text-green-600">本月核销</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{staffDetails.performance?.lastWeekRedemptions || 0}</div>
                      <div className="text-sm text-purple-600">最近一周</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{staffDetails.performance?.averageDailyRedemptions || 0}</div>
                      <div className="text-sm text-orange-600">日均核销</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-tertiary">
                <p>无法加载员工详情</p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStaffDetailsDialogOpen(false)}
              >
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* LINE Binding Modal */}
        <Dialog open={showBindingModal} onOpenChange={setShowBindingModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('staff.line_binding_title', '为门店生成绑定邀请')}</DialogTitle>
              <DialogDescription>
                {t('staff.line_binding_desc', '选择门店生成通用绑定邀请，发送给门店老板，由门店老板决定哪些员工需要核销权限')}
              </DialogDescription>
            </DialogHeader>

            {!generatedBinding ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="store-select" className="text-sm font-medium">
                    {t('staff.select_store', '选择门店')} *
                  </Label>
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('staff.select_store_placeholder', '请选择门店')} />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store: any) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>使用说明：</strong>
                    <br />
                    1. 生成后将绑定邀请发送给门店老板
                    <br />
                    2. 门店老板转发给需要核销权限的员工
                    <br />
                    3. 员工扫码绑定后自动获得该门店的核销权限
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-semibold text-green-800 mb-2">
                    {t('staff.binding_generated', '✅ 绑定邀请已生成')}
                  </div>
                  <div className="text-sm text-green-700">
                    {t('staff.binding_expire_hint', '有效期24小时，请及时分享二维码给员工扫码绑定')}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    {t('staff.qr_code', '绑定二维码')}
                  </Label>
                  <div className="mt-2 p-4 bg-gray-50 border rounded-lg text-center">
                    <div className="w-52 h-52 bg-white border border-gray-300 rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
                      <canvas 
                        ref={qrCanvasRef}
                        className="max-w-full max-h-full"
                        width={200}
                        height={200}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('staff.qr_code_desc', '员工用LINE扫描此二维码完成绑定')}
                    </p>
                    <Button
                      onClick={() => copyToClipboard(generatedBinding.liffUrl)}
                      variant="outline"
                      size="sm"
                    >
                      {t('staff.copy_link', '复制绑定链接')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {!generatedBinding ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBindingModal(false);
                      setSelectedStoreId('');
                      setGeneratedBinding(null);
                    }}
                  >
                    {t('common.cancel', '取消')}
                  </Button>
                  <Button onClick={generateStoreBinding}>
                    {t('staff.generate', '生成邀请')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setShowBindingModal(false);
                    setSelectedStoreId('');
                    setGeneratedBinding(null);
                  }}
                >
                  {t('common.close', '关闭')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('staff.delete_dialog_title', '确认删除员工')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('staff.delete_dialog_desc', '您确定要删除员工')} <strong>{selectedStaff?.name}</strong> {t('common.question_mark', '吗？')}
                <br />
                此操作将撤销该员工在 <strong>{selectedStaff?.storeName}</strong> 的所有权限，且无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteStaffMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteStaffMutation.isPending ? '删除中...' : '确认删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  </>
  );
}