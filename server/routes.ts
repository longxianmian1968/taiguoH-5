import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from 'multer';
import path from 'path';

import { z } from "zod";
import { insertActivitySchema, insertStoreSchema, insertCouponSchema, insertRedeemSchema } from "@shared/schema";
import { alibabaTranslationService } from "./services/alibaba-translation";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // PRIORITY: API routes MUST be registered FIRST before Vite middleware
  
  // Setup multer for file uploads (in-memory storage)
  const upload = multer({ storage: multer.memoryStorage() });
  
  // 导入安全中间件
  const { loginRateLimit, adminRateLimit, enhancedAdminAuth } = await import('./middleware/security');

  // Admin authentication API - MUST be before any other middleware
  app.post('/admin/api/login', loginRateLimit, async (req, res) => {
    try {
      const { username, password } = req.body;

      
      // 验证输入
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ 
          code: 'AUTH001',
          message: '用户名和密码不能为空' 
        });
      }

      // 使用环境变量或加密存储的管理员凭据
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-in-production';
      
      if (username === adminUsername && password === adminPassword) {
        // Get or create admin user
        let admin = await storage.getUserByUsername(username);
        if (!admin) {
          admin = await storage.createUser({
            username,
            role: 'admin',
            lineUserId: 'admin-line-id-longxianmian'
          });
        }
        
        // Set session and wait for it to save
        (req.session as any).userId = admin.id;
        (req.session as any).username = admin.username;
        (req.session as any).role = admin.role;
        (req.session as any).lastActivity = Date.now();
        (req.session as any).clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Session已经自动保存，直接响应
        res.json({ 
          code: 0,
          message: '登录成功', 
          data: { 
            id: admin.id, 
            username: admin.username, 
            role: admin.role 
          } 
        });
      } else {
        res.status(401).json({ 
          code: 'AUTH002',
          message: '用户名或密码错误' 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        code: 'AUTH003',
        message: '服务器错误' 
      });
    }
  });

  // Admin logout API
  app.post('/admin/api/logout', async (req, res) => {
    try {
      req.session?.destroy((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ code: 'AUTH004', message: '退出失败' });
        }
        res.json({ code: 0, message: '退出成功' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ code: 'AUTH005', message: '服务器错误' });
    }
  });

  // Admin auth status API 
  app.get('/admin/api/auth/status', (req, res) => {
    if ((req.session as any)?.role === 'admin' && (req.session as any)?.userId) {
      res.json({ 
        isAuthenticated: true,
        user: {
          id: (req.session as any).userId,
          username: (req.session as any).username,
          role: (req.session as any).role
        }
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  });

  // Admin routes are handled by React router normally through Vite

  // Legacy redirect
  app.get('/management/login', (req, res) => {
    // 强制防缓存头
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', new Date().toUTCString());
    res.setHeader('ETag', `"${Date.now()}"`);
    res.setHeader('X-Cache-Bust', Date.now().toString());
    
    // 立即发送响应并结束，防止被Vite中间件覆盖
    res.status(200).set({ "Content-Type": "text/html" });
    res.end(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>后台管理登录</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .login-container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 400px;
    }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #333; font-size: 24px; margin-bottom: 8px; }
    .logo p { color: #666; font-size: 14px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 6px; color: #333; font-weight: 500; }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .login-btn {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .login-btn:hover { background: #5a6fd8; }
    .login-btn:disabled { background: #ccc; cursor: not-allowed; }
    .error-msg { color: #e74c3c; font-size: 14px; margin-top: 10px; display: none; }
    .success-msg { color: #27ae60; font-size: 14px; margin-top: 10px; display: none; }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <h1>🛡️ 后台管理登录</h1>
      <p>请使用管理员账号进行登录</p>
    </div>
    
    <form id="loginForm">
      <div class="form-group">
        <label for="username">用户名 (邮箱)</label>
        <input type="email" id="username" name="username" placeholder="请输入管理员邮箱" required>
      </div>
      
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" name="password" placeholder="请输入管理员密码" required>
      </div>
      
      <button type="submit" class="login-btn" id="loginBtn">登录</button>
      <div class="error-msg" id="errorMsg"></div>
      <div class="success-msg" id="successMsg"></div>
    </form>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = document.getElementById('loginBtn');
      const errorMsg = document.getElementById('errorMsg');
      const successMsg = document.getElementById('successMsg');
      
      btn.disabled = true;
      btn.textContent = '登录中...';
      errorMsg.style.display = 'none';
      successMsg.style.display = 'none';
      
      try {
        const response = await fetch('/admin/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
          })
        });
        
        const data = await response.json();
        
        if (data.code === 0) {
          successMsg.textContent = '登录成功，正在跳转...';
          successMsg.style.display = 'block';
          setTimeout(() => {
            window.location.href = '/admin/activities';
          }, 1000);
        } else {
          errorMsg.textContent = data.message || '登录失败';
          errorMsg.style.display = 'block';
        }
      } catch (error) {
        errorMsg.textContent = '网络错误，请重试';
        errorMsg.style.display = 'block';
      }
      
      btn.disabled = false;
      btn.textContent = '登录';
    });
  </script>
</body>
</html>`);
    

    return; // 确保响应结束，不继续到下一个中间件
  });
  

  // Admin authentication middleware (AFTER login routes) - only for protected routes
  const adminAuth = async (req: any, res: any, next: any) => {

    
    // CRITICAL: Always allow login page and auth API endpoints - ADD MORE SPECIFIC CHECKS
    if (req.path === '/admin/login' || 
        req.path === '/admin/api/login' || 
        req.path === '/admin/api/logout' ||
        req.originalUrl === '/admin/login' ||
        req.url === '/admin/login') {

      return next();
    }

    // Check session for admin user
    if (!req.session?.userId || !req.session?.role || req.session.role !== 'admin') {

      // For API requests, return JSON error
      if (req.path.startsWith('/admin/api/') || req.path.includes('.json')) {
        return res.status(403).json({ 
          code: 'AUTH001', 
          message: '请先登录管理员账户' 
        });
      }
      // For HTML pages, redirect to root (React will handle routing)
      return res.redirect('/');
    }
    

    next();
  };

  // Apply enhanced admin authentication to protected /admin/api routes only (NOT to /admin/login)
  app.use('/admin/api/activities', adminRateLimit, enhancedAdminAuth);
  app.use('/admin/api/stores', adminRateLimit, enhancedAdminAuth);  
  app.use('/admin/api/redeems', adminRateLimit, enhancedAdminAuth);
  app.use('/admin/api/stats', adminRateLimit, enhancedAdminAuth);
  app.use('/admin/api/staff', adminRateLimit, enhancedAdminAuth);
  app.use('/admin/api/i18n', adminRateLimit, enhancedAdminAuth);
  app.use('/admin/api/cities', adminRateLimit, enhancedAdminAuth);
  // COMPLETELY COMMENT OUT THIS PROBLEMATIC MIDDLEWARE
  // app.use('/admin/api', (req, res, next) => {
  //   // Skip login/logout endpoints
  //   if (req.path.includes('/login') || req.path.includes('/logout')) {
  //     return next();
  //   }
  //   adminAuth(req, res, next);
  // });

  // ==== ADMIN API ROUTES ====
  
  // Admin Activities Management
  app.get('/admin/api/activities', async (req, res) => {
    try {
      const { search, type, status, cityId } = req.query;
      const activities = await storage.getActivities({
        search: search as string,
        type: type as string,
        status: status as string,
        cityId: cityId ? parseInt(cityId as string) : undefined,
      });
      res.json({ code: 0, message: 'OK', data: activities });
    } catch (error) {
      res.status(500).json({ code: 'A001', message: (error as Error).message });
    }
  });

  app.post('/admin/api/activities', async (req, res) => {
    try {
      console.log('🔵 Session info:', req.session);
      console.log('🔵 Creating activity with data:', JSON.stringify(req.body, null, 2));
      
      // 转换数据类型以匹配schema
      const processedData = {
        ...req.body,
        price: typeof req.body.price === 'number' ? req.body.price.toString() : req.body.price,
        listPrice: req.body.listPrice ? (typeof req.body.listPrice === 'number' ? req.body.listPrice.toString() : req.body.listPrice) : undefined,
        startAt: typeof req.body.startAt === 'string' ? new Date(req.body.startAt) : req.body.startAt,
        endAt: typeof req.body.endAt === 'string' ? new Date(req.body.endAt) : req.body.endAt,
      };
      
      console.log('🔄 Processed data:', JSON.stringify(processedData, null, 2));
      
      const validatedData = insertActivitySchema.parse(processedData);
      
      console.log('✅ Validation passed, processing data:', JSON.stringify(validatedData, null, 2));
      
      // 智能多语言处理 - 检测输入语言并自动翻译
      if (validatedData.title) {
        const isThaiInput = /[\u0E00-\u0E7F]/.test(validatedData.title);
        if (isThaiInput) {
          // 输入为泰文，翻译为中文
          try {
            validatedData.titleTh = validatedData.title;
            validatedData.title = await alibabaTranslationService.translateContent(validatedData.title, 'th', 'zh');
          } catch (error) {
            console.error('Thai to Chinese translation failed:', error);
            validatedData.title = validatedData.titleTh = validatedData.title;
          }
        } else {
          // 输入为中文，翻译为泰文
          try {
            validatedData.titleTh = await alibabaTranslationService.translateContent(validatedData.title, 'zh', 'th');
          } catch (error) {
            console.error('Chinese to Thai translation failed:', error);
            validatedData.titleTh = validatedData.title;
          }
        }
      }
      
      if (validatedData.rules) {
        const isThaiInput = /[\u0E00-\u0E7F]/.test(validatedData.rules);
        if (isThaiInput) {
          // 输入为泰文，翻译为中文
          try {
            validatedData.rulesTh = validatedData.rules;
            validatedData.rules = await alibabaTranslationService.translateContent(validatedData.rules, 'th', 'zh');
          } catch (error) {
            console.error('Thai to Chinese rules translation failed:', error);
            validatedData.rules = validatedData.rulesTh = validatedData.rules;
          }
        } else {
          // 输入为中文，翻译为泰文
          try {
            validatedData.rulesTh = await alibabaTranslationService.translateContent(validatedData.rules, 'zh', 'th');
          } catch (error) {
            console.error('Chinese to Thai rules translation failed:', error);
            validatedData.rulesTh = validatedData.rules;
          }
        }
      }
      
      console.log('🌐 After translation:', JSON.stringify(validatedData, null, 2));
      
      // 计算折扣（如果有原价）
      if (validatedData.listPrice && validatedData.price) {
        const price = parseFloat(validatedData.price);
        const listPrice = parseFloat(validatedData.listPrice);
        if (listPrice > 0) {
          validatedData.discount = ((price / listPrice) * 10).toFixed(1);
          console.log(`💰 Calculated discount: ${validatedData.discount}折 (${price}/${listPrice})`);
        }
      }
      
      const activity = await storage.createActivity(validatedData);
      console.log('✅ Activity created successfully:', activity.id);
      
      // 处理多图上传 coverUrls
      if (req.body.coverUrls && Array.isArray(req.body.coverUrls) && req.body.coverUrls.length > 0) {
        await storage.updateActivity(activity.id, {
          coverUrls: req.body.coverUrls
        });
        console.log('✅ Activity cover URLs updated:', req.body.coverUrls.length, 'images');
      }
      
      // 处理模块化配置 - 共用底座+专门模块架构
      const moduleConfig = req.body.moduleConfig;
      if (moduleConfig && activity.id) {
        if (activity.type === 'group' && moduleConfig.groupNRequired) {
          // 创建团购配置
          await storage.createGroupActivity({
            activityId: activity.id,
            nRequired: moduleConfig.groupNRequired,
            timeLimitHours: moduleConfig.groupTimeLimitHours || 24,
            useValidHours: moduleConfig.groupUseValidHours || 72,

          });
          console.log('✅ Group module configuration created');
        } else if (activity.type === 'presale' && moduleConfig.presalePickupStart) {
          // 创建预售配置
          await storage.createPresaleActivity({
            activityId: activity.id,
            pickupStart: new Date(moduleConfig.presalePickupStart),
            pickupEnd: new Date(moduleConfig.presalePickupEnd),
            arrivalNotice: moduleConfig.presaleArrivalNotice !== false
          });
          console.log('✅ Presale module configuration created');
        } else if (activity.type === 'franchise' && moduleConfig.franchiseDefaultOwner) {
          // 创建招商表单配置
          const standardFormFields = [
            { type: 'text', name: 'name', label: { zh: '姓名', th: 'ชื่อ' }, required: true },
            { type: 'tel', name: 'mobile', label: { zh: '手机号', th: 'เบอร์โทรศัพท์' }, required: true },
            { type: 'text', name: 'city', label: { zh: '所在城市', th: 'เมืองที่อยู่' }, required: true },
            { type: 'select', name: 'budget', label: { zh: '投资预算', th: 'งบลงทุน' }, options: [
              { value: '50-100万', label: { zh: '50-100万', th: '50-100 หมื่น' } },
              { value: '100-200万', label: { zh: '100-200万', th: '100-200 หมื่น' } },
              { value: '200万以上', label: { zh: '200万以上', th: 'มากกว่า 200 หมื่น' } }
            ] },
            { type: 'textarea', name: 'intent', label: { zh: '加盟意向', th: 'ความตั้งใจในการแฟรนไชส์' } }
          ];
          
          await storage.createFranchiseForm({
            name: activity.title,
            fields: standardFormFields,
            enabled: true
          });
          console.log('✅ Franchise module configuration created');
        }
      }
      
      res.json({ code: 0, message: 'OK', data: activity });
    } catch (error) {
      console.error('❌ Activity creation failed:', error);
      if (error instanceof z.ZodError) {
        console.error('❌ Zod validation errors:', error.errors);
        return res.status(400).json({ 
          code: 'A005', 
          message: '数据验证失败', 
          data: error.errors 
        });
      }
      res.status(500).json({ code: 'S009', message: (error as Error).message });
    }
  });

  app.put('/admin/api/activities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await storage.updateActivity(id, req.body);
      res.json({ code: 0, message: '活动更新成功', data: activity });
    } catch (error) {
      res.status(500).json({ code: 'A003', message: (error as Error).message });
    }
  });

  // Admin Stores Management
  app.get('/admin/api/stores', async (req, res) => {
    try {
      const { search, cityId } = req.query;
      const stores = await storage.getStores({
        search: search as string,
        cityId: cityId ? parseInt(cityId as string) : undefined,
      });
      res.json({ code: 0, message: 'OK', data: stores });
    } catch (error) {
      res.status(500).json({ code: 'ST001', message: (error as Error).message });
    }
  });

  app.post('/admin/api/stores', async (req, res) => {
    try {
      // 验证必需字段
      const { name, address, phone, cityId } = req.body;
      if (!name || !address || !phone || !cityId) {
        return res.status(400).json({ 
          code: 'ST003', 
          message: '门店名称、地址、电话和城市ID为必填项' 
        });
      }

      const store = await storage.createStore(req.body);
      res.json({ code: 0, message: '门店创建成功', data: store });
    } catch (error) {
      console.error('Create store error:', error);
      res.status(500).json({ code: 'ST002', message: (error as Error).message });
    }
  });

  // Admin Staff Management
  app.get('/admin/api/staff', async (req, res) => {
    try {
      const { storeId, search } = req.query;
      const staff = await storage.getStaff({
        storeId: storeId as string,
        search: search as string,
      });
      res.json({ code: 0, message: 'OK', data: staff });
    } catch (error) {
      res.status(500).json({ code: 'SF001', message: (error as Error).message });
    }
  });

  app.post('/admin/api/staff', async (req, res) => {
    try {
      const staff = await storage.createStaff(req.body);
      res.json({ code: 0, message: '员工创建成功', data: staff });
    } catch (error) {
      res.status(500).json({ code: 'SF002', message: (error as Error).message });
    }
  });

  app.put('/admin/api/staff/:id/authorization', async (req, res) => {
    try {
      const { id } = req.params;
      const { storeId, canVerify } = req.body;
      await storage.updateStaffAuthorization(id, storeId, canVerify);
      res.json({ code: 0, message: '员工权限更新成功' });
    } catch (error) {
      res.status(500).json({ code: 'SF003', message: (error as Error).message });
    }
  });

  // Remove staff from store
  app.delete('/admin/api/staff/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { storeId } = req.body;
      const success = await storage.removeStaff(id, storeId);
      if (success) {
        res.json({ code: 0, message: '员工删除成功' });
      } else {
        res.status(404).json({ code: 'SF004', message: '员工不存在或删除失败' });
      }
    } catch (error) {
      res.status(500).json({ code: 'SF005', message: (error as Error).message });
    }
  });

  // Get staff details with performance metrics
  app.get('/admin/api/staff/:id/details', async (req, res) => {
    try {
      const { id } = req.params;
      const { storeId } = req.query;
      const staffDetails = await storage.getStaffDetails(id, storeId as string);
      if (staffDetails) {
        res.json({ code: 0, message: 'OK', data: staffDetails });
      } else {
        res.status(404).json({ code: 'SF006', message: '员工不存在' });
      }
    } catch (error) {
      res.status(500).json({ code: 'SF007', message: (error as Error).message });
    }
  });

  // ========= LINE Binding APIs - LINE绑定管理 =========
  
  // Generate LINE binding invitation for store
  app.post('/admin/api/stores/:storeId/generate-binding', async (req, res) => {
    try {
      const { storeId } = req.params;
      const { noteName, mobile } = req.body;
      
      // Generate secure token only (no code needed for QR scan)
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 24 hours from now
      const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const bindToken = await storage.createBindToken({
        employeeId: null, // No employee ID yet - will be created after binding
        token,
        code: null, // No code needed for QR scan binding
        expireAt,
        noteName,
        mobile,
        storeId, // Add store ID to bind token
      });
      
      // Generate binding URL (direct to our H5 page)
      const baseUrl = req.get('host') ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000';
      const liffUrl = `${baseUrl}/line-binding?token=${token}`;
      
      res.json({
        code: 0,
        message: '绑定邀请生成成功',
        data: {
          token,
          liffUrl,
          expireAt,
          qrCodeData: liffUrl, // For QR code generation
        }
      });
    } catch (error) {
      res.status(500).json({ code: 'LB001', message: (error as Error).message });
    }
  });



  // Complete LINE binding
  app.post('/api/line-binding/complete', async (req, res) => {
    try {
      const { token, lineUserId, liffSub } = req.body;
      
      if (!token || !lineUserId) {
        return res.status(400).json({ code: 'LB008', message: '缺少必要参数' });
      }
      
      const bindToken = await storage.getBindToken(token);
      
      if (!bindToken) {
        return res.status(404).json({ code: 'LB009', message: '绑定令牌不存在或已失效' });
      }
      
      if (!bindToken.storeId) {
        return res.status(400).json({ code: 'LB011', message: '绑定令牌缺少门店信息' });
      }
      
      // Check if expired
      if (new Date() > bindToken.expireAt) {
        return res.status(400).json({ code: 'LB010', message: '绑定令牌已过期' });
      }
      
      // Check if already used
      if (bindToken.usedAt) {
        return res.status(400).json({ code: 'LB012', message: '绑定令牌已使用' });
      }

      // Create or update user with LINE ID
      let user = await storage.getUserByLineId(lineUserId);
      if (!user) {
        // Create new user
        user = await storage.createUser({
          lineUserId,
          username: bindToken.noteName || `LINE用户_${lineUserId.slice(-6)}`,
          role: 'staff',
        });
      } else {
        // Update username if provided
        if (bindToken.noteName && user.username !== bindToken.noteName) {
          await storage.updateUser(user.id, { username: bindToken.noteName });
        }
      }

      // Create store staff relationship
      const existingStaff = await storage.isStaffAuthorizedForStore(user.id, bindToken.storeId);
      if (!existingStaff) {
        await storage.addStoreStaff({
          storeId: bindToken.storeId,
          userId: user.id,
          canVerify: true, // Default to can verify
        });
      }

      // Mark token as used
      await storage.updateBindTokenUsage(bindToken.id, true);

      res.json({
        code: 0,
        message: 'LINE绑定成功',
        data: {
          employeeId: user.id,
          storeId: bindToken.storeId,
        }
      });
    } catch (error) {
      res.status(500).json({ code: 'LB012', message: (error as Error).message });
    }
  });

  // Get binding status for staff member
  app.get('/admin/api/staff/:id/binding-status', async (req, res) => {
    try {
      const { id: employeeId } = req.params;
      
      const user = await storage.getUser(employeeId);
      
      if (!user) {
        return res.status(404).json({ code: 'LB013', message: '员工不存在' });
      }
      
      res.json({
        code: 0,
        message: 'OK',
        data: {
          isBound: !!user.lineUserId,
          lineUserId: user.lineUserId,
          bindAt: user.bindAt,
          role: user.role,
        }
      });
    } catch (error) {
      res.status(500).json({ code: 'LB014', message: (error as Error).message });
    }
  });

  // Store detailed APIs - 门店详细信息API
  app.get('/admin/api/stores/:id', async (req, res) => {
    try {
      const store = await storage.getStore(req.params.id);
      if (!store) {
        return res.status(404).json({ code: 1, message: '门店不存在' });
      }
      res.json({ code: 0, data: store });
    } catch (error) {
      console.error('Get store error:', error);
      res.status(500).json({ code: 1, message: '获取门店信息失败' });
    }
  });

  app.get('/admin/api/stores/:storeId/analytics', async (req, res) => {
    try {
      const { storeId } = req.params;
      const filters = req.query;
      
      // Get store analytics data
      const analytics = await storage.getRedemptionStats({
        storeId,
        ...filters as any
      });
      
      res.json({ code: 0, data: analytics });
    } catch (error) {
      console.error('Get store analytics error:', error);
      res.status(500).json({ code: 1, message: '获取门店数据失败' });
    }
  });

  app.get('/admin/api/stores/:storeId/activities', async (req, res) => {
    try {
      const { storeId } = req.params;
      
      // Get activities for this store
      const activities = await storage.getActivities();
      // Filter activities that apply to this store
      const storeActivities = [];
      for (const activity of activities) {
        const activityStores = await storage.getStoresByActivityId(activity.id);
        if (activityStores.some(store => store.id === storeId)) {
          storeActivities.push(activity);
        }
      }
      
      res.json({ code: 0, data: storeActivities });
    } catch (error) {
      console.error('Get store activities error:', error);
      res.status(500).json({ code: 1, message: '获取门店活动失败' });
    }
  });

  app.get('/admin/api/stores/:storeId/staff-performance', async (req, res) => {
    try {
      const { storeId } = req.params;
      const filters = req.query;
      
      // Get staff performance data
      const staff = await storage.getStaff({ storeId });
      
      res.json({ code: 0, data: staff });
    } catch (error) {
      console.error('Get staff performance error:', error);
      res.status(500).json({ code: 1, message: '获取员工表现失败' });
    }
  });

  // Statistics APIs - 数据统计API
  app.get('/admin/api/stats/overview', async (req, res) => {
    try {
      const filters = req.query as { startDate?: string; endDate?: string };
      const stats = await storage.getOverviewStats(filters);
      res.json({ code: 0, data: stats });
    } catch (error) {
      console.error('Get overview stats error:', error);
      res.status(500).json({ code: 1, message: '获取统计数据失败' });
    }
  });

  app.get('/admin/api/stats/redemptions', async (req, res) => {
    try {
      const filters = req.query as any;
      const stats = await storage.getRedemptionStats(filters);
      res.json({ code: 0, data: stats });
    } catch (error) {
      res.status(500).json({ code: 'SF003', message: (error as Error).message });
    }
  });

  // Admin Redemption Records
  app.get('/admin/api/redeems', async (req, res) => {
    try {
      const { storeId, staffId, activityId, status, from, to } = req.query;
      const redeems = await storage.getRedeems({
        storeId: storeId as string,
        staffId: staffId as string,
        activityId: activityId as string,
        status: status as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      });
      res.json({ code: 0, message: 'OK', data: redeems });
    } catch (error) {
      res.status(500).json({ code: 'RD001', message: (error as Error).message });
    }
  });

  app.post('/admin/api/redeems/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await storage.cancelRedeem(id, reason);
      res.json({ code: 0, message: '核销记录已撤销' });
    } catch (error) {
      res.status(500).json({ code: 'RD002', message: (error as Error).message });
    }
  });

  // Admin Statistics and Data Aggregation
  app.get('/admin/api/stats/overview', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getOverviewStats({
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json({ code: 0, message: 'OK', data: stats });
    } catch (error) {
      res.status(500).json({ code: 'ST001', message: (error as Error).message });
    }
  });

  app.get('/admin/api/stats/redemptions', async (req, res) => {
    try {
      const { startDate, endDate, storeId, activityId, staffId } = req.query;
      const stats = await storage.getRedemptionStats({
        startDate: startDate as string,
        endDate: endDate as string,
        storeId: storeId as string,
        activityId: activityId as string,
        staffId: staffId as string,
      });
      res.json({ code: 0, message: 'OK', data: stats });
    } catch (error) {
      res.status(500).json({ code: 'ST002', message: (error as Error).message });
    }
  });

  // CSV Export Endpoints
  app.get('/admin/api/export/activities', async (req, res) => {
    try {
      const activities = await storage.getActivities({});
      const csv = generateActivitiesCSV(activities);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ code: 'EX001', message: (error as Error).message });
    }
  });

  app.get('/admin/api/export/redeems', async (req, res) => {
    try {
      const { startDate, endDate, storeId, activityId } = req.query;
      const redeems = await storage.getRedeems({
        from: startDate ? new Date(startDate as string) : undefined,
        to: endDate ? new Date(endDate as string) : undefined,
        storeId: storeId as string,
        activityId: activityId as string,
      });
      const csv = generateRedeemsCSV(redeems);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=redeems.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ code: 'EX002', message: (error as Error).message });
    }
  });

  // Cities API
  app.get('/admin/api/cities', async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json({ code: 0, message: 'OK', data: cities });
    } catch (error) {
      res.status(500).json({ code: 'CT001', message: (error as Error).message });
    }
  });

  // Activity Analytics API - 活动数据统计
  app.get('/admin/api/activity-analytics', async (req, res) => {
    try {
      const analytics = await storage.getActivityAnalytics();
      res.json({ code: 0, message: 'OK', data: analytics });
    } catch (error) {
      console.error('Error fetching activity analytics:', error);
      res.status(500).json({ code: 'AA001', message: 'Failed to fetch activity analytics' });
    }
  });

  // Get group config
  app.get('/api/activities/:id/group-config', async (req, res) => {
    try {
      const groupConfig = await storage.getGroupActivity(req.params.id);
      res.json({ code: 0, message: 'OK', data: groupConfig });
    } catch (error) {
      console.error('Failed to get group config:', error);
      res.status(500).json({ code: 500, message: 'Failed to get group config' });
    }
  });

  // Get group instances for activity
  app.get('/api/activities/:id/group-instances', async (req, res) => {
    try {
      const instances = await storage.getGroupInstancesByActivity(req.params.id);
      res.json({ code: 0, message: 'OK', data: instances });
    } catch (error) {
      console.error('Failed to get group instances:', error);
      res.status(500).json({ code: 500, message: 'Failed to get group instances' });
    }
  });

  // Demo Data Seeding Endpoint (仅用于演示)
  app.post('/admin/api/seed-demo-data', async (req, res) => {
    try {
      // 创建示例活动
      const activity1 = await storage.createActivity({
        title: '春节现金体验券',
        titleTh: 'คูปองทดลองใช้เงินสดตรุษจีน',
        type: 'coupon',
        coverUrl: '/demo-cover-1.jpg',
        stockTotal: 1000,
        price: '0',
        listPrice: '50.00',
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-02-28'),

        rules: '限曼谷地区门店使用，单笔消费满200泰铢可用',
        rulesTh: 'ใช้ได้เฉพาะในร้านค้าในกรุงเทพฯ เมื่อซื้อครบ 200 บาท',

        status: 'published'
      });

      const activity2 = await storage.createActivity({
        title: '泰式餐厅加盟机会',
        titleTh: 'โอกาสแฟรนไชส์ร้านอาหารไทย',
        type: 'franchise',
        coverUrl: '/demo-cover-2.jpg',
        stockTotal: 50,
        price: '150000',
        startAt: new Date('2025-01-15'),
        endAt: new Date('2025-06-30'),
        rules: '全国范围招商，提供完整培训支持',
        rulesTh: 'เปิดรับสมัครทั่วประเทศ พร้อมการฝึกอบรมที่ครบถ้วน',

        status: 'published'
      });

      // 创建示例城市（如果不存在）
      const existingCities = await storage.getCities();
      if (existingCities.length === 0) {
        await storage.createCity({ id: 1, name: '曼谷', nameEn: 'Bangkok', nameTh: 'กรุงเทพฯ' });
        await storage.createCity({ id: 2, name: '清迈', nameEn: 'Chiang Mai', nameTh: 'เชียงใหม่' });
        await storage.createCity({ id: 3, name: '普吉', nameEn: 'Phuket', nameTh: 'ภูเก็ต' });
      }

      // 创建示例门店
      const store1 = await storage.createStore({
        cityId: 1,
        name: '暹罗广场旗舰店',
        address: '暹罗广场购物中心 G层 G001号',
        lat: '13.7463',
        lng: '100.5332',
        contact: '张经理',
        phone: '+66-2-123-4567',
        status: 'active'
      });

      const store2 = await storage.createStore({
        cityId: 1,
        name: '素坤逸路分店',
        address: '素坤逸路21号 Terminal 21 商场 2层',
        lat: '13.7392',
        lng: '100.5611',
        contact: '李经理',
        phone: '+66-2-234-5678',
        status: 'active'
      });

      const store3 = await storage.createStore({
        cityId: 2,
        name: '清迈古城店',
        address: '清迈古城内塔佩路88号',
        lat: '18.7883',
        lng: '98.9853',
        contact: '王经理',
        phone: '+66-53-123-456',
        status: 'active'
      });

      // 创建示例导购员
      const staff1 = await storage.createUser({
        lineUserId: 'staff001',
        username: '小美导购',
        role: 'staff'
      });

      const staff2 = await storage.createUser({
        lineUserId: 'staff002',
        username: '阿明导购',
        role: 'staff'
      });

      const staff3 = await storage.createUser({
        lineUserId: 'staff003',
        username: '素妮导购',
        role: 'staff'
      });

      const staff4 = await storage.createUser({
        lineUserId: 'staff004',
        username: '玛丽导购',
        role: 'staff'
      });

      // 分配导购到门店
      await storage.addStoreStaff({ storeId: store1.id, userId: staff1.id, canVerify: true });
      await storage.addStoreStaff({ storeId: store1.id, userId: staff2.id, canVerify: true });
      await storage.addStoreStaff({ storeId: store2.id, userId: staff3.id, canVerify: true });
      await storage.addStoreStaff({ storeId: store3.id, userId: staff4.id, canVerify: true });

      // 创建示例用户
      const demoUsers = [];
      for (let i = 0; i < 8; i++) {
        const user = await storage.createUser({
          lineUserId: `demo-user-${i}`,
          username: `演示用户${i + 1}`,
          role: 'user',
        });
        demoUsers.push(user);
      }

      // 创建示例用户领券记录
      for (let i = 0; i < 8; i++) {
        await storage.createCoupon({
          activityId: activity1.id,
          userId: demoUsers[i].id,
          code: `SPRING2025-${String(i).padStart(3, '0')}`,
          status: 'active',
          expiresAt: new Date('2025-03-31')
        });
      }

      for (let i = 0; i < 3; i++) {
        await storage.createCoupon({
          activityId: activity2.id,
          userId: demoUsers[i].id,
          code: `FRANCHISE2025-${String(i).padStart(3, '0')}`,
          status: 'active',
          expiresAt: new Date('2025-06-30')
        });
      }

      // 创建示例核销记录
      const redemptions = [
        // 暹罗广场店 - 小美导购核销3次，阿明导购核销2次
        { activityId: activity1.id, storeId: store1.id, staffId: staff1.id, code: 'SPRING2025-000' },
        { activityId: activity1.id, storeId: store1.id, staffId: staff1.id, code: 'SPRING2025-001' },
        { activityId: activity1.id, storeId: store1.id, staffId: staff1.id, code: 'SPRING2025-002' },
        { activityId: activity1.id, storeId: store1.id, staffId: staff2.id, code: 'SPRING2025-003' },
        { activityId: activity1.id, storeId: store1.id, staffId: staff2.id, code: 'SPRING2025-004' },
        
        // 素坤逸路店 - 素妮导购核销1次
        { activityId: activity1.id, storeId: store2.id, staffId: staff3.id, code: 'SPRING2025-005' },
        
        // 清迈古城店 - 玛丽导购核销0次（展示0核销情况）
        
        // 加盟活动核销记录
        { activityId: activity2.id, storeId: store1.id, staffId: staff1.id, code: 'FRANCHISE2025-000' },
      ];

      for (const redemption of redemptions) {
        await storage.createRedeem({
          ...redemption,
          status: 'verified',
          redemptionType: 'qr_scan'
        });
      }

      res.json({ 
        code: 0, 
        message: '演示数据创建成功', 
        data: {
          activities: [activity1.id, activity2.id],
          stores: [store1.id, store2.id, store3.id],
          staff: [staff1.id, staff2.id, staff3.id, staff4.id],
          redemptionsCreated: redemptions.length
        }
      });
    } catch (error) {
      console.error('Error seeding demo data:', error);
      res.status(500).json({ code: 'SEED001', message: '创建演示数据失败' });
    }
  });

  // UNIFIED ARCHITECTURE API ENDPOINTS
  
  // Activity Store Management API - 活动适用门店管理
  app.get('/admin/api/activities/:activityId/stores', async (req, res) => {
    try {
      const { activityId } = req.params;
      const stores = await storage.getStoresByActivityId(activityId);
      res.json({ code: 0, message: 'OK', data: stores });
    } catch (error) {
      console.error('Get activity stores error:', error);
      res.status(500).json({ code: 'AS001', message: 'Failed to get activity stores' });
    }
  });

  app.post('/admin/api/activities/:activityId/stores', async (req, res) => {
    try {
      const { activityId } = req.params;
      const { storeIds } = req.body;
      
      if (!Array.isArray(storeIds)) {
        return res.status(400).json({ code: 'AS002', message: 'Store IDs must be an array' });
      }

      // Import db and sql for database operations
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');

      // Clear existing mappings
      await db.execute(sql`DELETE FROM activity_store WHERE activity_id = ${activityId}`);
      
      // Insert new mappings
      if (storeIds.length > 0) {
        const values = storeIds.map(storeId => `('${activityId}', '${storeId}')`).join(', ');
        await db.execute(sql`INSERT INTO activity_store (activity_id, store_id) VALUES ${sql.raw(values)}`);
      }
      
      res.json({ code: 0, message: 'Activity store mapping updated successfully' });
    } catch (error) {
      console.error('Update activity stores error:', error);
      res.status(500).json({ code: 'AS003', message: 'Failed to update activity stores' });
    }
  });

  // Near Store Recommendation API - 就近门店推荐 (CRITICAL: This is required for the frontend)
  app.get('/api/activities/:activityId/nearby-stores', async (req, res) => {
    try {
      const { activityId } = req.params;
      const { lat, lng, limit = 3 } = req.query;
      
      const stores = await storage.getActivityStores(
        activityId, 
        lat ? parseFloat(lat as string) : undefined, 
        lng ? parseFloat(lng as string) : undefined, 
        parseInt(limit as string)
      );
      
      res.json({ code: 0, message: 'OK', data: stores });
    } catch (error) {
      console.error('Get nearby stores error:', error);
      res.status(500).json({ code: 'NS001', message: 'Failed to get nearby stores' });
    }
  });

  // ==== END ADMIN API ROUTES ====

  // Frontend API Routes

  // Get activities for brand page - only show published activities
  app.get('/api/activities', async (req, res) => {
    try {
      const { type, q, cursor, page_size } = req.query;
      const activities = await storage.getActivities({
        type: type as string,
        search: q as string,
        cursor: cursor as string,
        pageSize: page_size ? parseInt(page_size as string) : 20,
        status: 'published', // Only show published activities to public users
      });

      res.json({ code: 0, message: 'OK', data: activities });
    } catch (error) {
      res.status(500).json({ code: 'S001', message: (error as Error).message });
    }
  });

  // Get activity detail with coverage check - only show published activities
  app.get('/api/activities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { ipCity, lat, lng } = req.query;
      
      const activity = await storage.getActivity(id);
      if (!activity) {
        return res.status(404).json({ code: 'A002', message: '活动不存在' });
      }

      // Only allow access to published activities for public users
      if (activity.status !== 'published') {
        return res.status(404).json({ code: 'A002', message: '活动不存在' });
      }

      // Check coverage (simplified - would need real IP geolocation in production)
      const coverage = {
        canParticipate: true, // Default to true for MVP
        cities: ['曼谷', '清迈', '普吉'], // Mock cities
      };

      res.json({ 
        code: 0, 
        message: 'OK', 
        data: { ...activity, coverage } 
      });
    } catch (error) {
      res.status(500).json({ code: 'S002', message: (error as Error).message });
    }
  });

  // Get nearby stores
  app.get('/api/activities/:id/stores-nearby', async (req, res) => {
    try {
      const { id } = req.params;
      const { lat, lng, limit } = req.query;
      
      const stores = await storage.getActivityStores(
        id,
        lat ? parseFloat(lat as string) : undefined,
        lng ? parseFloat(lng as string) : undefined,
        limit ? parseInt(limit as string) : 3
      );

      res.json({ code: 0, message: 'OK', data: stores });
    } catch (error) {
      res.status(500).json({ code: 'S003', message: (error as Error).message });
    }
  });

  // User API endpoints
  app.get('/api/users/:userId/coupons', async (req, res) => {
    try {
      const { userId } = req.params;
      let user = await storage.getUserByLineId(userId);
      if (!user) {
        return res.json({ code: 0, message: 'OK', data: [] });
      }
      
      const coupons = await storage.getCoupons({ userId: user.id });
      res.json({ code: 0, message: 'OK', data: coupons });
    } catch (error) {
      res.status(500).json({ code: 'S018', message: (error as Error).message });
    }
  });

  // Mark coupons as read when user visits profile page
  app.post('/api/users/:userId/coupons/mark-read', async (req, res) => {
    try {
      const { userId } = req.params;
      let user = await storage.getUserByLineId(userId);
      if (!user) {
        return res.status(404).json({ code: 'U001', message: '用户不存在' });
      }
      
      const result = await storage.markUserCouponsAsRead(user.id);
      res.json({ code: 0, message: 'OK', data: { updated: result } });
    } catch (error) {
      res.status(500).json({ code: 'S020', message: (error as Error).message });
    }
  });

  app.get('/api/users/:userId/redeems', async (req, res) => {
    try {
      const { userId } = req.params;
      let user = await storage.getUserByLineId(userId);
      if (!user) {
        return res.json({ code: 0, message: 'OK', data: [] });
      }
      
      const redeems = await storage.getUserRedeems(user.id);
      res.json({ code: 0, message: 'OK', data: redeems });
    } catch (error) {
      res.status(500).json({ code: 'S019', message: (error as Error).message });
    }
  });

  // Claim coupon
  app.post('/api/coupons', async (req, res) => {
    try {
      const { activityId, userId } = req.body;
      
      if (!activityId || !userId) {
        return res.status(400).json({ code: 'A006', message: '活动ID和用户ID不能为空' });
      }

      // Check if user exists, create if not
      let user = await storage.getUserByLineId(userId);
      if (!user) {
        user = await storage.createUser({
          lineUserId: userId,
          username: `user_${userId.slice(-8)}`,
          role: 'user'
        });
      }

      // Get activity to determine coupon validity
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ code: 'A005', message: '活动不存在' });
      }

      const coupon = await storage.createCoupon({ 
        activityId, 
        userId: user.id,
        code: '', // Will be generated by storage
        status: 'active',
        expiresAt: new Date(activity.endAt) // Use activity's end date
      });
      
      // 发送券码领取成功通知
      try {
        if (user.lineUserId && activity) {
          const { lineMessagingService } = await import('./services/line-messaging');
          await lineMessagingService.sendCouponClaimedNotification(user.lineUserId, activity.title, coupon.code);
        }
      } catch (notificationError) {
        console.error('发送券码领取通知失败:', notificationError);
        // 不影响券码领取主流程
      }

      res.json({ 
        code: 0, 
        message: '您领取到的卡券已经收藏在您个人中心"我的"收藏夹里，请在规定时间内及时使用！', 
        data: coupon 
      });
    } catch (error) {
      res.status(500).json({ code: 'S004', message: (error as Error).message });
    }
  });

  // LINE QR Code Redemption API (常态化扫码核销)
  // 店员使用LINE原生扫码功能扫描二维码后，LINE自动调用此API进行核销
  app.get('/api/redeem/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const { staff_line_id: staffLineId, store_id: storeId } = req.query;

      if (!staffLineId || !storeId) {
        return res.status(400).json({
          code: 'Q001',
          message: '缺少必要参数：员工ID或门店ID'
        });
      }

      // 验证店员身份和权限
      const staff = await storage.getUserByLineId(staffLineId as string);
      if (!staff || staff.role !== 'staff') {
        return res.status(403).json({
          code: 'Q002',
          message: '未授权的员工账号，请联系管理员'
        });
      }

      // 检查门店权限
      const isAuthorized = await storage.isStaffAuthorizedForStore(staff.id, storeId as string);
      if (!isAuthorized) {
        return res.status(403).json({
          code: 'Q003',
          message: '您无权在此门店进行核销操作'
        });
      }

      // 核销券码
      const coupon = await storage.getCouponByCode(code);
      if (!coupon) {
        return res.status(404).json({
          code: 'Q004',
          message: '券码不存在或已失效'
        });
      }

      if (coupon.status !== 'active') {
        return res.status(400).json({
          code: 'Q005',
          message: '券码已使用或已过期'
        });
      }

      // 创建核销记录
      const redeem = await storage.createRedeem({
        activityId: coupon.activityId,
        storeId: storeId as string,
        staffId: staff.id,
        couponId: coupon.id,
        code,
        status: 'verified',
        redemptionType: 'qr_scan', // 标记为扫码核销
      });

      // 更新券码状态
      await storage.updateCouponStatus(coupon.id, 'used');

      // 发送核销成功通知
      try {
        const user = await storage.getUser(coupon.userId || '');
        const activity = await storage.getActivity(coupon.activityId || '');
        const store = await storage.getStore(storeId as string);
        
        if (user?.lineUserId && activity && store) {
          const { lineMessagingService } = await import('./services/line-messaging');
          await lineMessagingService.sendRedemptionSuccessNotification(user.lineUserId, activity, store);
        }
      } catch (notificationError) {
        console.error('发送核销成功通知失败:', notificationError);
        // 不影响核销主流程
      }

      // 返回成功页面或消息
      res.json({
        code: 0,
        message: '扫码核销成功！',
        data: {
          redeem,
          activity: await storage.getActivity(coupon.activityId || ''),
          store: await storage.getStore(storeId as string)
        }
      });
    } catch (error) {
      res.status(500).json({
        code: 'S020',
        message: (error as Error).message
      });
    }
  });

  // Manual Verification (手动核销 - 兜底方案)
  app.post('/api/verify', async (req, res) => {
    try {
      const { code, activityId, storeId, staffId, lineUserId } = req.body;
      
      // Check if staff is authorized (has valid LINE ID and is registered)
      const staff = await storage.getUserByLineId(lineUserId);
      if (!staff || staff.role !== 'staff') {
        return res.status(403).json({ 
          code: 'A007', 
          message: '您未经品牌授权，无法核销！' 
        });
      }

      // Check if staff is assigned to the store
      const isAuthorized = await storage.isStaffAuthorizedForStore(staff.id, storeId);
      if (!isAuthorized) {
        return res.status(403).json({ 
          code: 'A008', 
          message: '您无权在此门店进行核销操作！' 
        });
      }
      
      const coupon = await storage.getCouponByCode(code);
      if (!coupon) {
        return res.status(404).json({ code: 'A003', message: '券码不存在或已失效' });
      }

      if (coupon.status !== 'active') {
        return res.status(400).json({ code: 'A004', message: '券码已使用或已过期' });
      }

      // Create redeem record
      const redeem = await storage.createRedeem({
        activityId: coupon.activityId,
        storeId,
        staffId: staff.id,
        couponId: coupon.id,
        code,
        status: 'verified',
        redemptionType: 'manual', // 标记为手动核销(兜底方案)
      });

      // Update coupon status
      await storage.updateCouponStatus(coupon.id, 'used');

      res.json({ 
        code: 0, 
        message: '手动核销成功！券码已使用。', 
        data: redeem 
      });
    } catch (error) {
      res.status(500).json({ code: 'S005', message: (error as Error).message });
    }
  });

  // 团购相关API
  // 创建团购实例
  app.post('/api/group-buying/create-instance', async (req, res) => {
    try {
      const { activityId, userId } = req.body;
      
      if (!activityId || !userId) {
        return res.status(400).json({ code: 'G001', message: '活动ID和用户ID不能为空' });
      }

      // 验证活动存在且为团购类型
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ code: 'G002', message: '活动不存在' });
      }
      
      if (activity.type !== 'group') {
        return res.status(400).json({ code: 'G003', message: '该活动不是团购类型' });
      }

      // 检查用户是否存在，不存在则创建
      let user = await storage.getUserByLineId(userId);
      if (!user) {
        user = await storage.createUser({
          lineUserId: userId,
          username: `user_${userId.slice(-8)}`,
          role: 'user'
        });
      }

      // 获取团购配置
      const groupConfig = await storage.getGroupActivity(activityId);
      if (!groupConfig) {
        return res.status(400).json({ code: 'G004', message: '团购配置不存在' });
      }

      // 创建团购实例
      const instance = await storage.createGroupInstance({
        activityId,
        leaderUser: user.id,
        status: 'pending',
        expireAt: new Date(Date.now() + groupConfig.timeLimitHours * 60 * 60 * 1000)
      });

      res.json({ 
        code: 0, 
        message: '团购创建成功！', 
        data: instance 
      });
    } catch (error) {
      console.error('创建团购实例失败:', error);
      res.status(500).json({ code: 'G005', message: (error as Error).message });
    }
  });

  // Translation API
  app.post('/api/i18n/translate/ui', async (req, res) => {
    try {
      const { text, from, to } = req.body;
      const { alibabaTranslationService } = await import('./services/alibaba-translation');
      const translated = await alibabaTranslationService.translateUI(text, from, to);
      res.json({ code: 0, message: 'OK', data: { translated } });
    } catch (error) {
      res.status(500).json({ code: 'S006', message: (error as Error).message });
    }
  });

  app.post('/api/i18n/translate/content', async (req, res) => {
    try {
      const { text, from, to } = req.body;
      const { alibabaTranslationService } = await import('./services/alibaba-translation');
      const translated = await alibabaTranslationService.translateContent(text || '', from || 'zh', to || 'th');
      res.json({ code: 0, message: 'OK', data: { translated } });
    } catch (error) {
      res.status(500).json({ code: 'S007', message: (error as Error).message });
    }
  });

  // 智能翻译接口
  app.post('/api/i18n/smart-translate', async (req, res) => {
    try {
      const { text, key, type, sourceLanguage } = req.body;
      // 暂时返回原文，智能翻译功能需要完善
      const result = { translated: text, stored: false };
      res.json({ code: 0, message: 'OK', data: result });
    } catch (error) {
      res.status(500).json({ code: 'S008', message: (error as Error).message });
    }
  });

  // 获取翻译文本接口
  app.get('/api/i18n/translation/:key/:lang/:type', async (req, res) => {
    try {
      const { key, lang, type } = req.params;
      const alibabaModule = await import('./services/alibaba-translation');
      const translation = await alibabaModule.alibabaTranslationService.getTranslation(key, lang as 'zh' | 'th', type as 'ui' | 'content');
      res.json({ code: 0, message: 'OK', data: { translation } });
    } catch (error) {
      res.status(500).json({ code: 'S009', message: (error as Error).message });
    }
  });

  // 获取指定语言的所有翻译
  app.get('/api/i18n/translations/:lang', async (req, res) => {
    try {
      const { lang } = req.params;
      const { storage } = await import('./storage');
      const translations = await storage.getTranslations(lang);
      
      // 将翻译数组转换为键值对对象
      const result: Record<string, string> = {};
      translations.forEach(item => {
        if (item.key && item.value) {
          result[item.key] = item.value;
        }
      });
      
      const translationData = result;
      res.json({ code: 0, message: 'OK', data: translationData });
    } catch (error) {
      res.status(500).json({ code: 'S010', message: (error as Error).message });
    }
  });

  // 初始化UI翻译数据
  app.post('/api/i18n/init', async (req, res) => {
    try {
      const { i18nInitService } = await import('./services/i18n-init');
      const result = await i18nInitService.initializeUITranslations();
      res.json({ code: 0, message: 'OK', data: result });
    } catch (error) {
      res.status(500).json({ code: 'S011', message: (error as Error).message });
    }
  });

  // Object Storage Routes
  app.get('/public-objects/:filePath(*)', async (req, res) => {
    const filePath = req.params.filePath;
    const { ObjectStorageService } = await import('./objectStorage');
    try {
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Legacy /objects/ path redirect to /public-objects/
  app.get('/objects/:filePath(*)', async (req, res) => {
    const filePath = req.params.filePath;
    console.log(`Serving /objects/${filePath} from public storage`);
    
    const { ObjectStorageService } = await import('./objectStorage');
    try {
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        console.log(`File not found in public storage: ${filePath}`);
        return res.status(404).json({ error: "File not found" });
      }
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Proxy upload route to bypass CORS
  app.post('/api/upload/proxy', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ code: 'E001', message: 'file is required' });
      }

      const { originalname, mimetype, buffer } = req.file;
      const timestamp = Date.now();
      const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `public/activities/${timestamp}_${safeName}`;
      
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicUploadURL(`activities/${timestamp}_${safeName}`);
      
      console.log('🔄 Proxy uploading via server to:', uploadURL.substring(0, 100) + '...');
      
      // Server-side upload to GCS
      const putRes = await fetch(uploadURL, { 
        method: 'PUT', 
        headers: { 'Content-Type': mimetype }, 
        body: buffer 
      });
      
      if (!putRes.ok) {
        const errorText = await putRes.text().catch(() => 'Unknown error');
        console.error('❌ Server-side PUT failed:', putRes.status, errorText);
        return res.status(500).json({ code: 'E002', message: `upload failed: ${putRes.status} ${errorText}` });
      }

      const fileOnly = `${timestamp}_${safeName}`;
      const publicUrl = `/objects/activities/${fileOnly}`;
      
      console.log('✅ Proxy upload successful, public URL:', publicUrl);
      
      res.json({ 
        code: 0, 
        message: 'OK', 
        data: { publicUrl } 
      });
    } catch (error) {
      console.error('Proxy upload error:', error);
      res.status(500).json({ code: 'S011', message: (error as Error).message });
    }
  });

  app.post('/api/upload/image', async (req, res) => {
    try {
      const { fileName, filename, contentType } = req.body;
      const finalFileName = filename || fileName;
      if (!finalFileName) {
        return res.status(400).json({ code: 'E001', message: 'filename is required' });
      }

      // Generate safe filename  
      const timestamp = Date.now();
      const safeName = finalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `public/activities/${timestamp}_${safeName}`;
      
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicUploadURL(`activities/${timestamp}_${safeName}`);
      
      // Generate public URL for frontend to use (对外访问走 /objects/activities/<file>)
      const fileOnly = `${timestamp}_${safeName}`;
      const publicUrl = `/objects/activities/${fileOnly}`;
      
      console.log('Generated upload info:', {
        key,
        uploadURL: uploadURL.substring(0, 100) + '...',
        publicUrl
      });
      
      res.json({ 
        code: 0, 
        message: 'OK', 
        data: { 
          uploadURL,
          publicUrl,
          key,
          requiredHeaders: { 
            'Content-Type': contentType || 'application/octet-stream'
          }
        } 
      });
    } catch (error) {
      console.error('Get upload URL error:', error);
      res.status(500).json({ code: 'S010', message: (error as Error).message });
    }
  });



  // Get admin profile (with auth)
  app.get('/admin/api/profile', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ 
          code: 'AUTH003', 
          message: '未登录' 
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          code: 'AUTH004', 
          message: '用户不存在' 
        });
      }
      
      res.json({ 
        code: 0, 
        message: 'OK', 
        data: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ 
        code: 'S997', 
        message: (error as Error).message 
      });
    }
  });

  // Admin API Routes

  // Cities management
  app.get('/admin/api/cities', async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json({ code: 0, message: 'OK', data: cities });
    } catch (error) {
      res.status(500).json({ code: 'S015', message: (error as Error).message });
    }
  });

  // Activities management - 重复的路由已删除，使用上面的版本

  app.put('/admin/api/activities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertActivitySchema.partial().parse(req.body);
      
      // 智能多语言处理 - 更新时检测语言并自动翻译
      if (validatedData.title) {
        const isThaiInput = /[\u0E00-\u0E7F]/.test(validatedData.title);
        if (isThaiInput) {
          try {
            validatedData.titleTh = validatedData.title;
            validatedData.title = await alibabaTranslationService.translateContent(validatedData.title, 'th', 'zh');
          } catch (error) {
            console.error('Thai to Chinese translation failed during update:', error);
            validatedData.title = validatedData.titleTh = validatedData.title;
          }
        } else {
          try {
            validatedData.titleTh = await alibabaTranslationService.translateContent(validatedData.title, 'zh', 'th');
          } catch (error) {
            console.error('Chinese to Thai translation failed during update:', error);
            validatedData.titleTh = validatedData.title;
          }
        }
      }
      
      if (validatedData.rules) {
        const isThaiInput = /[\u0E00-\u0E7F]/.test(validatedData.rules);
        if (isThaiInput) {
          try {
            validatedData.rulesTh = validatedData.rules;
            validatedData.rules = await alibabaTranslationService.translateContent(validatedData.rules, 'th', 'zh');
          } catch (error) {
            console.error('Thai to Chinese rules translation failed during update:', error);
            validatedData.rules = validatedData.rulesTh = validatedData.rules;
          }
        } else {
          try {
            validatedData.rulesTh = await alibabaTranslationService.translateContent(validatedData.rules, 'zh', 'th');
          } catch (error) {
            console.error('Chinese to Thai rules translation failed during update:', error);
            validatedData.rulesTh = validatedData.rules;
          }
        }
      }
      
      // 计算折扣（如果有原价和现价）
      if (validatedData.listPrice && validatedData.price) {
        const price = parseFloat(validatedData.price);
        const listPrice = parseFloat(validatedData.listPrice);
        if (listPrice > 0) {
          validatedData.discount = ((price / listPrice) * 10).toFixed(1);
          console.log(`💰 Updated discount: ${validatedData.discount}折 (${price}/${listPrice})`);
        }
      }
      
      const activity = await storage.updateActivity(id, validatedData);
      
      if (!activity) {
        return res.status(404).json({ code: 'A006', message: '活动不存在' });
      }

      res.json({ code: 0, message: 'OK', data: activity });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ code: 'A007', message: '请修正高亮项后再提交', data: error.errors });
      }
      res.status(500).json({ code: 'S010', message: (error as Error).message });
    }
  });

  app.delete('/admin/api/activities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteActivity(id);
      
      if (!success) {
        return res.status(404).json({ code: 'A008', message: '活动不存在' });
      }

      res.json({ code: 0, message: 'OK' });
    } catch (error) {
      res.status(500).json({ code: 'S011', message: (error as Error).message });
    }
  });

  // Stores management
  app.get('/admin/api/stores', async (req, res) => {
    try {
      const { cityId, search } = req.query;
      const stores = await storage.getStores({
        cityId: cityId ? parseInt(cityId as string) : undefined,
        search: search as string,
      });

      res.json({ code: 0, message: 'OK', data: stores });
    } catch (error) {
      res.status(500).json({ code: 'S012', message: (error as Error).message });
    }
  });

  app.post('/admin/api/stores', async (req, res) => {
    try {
      const validatedData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(validatedData);
      res.json({ code: 0, message: 'OK', data: store });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ code: 'A009', message: '请修正表单数据', data: error.errors });
      }
      res.status(500).json({ code: 'S013', message: (error as Error).message });
    }
  });

  app.get('/admin/api/stores/:id/staff', async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.getStoreStaff(id);
      res.json({ code: 0, message: 'OK', data: staff });
    } catch (error) {
      res.status(500).json({ code: 'S014', message: (error as Error).message });
    }
  });

  // Redeems management
  app.get('/admin/api/redeems', async (req, res) => {
    try {
      const { storeId, staffId, activityId, status, from, to } = req.query;
      const redeems = await storage.getRedeems({
        storeId: storeId as string,
        staffId: staffId as string,
        activityId: activityId as string,
        status: status as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      });

      res.json({ code: 0, message: 'OK', data: redeems });
    } catch (error) {
      res.status(500).json({ code: 'S015', message: (error as Error).message });
    }
  });

  app.post('/admin/api/redeems/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ code: 'A010', message: '撤销原因不能为空' });
      }

      const success = await storage.cancelRedeem(id, reason);
      
      if (!success) {
        return res.status(404).json({ code: 'A011', message: '核销记录不存在' });
      }

      res.json({ code: 0, message: 'OK' });
    } catch (error) {
      res.status(500).json({ code: 'S016', message: (error as Error).message });
    }
  });

  // Cities API
  app.get('/api/cities', async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json({ code: 0, message: 'OK', data: cities });
    } catch (error) {
      res.status(500).json({ code: 'S017', message: (error as Error).message });
    }
  });

  // Mock payment endpoints
  app.post('/api/payment/create', async (req, res) => {
    try {
      const { activityId, userId, amount } = req.body;
      
      const order = await storage.createPaymentOrder({
        activityId,
        userId,
        amount,
        provider: 'mock',
        status: 'pending',
        paymentUrl: `mock://pay/${Date.now()}`,
      });

      res.json({ 
        code: 0, 
        message: 'OK', 
        data: { paymentUrl: order.paymentUrl }
      });
    } catch (error) {
      res.status(500).json({ code: 'S018', message: (error as Error).message });
    }
  });

  app.post('/api/payment/callback/mock', async (req, res) => {
    try {
      const { orderId } = req.body;
      await storage.updatePaymentOrderStatus(orderId, 'paid');
      res.json({ code: 0, message: 'OK' });
    } catch (error) {
      res.status(500).json({ code: 'S019', message: (error as Error).message });
    }
  });

  // LINE Messaging API Routes
  
  // LINE Webhook接收端点
  app.post('/api/line/webhook', async (req, res) => {
    try {
      const signature = req.headers['x-line-signature'] as string;
      const body = JSON.stringify(req.body);
      
      // 验证LINE Webhook签名
      const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
      if (channelSecret && signature) {
        const { LineMessagingService } = await import('./services/line-messaging');
        const isValidSignature = LineMessagingService.verifySignature(body, signature, channelSecret);
        if (!isValidSignature) {
          console.error('LINE Webhook签名验证失败');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const { lineMessagingService } = await import('./services/line-messaging');
      await lineMessagingService.handleWebhook(req.body.events || []);
      
      res.json({ success: true });
    } catch (error) {
      console.error('LINE Webhook处理失败:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // 手动发送推送消息（管理员功能）
  app.post('/admin/api/line/push-message', async (req, res) => {
    try {
      const { userIds, message, type } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ code: 'L001', message: '用户ID列表不能为空' });
      }

      const { lineMessagingService } = await import('./services/line-messaging');
      const result = await lineMessagingService.broadcastMessage(userIds, message);
      
      res.json({
        code: 0,
        message: '推送消息发送完成',
        data: result
      });
    } catch (error) {
      res.status(500).json({ code: 'L002', message: (error as Error).message });
    }
  });

  // 发送活动推广消息
  app.post('/admin/api/activities/:activityId/promote', async (req, res) => {
    try {
      const { activityId } = req.params;
      const { targetUserIds } = req.body;
      
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ code: 'L003', message: '活动不存在' });
      }

      const { lineMessagingService } = await import('./services/line-messaging');
      
      let userIds = targetUserIds;
      if (!userIds || userIds.length === 0) {
        // 如果没有指定用户，获取所有已绑定LINE的用户
        const users = await storage.getAllUsers();
        userIds = users.filter((user: any) => user.lineUserId).map((user: any) => user.lineUserId);
      }

      let successCount = 0;
      let failedCount = 0;

      for (const userId of userIds) {
        const success = await lineMessagingService.sendActivityPromotion(userId, activity);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      res.json({
        code: 0,
        message: '活动推广消息发送完成',
        data: {
          total: userIds.length,
          success: successCount,
          failed: failedCount
        }
      });
    } catch (error) {
      res.status(500).json({ code: 'L004', message: (error as Error).message });
    }
  });

  // Admin: Get redemption statistics - 数据归集API
  app.get('/api/admin/redemption-stats', async (req, res) => {
    try {
      // In production, add admin authentication check here
      const { startDate, endDate, activityId, storeId, staffId } = req.query;
      
      const stats = await storage.getRedemptionStats({
        startDate: startDate as string,
        endDate: endDate as string,
        activityId: activityId as string,
        storeId: storeId as string,
        staffId: staffId as string,
      });
      
      res.json({ 
        code: 0, 
        message: 'OK', 
        data: stats 
      });
    } catch (error) {
      console.error('Get redemption stats error:', error);
      res.status(500).json({ 
        code: 'S008', 
        message: (error as Error).message 
      });
    }
  });

  // Export activity commission data endpoint
  app.get('/admin/api/export-activity/:activityId', async (req, res) => {
    try {
      const { activityId } = req.params;
      const exportData = await storage.exportActivityCommissionData(activityId);
      
      // 构建CSV内容
      let csvContent = `活动名称,${exportData.activityTitle}\n`;
      if (exportData.activityTitleTh) {
        csvContent += `泰语标题,${exportData.activityTitleTh}\n`;
      }
      csvContent += '\n城市,门店名称,核销总数,导购姓名,LINE ID,核销数量\n';
      
      exportData.exportData.forEach(store => {
        if (store.staffDetails.length === 0) {
          // 如果没有导购员，显示门店信息
          csvContent += `${store.cityName},${store.storeName},${store.totalRedemptions},无导购员,,0\n`;
        } else {
          store.staffDetails.forEach((staff, index) => {
            if (index === 0) {
              // 第一行显示完整门店信息
              csvContent += `${store.cityName},${store.storeName},${store.totalRedemptions},${staff.staffName},${staff.lineId},${staff.redemptionCount}\n`;
            } else {
              // 后续行只显示导购信息
              csvContent += `,,,${staff.staffName},${staff.lineId},${staff.redemptionCount}\n`;
            }
          });
        }
      });

      // 设置下载头部
      const fileName = `${exportData.activityTitle}_提成核算数据_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      
      // 添加BOM以支持Excel正确显示中文
      res.write('\uFEFF');
      res.write(csvContent);
      res.end();
    } catch (error) {
      console.error('Error exporting activity data:', error);
      res.status(500).json({ code: 'EXPORT001', message: '导出数据失败' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for CSV generation
function generateActivitiesCSV(activities: any[]): string {
  const headers = ['ID', '名称', '类型', '状态', '城市', '创建时间', '更新时间'];
  const rows = activities.map(activity => [
    activity.id,
    activity.name,
    activity.type,
    activity.status,
    activity.cityName || '',
    activity.createdAt || '',
    activity.updatedAt || ''
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function generateRedeemsCSV(redeems: any[]): string {
  const headers = ['ID', '活动名称', '门店名称', '员工姓名', '核销时间', '状态', '金额'];
  const rows = redeems.map(redeem => [
    redeem.id,
    redeem.activityName || '',
    redeem.storeName || '',
    redeem.staffName || '',
    redeem.redeemedAt || '',
    redeem.status || '',
    redeem.amount || ''
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}
