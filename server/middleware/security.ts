/**
 * H5营销系统安全中间件
 * 防护: 暴力破解、SQL注入、XSS、CSRF、DOS攻击等
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// IP访问频率追踪
const ipRequests = new Map<string, { count: number; resetTime: number }>();
const suspiciousIPs = new Set<string>();

/**
 * 获取客户端真实IP
 */
function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  )?.split(',')[0]?.trim() || 'unknown';
}

/**
 * API访问频率限制 - 防护DOS攻击
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 每15分钟最多200次请求
  message: {
    code: 'RATE_LIMIT',
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  skip: (req) => {
    // 跳过静态资源
    return req.path.startsWith('/objects/') || 
           req.path.startsWith('/assets/') ||
           req.path.endsWith('.js') ||
           req.path.endsWith('.css');
  }
});

/**
 * 登录接口严格限制 - 防护暴力破解
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每15分钟最多5次登录尝试
  message: {
    code: 'LOGIN_RATE_LIMIT',
    message: '登录尝试过于频繁，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIP,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

/**
 * 管理员操作限制
 */
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 100, // 每5分钟最多100次操作
  message: {
    code: 'ADMIN_RATE_LIMIT',
    message: '管理操作过于频繁，请稍后再试'
  },
  keyGenerator: getClientIP,
});

/**
 * 安全请求头设置 - 防护XSS、点击劫持等
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 防止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 启用XSS保护
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 强制HTTPS（生产环境）
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // 内容安全策略 - 防止XSS
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.line-scdn.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: http:",
    "connect-src 'self' https://api.qrserver.com https://api.line.me wss:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '));
  
  // 控制referrer信息泄露
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * 输入验证和清理 - 防护SQL注入和XSS
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  const suspicious_patterns = [
    // SQL注入模式
    /(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from)/i,
    /(or\s+1\s*=\s*1|and\s+1\s*=\s*1|'\s+or\s+'1'\s*=\s*'1)/i,
    /(exec\s*\(|eval\s*\(|script\s*>|javascript\s*:)/i,
    // XSS模式
    /(<script[^>]*>.*?<\/script>|<iframe[^>]*>|<object[^>]*>)/i,
    /(on\w+\s*=|javascript\s*:|vbscript\s*:)/i,
    // 命令注入模式
    /(;\s*rm\s+-rf|;\s*cat\s+\/etc\/passwd|;\s*wget\s+|;\s*curl\s+)/i,
  ];

  const checkValue = (value: any, path: string): boolean => {
    if (typeof value === 'string') {
      for (const pattern of suspicious_patterns) {
        if (pattern.test(value)) {
          console.warn(`🚨 Suspicious input detected in ${path}: ${value.substring(0, 100)}`);
          return true;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (checkValue(val, `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  // 检查请求体
  if (req.body && checkValue(req.body, 'body')) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: '输入包含非法字符，请检查后重试'
    });
  }

  // 检查查询参数
  if (req.query && checkValue(req.query, 'query')) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: '查询参数包含非法字符'
    });
  }

  next();
};

/**
 * 异常IP监控 - 防护自动化攻击
 */
export const suspiciousActivityMonitor = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIP(req);
  const now = Date.now();
  const windowSize = 60 * 1000; // 1分钟窗口

  // 开发环境跳过IP监控
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // 跳过已知的可疑IP
  if (suspiciousIPs.has(ip)) {
    return res.status(429).json({
      code: 'BLOCKED_IP',
      message: '您的IP已被暂时封禁'
    });
  }

  // 获取或初始化IP记录
  let record = ipRequests.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowSize };
    ipRequests.set(ip, record);
  }

  record.count++;

  // 检测异常活动模式 - 开发环境放宽限制
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isAbnormal = !isDevelopment && (
    record.count > 100 || // 1分钟内超过100次请求
    (req.headers['user-agent']?.toLowerCase().includes('bot') && record.count > 20) || // 爬虫
    (!req.headers['user-agent'] && record.count > 10) // 无User-Agent
  );

  if (isAbnormal) {
    console.warn(`🚨 Suspicious activity detected from IP: ${ip}, requests: ${record.count}`);
    suspiciousIPs.add(ip);
    
    // 5分钟后解封
    setTimeout(() => {
      suspiciousIPs.delete(ip);
      ipRequests.delete(ip);
    }, 5 * 60 * 1000);

    return res.status(429).json({
      code: 'SUSPICIOUS_ACTIVITY',
      message: '检测到异常活动，IP已被暂时封禁'
    });
  }

  next();
};

/**
 * 管理员权限验证增强 - 防护权限提升攻击
 */
export const enhancedAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  
  // 基本权限检查
  if (!session?.userId || !session?.role || session.role !== 'admin') {
    return res.status(403).json({
      code: 'UNAUTHORIZED',
      message: '需要管理员权限'
    });
  }

  // 会话安全检查
  const now = Date.now();
  if (!session.lastActivity || (now - session.lastActivity) > 24 * 60 * 60 * 1000) {
    req.session?.destroy(() => {});
    return res.status(401).json({
      code: 'SESSION_EXPIRED',
      message: '会话已过期，请重新登录'
    });
  }

  // 更新最后活动时间
  session.lastActivity = now;

  // IP一致性检查（可选，较严格）
  if (session.clientIP && session.clientIP !== getClientIP(req)) {
    console.warn(`🚨 Admin session IP changed: ${session.clientIP} -> ${getClientIP(req)}`);
    // 在生产环境中可能需要强制重新登录
  }

  next();
};

/**
 * API密钥泄露检测
 */
export const sensitiveDataDetection = (req: Request, res: Response, next: NextFunction) => {
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{48}/, // OpenAI API key
    /xoxb-[0-9]{11,12}-[0-9]{11,12}-[a-zA-Z0-9]{24}/, // Slack bot token
    /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access token
    /AIza[0-9A-Za-z\\-_]{35}/, // Google API key
  ];

  const checkForSensitiveData = (obj: any, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(obj)) {
          console.error(`🚨 SECURITY ALERT: Potential API key detected in ${path}`);
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForSensitiveData(value, `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  if (req.body && checkForSensitiveData(req.body, 'request_body')) {
    console.error(`🚨 CRITICAL: API key detected in request from IP: ${getClientIP(req)}`);
  }

  next();
};

/**
 * CORS配置 - 防护跨域攻击
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'https://*.replit.app',
    'https://*.repl.co'
  ];

  // 检查Origin是否被允许
  const isAllowed = !origin || allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*');
      return new RegExp(pattern).test(origin);
    }
    return allowed === origin;
  });

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * 安全日志记录
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = new Date().toISOString();

  // 记录敏感操作（生产环境）
  if (process.env.NODE_ENV === 'production' && 
      (req.path.includes('admin') || req.path.includes('login') || req.path.includes('delete'))) {
    console.log(`🔒 Security Log [${timestamp}] IP: ${ip} | ${req.method} ${req.path} | UA: ${userAgent.substring(0, 100)}`);
  }

  next();
};