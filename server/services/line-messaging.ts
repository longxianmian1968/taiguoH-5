/**
 * LINE Messaging API 服务
 * 支持推送消息、用户通知、营销活动推广等功能
 */

export interface LineMessage {
  type: 'text' | 'flex' | 'template';
  text?: string;
  contents?: any; // Flex message contents
  template?: any; // Template message
}

export interface PushNotificationData {
  userId: string;
  message: LineMessage;
  activityId?: string;
  type?: 'coupon_claimed' | 'coupon_reminder' | 'activity_promotion' | 'redemption_success';
}

export class LineMessagingService {
  private channelAccessToken: string;
  private apiEndpoint = 'https://api.line.me/v2/bot';

  constructor() {
    // Note: LINE_CHANNEL_SECRET is for webhook verification
    // We need LINE_CHANNEL_ACCESS_TOKEN for API calls
    this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_SECRET || '';
  }

  /**
   * 发送推送消息给指定用户
   */
  async pushMessage(userId: string, messages: LineMessage[]): Promise<boolean> {
    try {
      if (!this.channelAccessToken) {
        console.warn('LINE Channel Access Token未设置，消息推送跳过');
        return false;
      }

      const response = await fetch(`${this.apiEndpoint}/message/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userId,
          messages: messages.slice(0, 5), // LINE限制最多5条消息
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`LINE推送消息失败 (${response.status}):`, errorData);
        return false;
      }

      console.log(`✅ LINE推送消息成功发送给用户: ${userId}`);
      return true;
    } catch (error) {
      console.error('LINE推送消息异常:', error);
      return false;
    }
  }

  /**
   * 发送券码领取成功通知
   */
  async sendCouponClaimedNotification(userId: string, activityTitle: string, couponCode: string): Promise<boolean> {
    const message: LineMessage = {
      type: 'flex',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🎉 券码领取成功',
              size: 'lg',
              weight: 'bold',
              color: '#10B981'
            }
          ],
          backgroundColor: '#F0FDF4',
          paddingAll: 'md'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: activityTitle,
              size: 'md',
              weight: 'bold',
              wrap: true,
              margin: 'none'
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '券码',
                  size: 'sm',
                  color: '#666666'
                },
                {
                  type: 'text',
                  text: couponCode,
                  size: 'xl',
                  weight: 'bold',
                  color: '#DC2626'
                }
              ],
              margin: 'md'
            },
            {
              type: 'text',
              text: '请到店出示此券码享受优惠',
              size: 'sm',
              color: '#666666',
              margin: 'md'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '查看详情',
                uri: `${this.getBaseUrl()}/profile`
              },
              style: 'primary',
              color: '#10B981'
            }
          ]
        }
      }
    };

    return this.pushMessage(userId, [message]);
  }

  /**
   * 发送活动推广消息
   */
  async sendActivityPromotion(userId: string, activity: any): Promise<boolean> {
    const message: LineMessage = {
      type: 'flex',
      contents: {
        type: 'bubble',
        hero: {
          type: 'image',
          url: activity.coverUrl || `${this.getBaseUrl()}/assets/default-activity.jpg`,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: activity.title,
              size: 'lg',
              weight: 'bold',
              wrap: true
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `฿${activity.price}`,
                  size: 'xl',
                  weight: 'bold',
                  color: '#DC2626'
                },
                {
                  type: 'text',
                  text: activity.listPrice ? `฿${activity.listPrice}` : '',
                  size: 'md',
                  color: '#666666',
                  decoration: 'line-through',
                  margin: 'sm'
                }
              ],
              margin: 'md'
            },
            {
              type: 'text',
              text: activity.rules || '',
              size: 'sm',
              color: '#666666',
              wrap: true,
              margin: 'md'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '立即抢购',
                uri: `${this.getBaseUrl()}/activities/${activity.id}`
              },
              style: 'primary',
              color: '#10B981'
            }
          ]
        }
      }
    };

    return this.pushMessage(userId, [message]);
  }

  /**
   * 发送核销成功通知
   */
  async sendRedemptionSuccessNotification(userId: string, activity: any, store: any): Promise<boolean> {
    const message: LineMessage = {
      type: 'flex',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '✅ 核销成功',
              size: 'lg',
              weight: 'bold',
              color: '#10B981'
            }
          ],
          backgroundColor: '#F0FDF4',
          paddingAll: 'md'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: activity.title,
              size: 'md',
              weight: 'bold',
              wrap: true
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '使用门店',
                  size: 'sm',
                  color: '#666666'
                },
                {
                  type: 'text',
                  text: store.name,
                  size: 'md',
                  weight: 'bold'
                },
                {
                  type: 'text',
                  text: store.address,
                  size: 'sm',
                  color: '#666666'
                }
              ],
              margin: 'md'
            },
            {
              type: 'text',
              text: `核销时间: ${new Date().toLocaleString('zh-CN')}`,
              size: 'sm',
              color: '#666666',
              margin: 'md'
            }
          ]
        }
      }
    };

    return this.pushMessage(userId, [message]);
  }

  /**
   * 发送券码过期提醒
   */
  async sendCouponExpirationReminder(userId: string, activity: any, expirationDate: Date): Promise<boolean> {
    const daysLeft = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const message: LineMessage = {
      type: 'text',
      text: `⏰ 券码即将过期提醒\n\n您的「${activity.title}」券码将在${daysLeft}天后过期，请尽快使用。\n\n查看详情: ${this.getBaseUrl()}/profile`
    };

    return this.pushMessage(userId, [message]);
  }

  /**
   * 群发消息给多个用户
   */
  async broadcastMessage(userIds: string[], message: LineMessage): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // LINE API限制：一次推送最多500个用户
    const batchSize = 500;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      try {
        if (!this.channelAccessToken) {
          console.warn('LINE Channel Access Token未设置，群发消息跳过');
          failed += batch.length;
          continue;
        }

        const response = await fetch(`${this.apiEndpoint}/message/multicast`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.channelAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: batch,
            messages: [message],
          }),
        });

        if (response.ok) {
          success += batch.length;
          console.log(`✅ 群发消息成功发送给${batch.length}个用户`);
        } else {
          failed += batch.length;
          const errorData = await response.json().catch(() => ({}));
          console.error(`群发消息失败 (${response.status}):`, errorData);
        }
      } catch (error) {
        failed += batch.length;
        console.error('群发消息异常:', error);
      }

      // 防止频率限制，批次间添加延迟
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }

  /**
   * 处理LINE Webhook事件
   */
  async handleWebhook(events: any[]): Promise<void> {
    for (const event of events) {
      try {
        switch (event.type) {
          case 'message':
            await this.handleMessageEvent(event);
            break;
          case 'follow':
            await this.handleFollowEvent(event);
            break;
          case 'unfollow':
            await this.handleUnfollowEvent(event);
            break;
          default:
            console.log(`未处理的事件类型: ${event.type}`);
        }
      } catch (error) {
        console.error('处理LINE事件异常:', error);
      }
    }
  }

  /**
   * 处理用户消息事件
   */
  private async handleMessageEvent(event: any): Promise<void> {
    const userId = event.source.userId;
    const messageText = event.message.text;

    // 简单的关键词回复
    if (messageText?.includes('帮助') || messageText?.includes('help')) {
      const helpMessage: LineMessage = {
        type: 'text',
        text: '欢迎使用H5营销系统！\n\n您可以：\n🎫 浏览最新活动\n🛒 参与团购活动\n💰 查看我的券码\n\n访问主页: ' + this.getBaseUrl()
      };
      await this.pushMessage(userId, [helpMessage]);
    }
  }

  /**
   * 处理用户关注事件
   */
  private async handleFollowEvent(event: any): Promise<void> {
    const userId = event.source.userId;
    
    const welcomeMessage: LineMessage = {
      type: 'text',
      text: '🎉 欢迎关注H5营销系统！\n\n在这里您可以参与各种优惠活动，获取专属券码。\n\n立即浏览: ' + this.getBaseUrl()
    };
    
    await this.pushMessage(userId, [welcomeMessage]);
  }

  /**
   * 处理用户取消关注事件
   */
  private async handleUnfollowEvent(event: any): Promise<void> {
    const userId = event.source.userId;
    console.log(`用户 ${userId} 取消关注`);
    // 这里可以添加数据清理逻辑
  }

  /**
   * 获取应用基础URL
   */
  private getBaseUrl(): string {
    const domains = process.env.REPLIT_DOMAINS || 'localhost:5000';
    const domain = domains.split(',')[0];
    return `https://${domain}`;
  }

  /**
   * 验证LINE Webhook签名
   */
  static verifySignature(body: string, signature: string, channelSecret: string): boolean {
    try {
      const crypto = require('crypto');
      const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
      return hash === signature;
    } catch (error) {
      console.error('验证LINE签名失败:', error);
      return false;
    }
  }
}

export const lineMessagingService = new LineMessagingService();