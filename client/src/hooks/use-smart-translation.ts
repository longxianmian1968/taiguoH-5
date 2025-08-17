import { useState } from 'react';
import { adminApi } from '@/lib/admin-api';

export interface SmartTranslationResult {
  zhText: string;
  thText: string;
  isTranslating: boolean;
  error: string | null;
}

/**
 * Hook for smart translation with automatic language detection
 * 智能翻译Hook，支持自动语言检测和双向翻译
 */
export function useSmartTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = async (
    text: string,
    key: string,
    type: 'ui' | 'content' = 'content',
    sourceLanguage?: 'zh' | 'th'
  ): Promise<SmartTranslationResult> => {
    if (!text?.trim()) {
      return {
        zhText: '',
        thText: '',
        isTranslating: false,
        error: null
      };
    }

    setIsTranslating(true);
    setError(null);

    try {
      const result = await adminApi.smartTranslate(text, key, type, sourceLanguage);
      
      return {
        zhText: result.zhText,
        thText: result.thText,
        isTranslating: false,
        error: null
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '翻译失败';
      setError(errorMessage);
      
      return {
        zhText: text,
        thText: text,
        isTranslating: false,
        error: errorMessage
      };
    } finally {
      setIsTranslating(false);
    }
  };

  const batchTranslate = async (
    items: Array<{
      text: string;
      key: string;
      type?: 'ui' | 'content';
      sourceLanguage?: 'zh' | 'th';
    }>
  ): Promise<Array<SmartTranslationResult & { key: string }>> => {
    setIsTranslating(true);
    setError(null);

    try {
      const results = await Promise.all(
        items.map(async (item) => {
          const result = await translate(item.text, item.key, item.type, item.sourceLanguage);
          return {
            key: item.key,
            ...result
          };
        })
      );

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量翻译失败';
      setError(errorMessage);
      
      return items.map(item => ({
        key: item.key,
        zhText: item.text,
        thText: item.text,
        isTranslating: false,
        error: errorMessage
      }));
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translate,
    batchTranslate,
    isTranslating,
    error
  };
}

/**
 * 语言检测工具函数
 */
export function detectLanguage(text: string): 'zh' | 'th' | 'unknown' {
  if (!text?.trim()) return 'unknown';
  
  // 检测中文字符
  const chinesePattern = /[\u4e00-\u9fff]/;
  if (chinesePattern.test(text)) return 'zh';
  
  // 检测泰语字符  
  const thaiPattern = /[\u0e00-\u0e7f]/;
  if (thaiPattern.test(text)) return 'th';
  
  return 'unknown';
}

/**
 * 表单验证：确保必填字段已翻译
 */
export function validateTranslatedForm(data: any, requiredFields: string[]): string[] {
  const errors: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field]?.trim()) {
      errors.push(`${field} 不能为空`);
    }
  });
  
  return errors;
}