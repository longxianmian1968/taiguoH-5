import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { lineService } from '@/lib/line';
import { Share2, Users, Clock, Copy, ArrowLeft, QrCode, MessageCircle } from 'lucide-react';

export default function GroupSharePage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const activityId = params.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [groupInstanceId, setGroupInstanceId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');

  // 获取活动详情
  const { data: activity, error: activityError } = useQuery({
    queryKey: ['/api/activities', activityId],
    enabled: !!activityId,
  });

  // 获取团购配置
  const { data: groupConfig } = useQuery({
    queryKey: ['/api/activities', activityId, 'group-config'],
    enabled: !!activityId && (activity as any)?.type === 'group',
  });

  // 创建团购实例
  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const user = lineService.getCurrentUser();
      if (!user) throw new Error('用户未登录');
      
      const response = await api.createGroupInstance({
        activityId: activityId!,
        leaderUser: user.userId,
        expireAt: new Date(Date.now() + ((groupConfig as any)?.timeLimitHours || 24) * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      });
      
      return response;
    },
    onSuccess: (groupInstance) => {
      setGroupInstanceId(groupInstance.id);
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/activities/${activityId}?groupId=${groupInstance.id}`;
      setShareUrl(url);
      
      toast({
        title: t('group.create_success', '团购发起成功'),
        description: t('group.share_to_friends', '快分享给朋友一起参团吧！'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error.create_group_failed', '发起团购失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  });

  // 页面加载时自动创建团购实例
  useEffect(() => {
    if (activity && groupConfig && !groupInstanceId && !createGroupMutation.isPending) {
      createGroupMutation.mutate();
    }
  }, [activity, groupConfig, groupInstanceId]);

  const handleShareToLine = async () => {
    if (!shareUrl || !activity) return;

    try {
      const message = t('group.share_message', '🛒 {title}\n💰 特价 {price}฿\n👥 {count}人团购，邀请你参加！\n⏰ {hours}小时内成团\n\n点击链接参团：{url}', {
        title: (activity as any).title,
        price: (activity as any).price,
        count: (groupConfig as any)?.nRequired || 3,
        hours: (groupConfig as any)?.timeLimitHours || 24,
        url: shareUrl
      });
      
      const result = await lineService.shareActivity(activityId!, (activity as any).title);
      
      if (result.method) {
        toast({
          title: t('success.shared_to_line', '已分享到LINE'),
          description: t('success.share_desc', '朋友们可以通过链接参团'),
        });
      }
    } catch (error) {
      toast({
        title: t('error.share_failed', '分享失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('success.copied', '链接已复制'),
        description: t('success.copy_desc', '可手动发送给朋友'),
      });
    } catch (error) {
      toast({
        title: t('error.copy_failed', '复制失败'),
        description: t('error.copy_manual', '请手动选择并复制链接'),
        variant: 'destructive',
      });
    }
  };

  const handleBackToActivity = () => {
    setLocation(`/activities/${activityId}`);
  };

  const handleViewMyGroup = () => {
    if (groupInstanceId) {
      setLocation(`/activities/${activityId}?groupId=${groupInstanceId}`);
    }
  };

  if (activityError || !activity) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-4" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <Button 
            onClick={() => setLocation(`/activities/${activityId}`)} 
            className="mb-4 text-gray-600 bg-transparent border-0 p-0 hover:bg-transparent"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            {t('common.back_to_activity', '返回活动详情')}
          </Button>
          <h2 className="text-lg font-semibold text-secondary mb-2">
            {t('error.activity_not_found', '活动不存在')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('error.activity_load_failed', '无法加载活动信息，请稍后重试')}
          </p>
          <div className="space-y-2">
            <Button onClick={() => setLocation(`/activities/${activityId}`)} className="btn-primary w-full">
              {t('common.back_to_activity', '返回活动详情')}
            </Button>
            <Button onClick={() => setLocation('/')} className="btn-secondary w-full">
              {t('common.back_home', '返回首页')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (createGroupMutation.isPending) {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-4" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">{t('group.creating', '正在发起团购...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToActivity}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back', '返回')}
          </Button>
          <h1 className="font-semibold text-secondary">{t('group.share_title', '邀请好友参团')}</h1>
          <div className="w-16"></div>
        </div>
      </div>

      {/* 活动信息卡片 */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative">
            <img 
              src={(activity as any).coverUrl} 
              alt={(activity as any).title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              {t('group.group_buying', '团购活动')}
            </div>
          </div>
          
          <div className="p-4">
            <h2 className="text-lg font-bold text-secondary mb-2">{(activity as any).title}</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-emerald-600">{(activity as any).price}฿</span>
                {(activity as any).listPrice && (
                  <span className="text-sm text-gray-500 line-through ml-2">{(activity as any).listPrice}฿</span>
                )}
              </div>
            </div>
            
            {/* 团购规则 */}
            <div className="bg-emerald-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-800">
                <Users className="w-4 h-4" />
                <span className="font-medium">{t('group.required_people', '{count}人成团', { count: (groupConfig as any)?.nRequired || 3 })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Clock className="w-4 h-4" />
                <span>{t('group.time_limit', '{hours}小时内成团有效', { hours: (groupConfig as any)?.timeLimitHours || 24 })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <QrCode className="w-4 h-4" />
                <span>{t('group.auto_coupon', '成团后自动发放优惠券')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分享区域 */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {t('group.invite_friends', '邀请好友参团')}
          </h3>
          
          {shareUrl && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 mb-2">{t('group.share_link', '团购链接')}</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-700"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* 分享按钮 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShareToLine}
              disabled={!shareUrl}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-3"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('group.share_to_line', '分享到LINE')}
            </Button>
            
            <Button
              onClick={handleCopyLink}
              disabled={!shareUrl}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 py-3"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t('group.copy_link', '复制链接')}
            </Button>
          </div>
        </div>
      </div>

      {/* 温馨提示 */}
      <div className="px-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">{t('group.tips_title', '温馨提示')}</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('group.tip_1', '需要达到指定人数才能成团成功')}</li>
            <li>• {t('group.tip_2', '成团后所有成员将收到优惠券')}</li>
            <li>• {t('group.tip_3', '团购时间限制内未成团将自动取消')}</li>
            <li>• {t('group.tip_4', '可以随时查看团购进度')}</li>
          </ul>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <Button
            onClick={handleViewMyGroup}
            disabled={!groupInstanceId}
            variant="outline"
            className="flex-1 border-emerald-300 text-emerald-700"
          >
            {t('group.view_progress', '查看进度')}
          </Button>
          <Button
            onClick={handleShareToLine}
            disabled={!shareUrl}
            className="flex-2 bg-emerald-500 hover:bg-emerald-600"
          >
            {t('group.continue_invite', '继续邀请')}
          </Button>
        </div>
      </div>
    </div>
  );
}