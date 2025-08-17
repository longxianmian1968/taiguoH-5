import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';

// 员工LINE绑定页面 - Employee LINE Binding Page
export default function LineBindingPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<'scanning' | 'binding' | 'success' | 'error' | 'input'>('scanning');
  const [token, setToken] = useState('');
  const [code, setCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if there's a token in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setStep('binding');
      handleDirectBinding(urlToken);
    }
  }, []);

  // Handle direct binding through URL token
  const handleDirectBinding = async (urlToken: string) => {
    setLoading(true);
    try {
      // Check if running in production environment with real LINE LIFF
      const isProduction = window.location.hostname.includes('.repl.co') || window.location.hostname.includes('.replit.app');
      
      if (isProduction && typeof window.liff !== 'undefined') {
        // Production: Use real LINE LIFF
        await window.liff.init({ liffId: process.env.VITE_LIFF_ID || 'YOUR_LIFF_ID' });
        
        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile();
          await completeBinding(urlToken, profile.userId, profile.userId);
        } else {
          window.liff.login();
        }
      } else {
        // Development: Show manual input form for testing
        setStep('input');
      }
    } catch (error) {
      console.error('Direct binding failed:', error);
      setError(t('binding.direct_binding_failed', '绑定失败，请重新扫码'));
      setStep('error');
    } finally {
      setLoading(false);
    }
  };



  // Complete the binding process
  const completeBinding = async (bindToken: string, lineUserId: string, liffSub: string) => {
    try {
      const response = await fetch('/api/line-binding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: bindToken,
          lineUserId,
          liffSub,
        }),
      });

      const data = await response.json();

      if (data.code === 0) {
        setStep('success');
      } else {
        setError(data.message || t('binding.binding_failed', '绑定失败'));
        setStep('error');
      }
    } catch (error) {
      setError(t('binding.network_error', '网络错误，请重试'));
      setStep('error');
    }
  };

  // Reset to input step
  const resetToInput = () => {
    setStep('input');
    setCode('');
    setToken('');
    setEmployeeName('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🔗
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 8px 0'
          }}>
            {t('binding.title', 'LINE账号绑定')}
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0
          }}>
            {t('binding.subtitle', '绑定您的LINE账号以获得核销权限')}
          </p>
        </div>

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              color: '#00B900'
            }}>
              📱
            </div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>
              {t('binding.scan_qr_title', '扫码绑定')}
            </h3>
            <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
              {t('binding.scan_qr_desc', '请使用LINE扫描管理员提供的二维码完成绑定')}
            </p>

            {error && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0066cc'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {t('binding.help_title', '💡 如何绑定')}
              </div>
              <div>
                {t('binding.help_desc', '1. 联系门店管理员获取二维码\n2. 使用LINE扫描二维码\n3. 自动完成绑定')}
              </div>
            </div>
          </div>
        )}

        {/* Binding Step */}
        {step === 'binding' && (
          <div>
            <div style={{
              fontSize: '36px',
              marginBottom: '20px'
            }}>
              ⏳
            </div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>
              {t('binding.processing', '正在绑定中...')}
            </h3>
            {employeeName && (
              <p style={{ color: '#666', marginBottom: '20px' }}>
                {t('binding.employee_name', '员工：')} <strong>{employeeName}</strong>
              </p>
            )}
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #00B900',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              ✅
            </div>
            <h3 style={{ color: '#28a745', marginBottom: '16px' }}>
              {t('binding.success_title', '绑定成功！')}
            </h3>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              {t('binding.success_desc', '您的LINE账号已成功绑定，现在可以进行核销操作了')}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#00B900',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {t('binding.return_home', '返回首页')}
            </button>
          </div>
        )}

        {/* Manual Input Step (for development) */}
        {step === 'input' && (
          <div>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              📝
            </div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>
              {t('binding.manual_input_title', '开发测试绑定')}
            </h3>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              {t('binding.manual_input_desc', '开发环境：请手动输入LINE ID进行测试')}
            </p>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                LINE ID (测试用):
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例如: test-line-user-001"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                员工姓名:
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="例如: 张三"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (!code.trim() || !employeeName.trim()) {
                  setError('请填写LINE ID和员工姓名');
                  return;
                }
                setError('');
                setStep('binding');
                completeBinding(token, code.trim(), code.trim());
              }}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#00B900',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '绑定中...' : '完成绑定'}
            </button>

            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#856404'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                💡 开发提示
              </div>
              <div>
                这是开发环境的测试界面。生产环境将自动获取真实的LINE用户信息。
              </div>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              ❌
            </div>
            <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>
              {t('binding.error_title', '绑定失败')}
            </h3>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              {error || t('binding.error_desc', '绑定过程中出现错误，请重试')}
            </p>
            <button
              onClick={resetToInput}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {t('binding.retry', '重新绑定')}
            </button>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}