import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Intercept and relay console logs to server
function setupConsoleLogging() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  async function sendLogToServer(level: string, args: any[]) {
    try {
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

      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          messages,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          memory: (performance as any).memory ? {
            jsHeapSizeLimit: ((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(2) + 'MB',
            totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2) + 'MB',
            usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB'
          } : null
        })
      }).catch(() => {}); // Silently ignore network errors
    } catch {}
  }

  console.log = function (...args: any[]) {
    originalLog.apply(console, args);
    sendLogToServer("log", args);
  };

  console.error = function (...args: any[]) {
    originalError.apply(console, args);
    sendLogToServer("error", args);
  };

  console.warn = function (...args: any[]) {
    originalWarn.apply(console, args);
    sendLogToServer("warn", args);
  };

  console.info = function (...args: any[]) {
    originalInfo.apply(console, args);
    sendLogToServer("info", args);
  };

  // Log page visibility events
  document.addEventListener('visibilitychange', () => {
    const state = document.hidden ? 'hidden' : 'visible';
    console.log(`📱 Page visibility changed: ${state}`);
  });

  // Log performance metrics
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
}

// Setup console logging before rendering
console.log(`[${new Date().toISOString()}] 🔧 Initializing console logging system...`);
setupConsoleLogging();
console.log(`[${new Date().toISOString()}] ✓ Console logging system initialized`);

createRoot(document.getElementById("root")!).render(<App />);
