// LINE LIFF SDK integration for lightweight login
export interface LineUser {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
}

export class LineService {
  async getProfile() {
    try {
      if (typeof window !== 'undefined' && window.liff) {
        return await window.liff.getProfile();
      }
      // Mock profile for development
      return {
        userId: 'mock-line-user-id',
        displayName: '测试用户',
        pictureUrl: null,
        statusMessage: 'Welcome to WiseNest Marketing'
      };
    } catch (error) {
      console.error('Failed to get LINE profile:', error);
      // Fallback mock profile
      return {
        userId: 'mock-line-user-id',
        displayName: '测试用户',
        pictureUrl: null,
        statusMessage: 'Welcome to WiseNest Marketing'
      };
    }
  }
  private isInitialized = false;
  private currentUser: LineUser | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if running in LINE LIFF environment
      if (typeof window !== 'undefined' && window.liff) {
        await window.liff.init({ liffId: process.env.VITE_LINE_LIFF_ID || 'mock-liff-id' });
        this.isInitialized = true;
        
        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile();
          this.currentUser = {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          };
        }
      } else {
        // Mock implementation for development
        console.warn('LINE LIFF not available, using mock implementation');
        this.isInitialized = true;
        this.currentUser = {
          userId: 'mock-line-user-id',
          displayName: 'Mock User',
        };
      }
    } catch (error) {
      console.error('LINE LIFF initialization failed:', error);
      this.isInitialized = true; // Mark as initialized even if failed
    }
  }

  async login(): Promise<LineUser | null> {
    await this.init();

    try {
      if (typeof window !== 'undefined' && window.liff) {
        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return null; // Will redirect to LINE login
        }

        const profile = await window.liff.getProfile();
        this.currentUser = {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        };
      }

      return this.currentUser;
    } catch (error) {
      console.error('LINE login failed:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        window.liff.logout();
      }
      this.currentUser = null;
    } catch (error) {
      console.error('LINE logout failed:', error);
    }
  }

  getCurrentUser(): LineUser | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && window.liff) {
      return window.liff.isLoggedIn();
    }
    return this.currentUser !== null; // Mock check
  }

  async shareActivity(activityId: string, title: string): Promise<{ method: string }> {
    const domains = import.meta.env.VITE_REPLIT_DOMAINS || 'localhost:5000';
    const domain = domains.split(',')[0];
    const url = `https://${domain}/a/${activityId}`;
    
    // 优先使用LINE LIFF的shareTargetPicker
    if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
      try {
        await window.liff.shareTargetPicker([
          {
            type: 'text',
            text: `${title}\n${url}`
          }
        ]);
        return { method: 'line_native' };
      } catch (error) {
        console.error('LINE share failed:', error);
        // 继续尝试其他方法
      }
    }
    
    // 次选Web Share API (移动端浏览器)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: url,
        });
        return { method: 'web_share' };
      } catch (error) {
        console.error('Web Share failed:', error);
        // 继续尝试复制链接
      }
    }
    
    // Fallback到复制链接
    try {
      await navigator.clipboard.writeText(url);
      return { method: 'clipboard' };
    } catch (error) {
      console.error('Clipboard failed:', error);
      // 最后的fallback：创建临时文本框选择复制
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { method: 'manual_copy' };
    }
  }

  async openExternalBrowser(url: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.liff) {
        window.liff.openWindow({ url, external: true });
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Open external browser failed:', error);
      window.open(url, '_blank');
    }
  }
}

// Global LINE LIFF interface extension
declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: () => void;
      logout: () => void;
      getProfile: () => Promise<{
        userId: string;
        displayName: string;
        pictureUrl?: string;
      }>;
      shareTargetPicker: (messages: any[]) => Promise<void>;
      openWindow: (params: { url: string; external?: boolean }) => void;
    };
  }
}

export const lineService = new LineService();
