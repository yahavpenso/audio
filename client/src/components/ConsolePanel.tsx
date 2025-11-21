import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConsoleLog {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  details?: string;
}

interface ConsolePanelProps {
  isOpen?: boolean;
}

export default function ConsolePanel({ isOpen: initialOpen = true }: ConsolePanelProps) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isOpen, setIsOpen] = useState(initialOpen);

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (level: "info" | "success" | "warning" | "error", message: string, details?: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level,
          message,
          details,
        },
        ...prev.slice(0, 99), // Keep last 100 logs
      ]);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog("info", args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog("error", args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog("warning", args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };

    // Custom success log
    (window as any).logSuccess = (message: string, details?: string) => {
      addLog("success", message, details);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-blue-400";
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case "success":
        return "bg-green-500/10";
      case "error":
        return "bg-red-500/10";
      case "warning":
        return "bg-yellow-500/10";
      default:
        return "bg-blue-500/10";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/50 border-b border-border/50 cursor-pointer hover:bg-card transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Console</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            {logs.length} logs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setLogs([]);
            }}
            className="h-6 px-2 text-xs"
            data-testid="button-clear-console"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "" : "rotate-180"}`} />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-h-48 overflow-hidden border-t border-border/50"
          >
            <ScrollArea className="h-48 w-full bg-background/50">
              <div className="p-3 space-y-1 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-4">No logs yet</div>
                ) : (
                  logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-2 p-1.5 rounded ${getLevelBg(log.level)}`}
                    >
                      <span className={`${getLevelColor(log.level)} font-bold w-4 text-center flex-shrink-0`}>
                        {getLevelIcon(log.level)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`${getLevelColor(log.level)} break-words`}>{log.message}</div>
                        {log.details && <div className="text-muted-foreground text-xs mt-1">{log.details}</div>}
                      </div>
                      <span className="text-muted-foreground flex-shrink-0">{log.timestamp}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
