import { useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';

export function MobileBlock() {
  const { t } = useI18n();

  useEffect(() => {
    // 在开发环境中禁用移动设备检测
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      document.body.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 20px;
          text-align: center;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        ">
          <div style="
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          ">
            <h1 style="margin: 0 0 20px 0; font-size: 24px;">
              ${t('mobile_block.title', 'เฉพาะเดสก์ท็อป')}
            </h1>
            <p style="margin: 0; font-size: 16px; line-height: 1.5;">
              ${t('mobile_block.message', 'ระบบจัดการนี้ออกแบบมาสำหรับการใช้งานบนเดสก์ท็อปเท่านั้น กรุณาเข้าใช้งานผ่านคอมพิวเตอร์')}
            </p>
          </div>
        </div>
      `;
    }
  }, [t]);

  return null;
}