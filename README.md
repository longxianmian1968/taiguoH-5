# H5营销系统

一个针对泰国市场的H5移动端营销平台，集成LINE LIFF，支持多种营销活动类型。

## 功能特点

- 🎯 多种营销活动：优惠券、团购、预售、招商
- 🌏 多语言支持：中文/泰文自动切换
- 📱 移动端优化：专为手机浏览器设计
- 🔗 LINE集成：LIFF应用，消息推送
- 🎫 QR码系统：券码生成与核销
- 🛡️ 企业级安全：多层防护机制

## 技术栈

- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + Drizzle ORM
- Database: PostgreSQL
- Platform: Vercel + Neon Database

## 部署到Vercel

1. Fork或clone此仓库
2. 在Vercel中导入项目
3. 设置环境变量
4. 部署完成

## 环境变量

```env
DATABASE_URL=postgresql://...
LINE_LIFF_ID=your-liff-id
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-access-token
SESSION_SECRET=your-session-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:5000
