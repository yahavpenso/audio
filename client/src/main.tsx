import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Batch logging to reduce network overhead
function setupConsoleLogging() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  
  let logQueue: any[] = [];
  let sendTimeout: NodeJS.Timeout | null = null;

  async function flushLogs() {
    if (logQueue.length === 0) return;
    
    try {
      const batch = logQueue.splice(0, logQueue.length);
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        })
      }).catch(() => {});
    } catch {}
  }

  function queueLog(level: string, args: any[]) {
    const messages = args.map(arg => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    });

    logQueue.push({ level, messages, timestamp: new Date().toISOString() });
    
    if (sendTimeout) clearTimeout(sendTimeout);
    sendTimeout = setTimeout(() => flushLogs(), 2000);
  }

  console.log = function (...args: any[]) {
    originalLog.apply(console, args);
    if (!args[0]?.includes?.('resized')) queueLog("log", args);
  };

  console.error = function (...args: any[]) {
    originalError.apply(console, args);
    queueLog("error", args);
  };

  console.warn = function (...args: any[]) {
    originalWarn.apply(console, args);
    queueLog("warn", args);
  };

  console.info = function (...args: any[]) {
    originalInfo.apply(console, args);
    queueLog("info", args);
  };

  // Log page visibility events (throttled)
  let lastVisibilityLog = 0;
  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (now - lastVisibilityLog > 1000) {
      lastVisibilityLog = now;
      const state = document.hidden ? 'hidden' : 'visible';
      console.log(`📱 Page visibility changed: ${state}`);
    }
  });

  // Log performance metrics once
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as any;
    if (perfData) {
      console.log(`⏱ Page Load Metrics:`);
      console.log(`  - DNS: ${perfData.domainLookupEnd - perfData.domainLookupStart}ms`);
      console.log(`  - TCP: ${perfData.connectEnd - perfData.connectStart}ms`);
      console.log(`  - Request: ${perfData.responseStart - perfData.requestStart}ms`);
      console.log(`  - Response: ${perfData.responseEnd - perfData.responseStart}ms`);
      console.log(`  - DOM Parse: ${perfData.domInteractive - perfData.domLoading}ms`);
      console.log(`  - Total: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
    }
  });

  // Log unhandled errors
  window.addEventListener('error', (event) => {
    console.error(`❌ Unhandled error: ${event.error?.message || event.message}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error(`❌ Unhandled promise rejection: ${event.reason}`);
  });

  // Flush on unload
  window.addEventListener('beforeunload', () => flushLogs());
}

// Setup console logging before rendering
console.log(`[${new Date().toISOString()}] 🔧 Initializing console logging system...`);
setupConsoleLogging();
console.log(`[${new Date().toISOString()}] ✓ Console logging system initialized`);

createRoot(document.getElementById("root")!).render(<App />);
