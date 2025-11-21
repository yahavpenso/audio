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
          timestamp: new Date().toISOString()
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
}

// Setup console logging before rendering
setupConsoleLogging();

createRoot(document.getElementById("root")!).render(<App />);
