/**
 * 阿里云百炼平台翻译服务集成
 * 使用百炼平台的Qwen-MT翻译服务，支持中文↔泰文双向翻译
 */

export class AlibabaTranslationService {
  private accessKeyId: string;
  private endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  constructor() {
    this.accessKeyId = process.env.ALIBABA_ACCESS_KEY_ID || '';
  }

  /**
   * 翻译UI文本
   */
  async translateUI(text: string, from: string, to: string): Promise<string> {
    try {
      if (!this.accessKeyId) {
        console.warn('阿里云百炼平台密钥未设置，使用原文');
        return text;
      }

      const sourceLanguage = from === 'zh' ? '中文' : '泰语';
      const targetLanguage = to === 'th' ? '泰语' : '中文';

      const requestBody = {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是专业的UI翻译专家。请准确翻译用户界面文本，保持简洁性和专业性。只返回翻译结果，不要添加任何解释。'
            },
            {
              role: 'user', 
              content: `请将以下${sourceLanguage}UI文本翻译为${targetLanguage}：${text}`
            }
          ]
        },
        parameters: {
          temperature: 0.1,
          top_p: 0.8
        }
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessKeyId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`百炼平台API错误详情 (${response.status}):`, errorText);
        throw new Error(`百炼平台API请求失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('百炼平台API响应:', JSON.stringify(result, null, 2));
      
      const resultData = result as any;
      if (resultData.output && resultData.output.text) {
        const translated = resultData.output.text.trim();
        console.log(`阿里云百炼翻译成功: "${text}" -> "${translated}"`);
        return translated || text;
      }
      
      console.warn('百炼平台API返回异常:', result);
      return text;
    } catch (error) {
      console.error('阿里云百炼翻译服务错误:', error);
      return text;
    }
  }

  /**
   * 翻译内容文本（支持长文本）
   */
  async translateContent(text: string, from: string, to: string): Promise<string> {
    try {
      if (!this.accessKeyId) {
        console.warn('阿里云百炼平台密钥未设置，使用原文');
        return text;
      }

      // 长文本分段处理（百炼平台单次请求限制较小）
      if (text.length > 2000) {
        const chunks = this.splitText(text, 2000);
        const translatedChunks = await Promise.all(
          chunks.map(chunk => this.translateUI(chunk, from, to))
        );
        return translatedChunks.join('');
      }

      return await this.translateUI(text, from, to);
    } catch (error) {
      console.error('阿里云百炼内容翻译错误:', error);
      return text;
    }
  }



  /**
   * 分割长文本
   */
  private splitText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    const sentences = text.split(/[。！？\n]/);
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        if (sentence.length > maxLength) {
          // 处理超长句子
          for (let i = 0; i < sentence.length; i += maxLength) {
            chunks.push(sentence.slice(i, i + maxLength));
          }
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * 获取指定语言的所有翻译（从数据库）
   */
  async getAllTranslations(lang: 'zh' | 'th'): Promise<Record<string, string>> {
    try {
      const { storage } = await import('../storage');
      const translations = await storage.getTranslations(lang);
      
      // 将数组转换为键值对对象
      const result: Record<string, string> = {};
      translations.forEach(item => {
        if (item.key && item.value) {
          result[item.key] = item.value;
        }
      });
      
      return result;
    } catch (error) {
      console.error(`获取${lang}翻译失败:`, error);
      return {};
    }
  }

  /**
   * 获取单个翻译
   */
  async getTranslation(key: string, lang: 'zh' | 'th', type: 'ui' | 'content'): Promise<string | null> {
    try {
      const { storage } = await import('../storage');
      const translation = await storage.getTranslation(lang, key);
      return translation ? translation.value : null;
    } catch (error) {
      console.error(`获取翻译${key}失败:`, error);
      return null;
    }
  }
}

// 导出单例实例
export const alibabaTranslationService = new AlibabaTranslationService();