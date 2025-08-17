import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { lineService } from '@/lib/line';
import { api } from '@/lib/api';
import { Check, X, ShieldCheck, Store } from 'lucide-react';

export default function VerifyPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  
  // State management
  const [couponCode, setCouponCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  // Mock staff and store info - in production this would come from LINE login
  const [staffInfo] = useState({
    staffId: 'mock-staff-id',
    storeId: 'mock-store-id',
  });

  // Verify coupon mutation
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!code.trim()) {
        throw new Error(t('error.code_required', '请输入券码'));
      }

      const lineProfile = await lineService.getProfile();
      return await api.verifyCoupon({
        code: code.trim().toUpperCase(),
        storeId: staffInfo.storeId,
        staffId: staffInfo.staffId,
        lineUserId: lineProfile.userId,
      });
    },
    onSuccess: (result) => {
      setVerificationResult({
        success: true,
        message: t('success.verified', '核销成功'),
        data: result,
      });
      
      toast({
        title: t('success.verified', '核销成功'),
        description: t('success.verified_desc', '券码已成功核销'),
      });
      
      // Clear the input
      setCouponCode('');
    },
    onError: (error) => {
      setVerificationResult({
        success: false,
        message: error.message,
      });
      
      toast({
        title: t('error.verify_failed', '核销失败'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Handle manual verification
  const handleManualVerify = () => {
    if (couponCode.trim()) {
      verifyMutation.mutate(couponCode.trim().toUpperCase());
    } else {
      toast({
        title: t('error.code_required', '请输入券码'),
        description: t('error.code_required_desc', '券码不能为空'),
        variant: 'destructive',
      });
    }
  };

  // Handle input change
  const handleCodeChange = (value: string) => {
    setCouponCode(value);
    // Clear previous result when user starts typing
    if (verificationResult) {
      setVerificationResult(null);
    }
  };

  const { currentLang } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {currentLang === 'th' ? 'ตรวจสอบคูปอง' : '手动核销'}
          </h1>
          <p className="text-gray-600">
            {currentLang === 'th' ? 'กรอกรหัสคูปองเพื่อทำการตรวจสอบ' : '输入券码进行核销验证'}
          </p>
        </div>

        {/* Staff Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Store className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm mb-1">
                {currentLang === 'th' ? 'สำหรับพนักงาน' : '店员专用功能'}
              </h3>
              <p className="text-blue-700 text-xs">
                {currentLang === 'th' ? 
                  'นี่เป็นระบบสำรองสำหรับตรวจสอบคูปอง แนะนำให้ใช้ LINE สแกนคิวอาร์โค้ดเป็นหลัก' : 
                  '这是兜底核销方案，建议优先使用LINE扫码功能'}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`mb-6 p-4 rounded-xl border ${
            verificationResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {verificationResult.success ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <X className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${
                  verificationResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.message}
                </p>
                {verificationResult.data && (
                  <p className="text-sm text-gray-600 mt-1">
                    {currentLang === 'th' ? 'รหัส' : '券码'}: {verificationResult.data.code}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Manual Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLang === 'th' ? 'รหัสคูปอง' : '券码'}
            </label>
            <Input
              data-testid="input-code"
              type="text"
              placeholder={currentLang === 'th' ? 'กรอกรหัสคูปอง' : '请输入券码'}
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center font-mono text-lg"
              maxLength={20}
            />
          </div>

          {/* Verify Button */}
          <Button
            data-testid="btn-verify"
            onClick={handleManualVerify}
            disabled={!couponCode.trim() || verifyMutation.isPending}
            className="w-full p-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyMutation.isPending 
              ? (currentLang === 'th' ? 'กำลังตรวจสอบ...' : '验证中...') 
              : (currentLang === 'th' ? 'ตรวจสอบคูปอง' : '立即核销')
            }
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {currentLang === 'th' ? 
              'เมื่อตรวจสอบสำเร็จแล้ว คูปองจะหมดอายุทันที' : 
              '核销成功后券码将失效'}
          </p>
        </div>
      </div>
    </div>
  );
}
