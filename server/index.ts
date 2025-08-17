import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
// 安全中间件导入
import {
  securityHeaders,
  corsMiddleware,
  inputSanitization,
  suspiciousActivityMonitor,
  securityLogger,
  sensitiveDataDetection,
  apiRateLimit
} from "./middleware/security";

const app = express();

// 首先应用安全中间件
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(securityLogger);
app.use(suspiciousActivityMonitor);

app.use(express.json({ limit: '10mb' })); // 限制请求体大小
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// 输入验证和敏感数据检测
app.use(inputSanitization);
app.use(sensitiveDataDetection);

// API频率限制
app.use('/api', apiRateLimit);

// Session configuration with enhanced security
app.use(session({
  secret: process.env.SESSION_SECRET || 'H5-marketing-admin-secret-key-2024-v2',
  name: 'h5-session', // 自定义session名称，增加安全性
  resave: false,
  saveUninitialized: false, // 不保存未初始化的session，增加安全性
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // 生产环境强制HTTPS
    httpOnly: true, // 防止XSS攻击
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    sameSite: 'strict' // 防护CSRF攻击
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Standalone database verification - completely migration-free
  console.log("🔄 Verifying standalone database connection...");
  try {
    const { verifyConnection } = await import("./db-standalone");
    const isConnected = await verifyConnection();
    if (isConnected) {
      console.log("✅ Standalone database ready");
    } else {
      console.log("⚠️ Database connection warning - continuing anyway");
    }
  } catch (error) {
    console.error("⚠️ Database warning:", error);
    console.log("🔄 Application starting with limited database functionality");
  }

  // CRITICAL: Handle admin routes BEFORE other routes to prevent Vite catch-all interference
  const path = await import("path");
  
  // Remove all admin route handling - let Vite handle everything normally

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 in development.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
