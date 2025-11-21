import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Utility function for formatted timestamps
function getTimestamp(): string {
  return new Date().toISOString();
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Log startup information
log(`[${getTimestamp()}] 🚀 Server startup initiated`);
log(`[${getTimestamp()}] Environment: ${process.env.NODE_ENV || 'development'}`);
log(`[${getTimestamp()}] Node version: ${process.version}`);

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware with detailed request/response info
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log incoming requests
  log(`[${getTimestamp()}] ← ${method} ${path} from ${req.ip}`);

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusIndicator = statusCode >= 200 && statusCode < 300 ? '✓' : 
                           statusCode >= 300 && statusCode < 400 ? '→' :
                           statusCode >= 400 && statusCode < 500 ? '⚠' : '✗';
    
    if (path.startsWith("/api")) {
      let logLine = `[${getTimestamp()}] ${statusIndicator} ${method} ${path} ${statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` | Response: ${responseStr.substring(0, 100)}${responseStr.length > 100 ? '…' : ''}`;
      }

      log(logLine);
    } else if (path === "/" || path.includes(".html")) {
      const sizeIndicator = duration > 100 ? '⏱' : '⚡';
      log(`[${getTimestamp()}] ${sizeIndicator} ${method} ${path} ${statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Error handling middleware with enhanced logging
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  log(`[${getTimestamp()}] ✗ ERROR: ${req.method} ${req.path} - ${status} ${message}`);
  if (err.stack) {
    log(`[${getTimestamp()}] Stack trace: ${err.stack.split('\n').slice(0, 3).join(' | ')}`);
  }

  res.status(status).json({ message });
  throw err;
});

(async () => {
  try {
    log(`[${getTimestamp()}] 📋 Registering routes...`);
    const server = await registerRoutes(app);
    log(`[${getTimestamp()}] ✓ Routes registered successfully`);

    // Setup development or production environment
    if (app.get("env") === "development") {
      log(`[${getTimestamp()}] 🔧 Setting up Vite development server...`);
      await setupVite(app, server);
      log(`[${getTimestamp()}] ✓ Vite development server configured`);
    } else {
      log(`[${getTimestamp()}] 📦 Serving static production build...`);
      serveStatic(app);
      log(`[${getTimestamp()}] ✓ Static file serving configured`);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    const host = "0.0.0.0";

    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      log(`[${getTimestamp()}] ✓ Server listening on ${host}:${port}`);
      log(`[${getTimestamp()}] 📡 Ready to accept connections`);
      log(`[${getTimestamp()}] 🌐 Application available at: http://localhost:${port}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      log(`[${getTimestamp()}] ⚠ SIGTERM received, starting graceful shutdown...`);
      server.close(() => {
        log(`[${getTimestamp()}] ✓ Server closed gracefully`);
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      log(`[${getTimestamp()}] ⚠ SIGINT received, starting graceful shutdown...`);
      server.close(() => {
        log(`[${getTimestamp()}] ✓ Server closed gracefully`);
        process.exit(0);
      });
    });

  } catch (err: any) {
    log(`[${getTimestamp()}] ✗ FATAL ERROR during startup: ${err.message}`);
    log(`[${getTimestamp()}] Stack: ${err.stack}`);
    process.exit(1);
  }
})();
