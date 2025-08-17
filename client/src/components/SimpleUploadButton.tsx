import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';

interface SimpleUploadButtonProps {
  onUploadSuccess: (objectPath: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function SimpleUploadButton({ 
  onUploadSuccess, 
  disabled, 
  children = (
    <>
      <Upload className="w-4 h-4 mr-2" />
      选择图片
    </>
  ),
  className 
}: SimpleUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止表单提交
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      console.log('🔄 [SimpleUploadButton] Starting upload for:', file.name, file.type, file.size);
      
      // File validation
      if (!file.type.startsWith('image/')) {
        throw new Error('请选择图片文件');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件大小不能超过10MB');
      }

      // 使用代理上传绕过CORS
      const fd = new FormData();
      fd.append('file', file);
      
      console.log('📤 [SimpleUploadButton] Sending FormData to /api/upload/proxy');
      
      const uploadRes = await fetch('/api/upload/proxy', { 
        method: 'POST', 
        body: fd 
      });
      
      console.log('📥 [SimpleUploadButton] Proxy response status:', uploadRes.status);
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        console.error('❌ [SimpleUploadButton] Proxy upload failed:', errorData);
        throw new Error(errorData.message || `upload failed: ${uploadRes.status}`);
      }
      
      const uploadData = await uploadRes.json();
      console.log('📋 [SimpleUploadButton] Proxy response data:', uploadData);
      
      if (uploadData.code !== 0 || !uploadData.data?.publicUrl) {
        throw new Error(uploadData.message || 'Invalid upload response');
      }

      const { publicUrl } = uploadData.data;
      console.log('🎯 [SimpleUploadButton] Got publicUrl:', publicUrl);

      // 验证文件可访问性
      const bust = `?v=${Date.now()}`;
      console.log('🔍 [SimpleUploadButton] Verifying file accessibility:', publicUrl + bust);
      
      const headRes = await fetch(publicUrl + bust, {
        method: 'HEAD',
        cache: 'no-store',
      });
      
      console.log('✅ [SimpleUploadButton] Verification result:', headRes.status);
      
      if (!headRes.ok) {
        console.error('❌ [SimpleUploadButton] Verification failed:', headRes.status);
        throw new Error(`verification failed: ${headRes.status}`);
      }

      // 成功后回写
      console.log('🎉 [SimpleUploadButton] Upload successful, calling onUploadSuccess with:', publicUrl);
      onUploadSuccess(publicUrl);

    } catch (e) {
      console.error('[upload error]', e);
      setError((e as Error).message || '上传失败');
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || uploading}
        className={className}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            上传中...
          </>
        ) : (
          children
        )}
      </Button>

      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}