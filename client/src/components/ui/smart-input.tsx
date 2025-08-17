import React, { useState, useEffect } from 'react';
import { useSmartTranslation, detectLanguage } from '@/hooks/use-smart-translation';

interface SmartInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'input' | 'textarea';
  rows?: number;
  translationKey: string;
  translationType?: 'ui' | 'content';
  showPreview?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 智能输入组件：支持自动翻译预览
 * 用户输入中文或泰语，实时显示翻译结果
 */
export function SmartInput({
  label,
  value,
  onChange,
  placeholder = "请输入内容（支持中文/泰语）",
  required = false,
  type = 'input',
  rows = 3,
  translationKey,
  translationType = 'content',
  showPreview = true,
  className = '',
  style = {}
}: SmartInputProps) {
  const { translate, isTranslating } = useSmartTranslation();
  const [previewResult, setPreviewResult] = useState<{ zhText: string; thText: string } | null>(null);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);

  // 实时翻译预览（防抖）
  useEffect(() => {
    if (!value?.trim() || !showPreview) {
      setPreviewResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await translate(value, `${translationKey}.${Date.now()}`, translationType);
        setPreviewResult({ zhText: result.zhText, thText: result.thText });
      } catch (error) {
        console.error('预览翻译失败:', error);
      }
    }, 800); // 800ms防抖

    return () => clearTimeout(timer);
  }, [value, translationKey, translationType, showPreview]);

  const detectedLang = detectLanguage(value);
  
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ced4da',
    borderRadius: '5px',
    fontSize: '14px',
    lineHeight: '1.5',
    ...style
  };

  const Element = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={className}>
      <label style={{ 
        display: 'block', 
        marginBottom: '5px', 
        fontWeight: 'bold',
        fontSize: '14px'
      }}>
        {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
        <span style={{ 
          fontSize: '12px', 
          color: '#6c757d',
          fontWeight: 'normal',
          marginLeft: '5px'
        }}>
          (支持中文/泰语输入，系统自动翻译)
        </span>
      </label>
      
      <Element
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={type === 'textarea' ? rows : undefined}
        style={inputStyle}
      />

      {/* 语言检测指示器 */}
      {value?.trim() && (
        <div style={{ 
          fontSize: '11px', 
          color: '#6c757d', 
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>
            检测语言: {detectedLang === 'zh' ? '中文' : detectedLang === 'th' ? 'ไทย' : '未知'}
          </span>
          {isTranslating && <span>🔄 翻译中...</span>}
          {showPreview && (
            <button
              type="button"
              onClick={() => setShowPreviewPanel(!showPreviewPanel)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '11px',
                textDecoration: 'underline'
              }}
            >
              {showPreviewPanel ? '隐藏预览' : '显示翻译预览'}
            </button>
          )}
        </div>
      )}

      {/* 翻译预览面板 */}
      {showPreview && showPreviewPanel && previewResult && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>
            翻译预览:
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>中文:</strong> {previewResult.zhText}
          </div>
          <div>
            <strong>ไทย:</strong> {previewResult.thText}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartInput;