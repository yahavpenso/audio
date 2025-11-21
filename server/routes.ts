import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fileUploadResponseSchema } from "@shared/schema";

function getTimestamp(): string {
  return new Date().toISOString();
}

function log(message: string): void {
  const timestamp = getTimestamp();
  const logMsg = `[${timestamp}] ${message}`;
  console.log(`4:30:34 PM [express] ${logMsg}`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Browser console logs relay endpoint
  app.post("/api/logs", async (req, res) => {
    try {
      const { level = "log", messages = [], timestamp } = req.body;
      
      if (!messages || messages.length === 0) {
        return res.status(400).json({ error: "No messages provided" });
      }

      const clientTime = timestamp ? new Date(timestamp).toISOString() : getTimestamp();
      const message = messages.join(" ");
      const levelIndicator = level === "error" ? "❌" : 
                            level === "warn" ? "⚠️" : 
                            level === "info" ? "ℹ️" : 
                            "🌐";
      
      log(`[CLIENT ${levelIndicator}] ${message}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Logs endpoint error:", error);
      res.status(500).json({ error: "Failed to log" });
    }
  });

  // File upload endpoint (for future use with multer)
  app.post("/api/upload-audio", async (req, res) => {
    try {
      // For now, audio is handled client-side
      // Future: integrate multer for server-side uploads
      return res.status(501).json({ error: "File upload via server coming soon" });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // File download endpoint (for future use)
  app.get("/api/audio/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const buffer = await storage.downloadAudioFile(fileId);
      
      res.set("Content-Type", "audio/wav");
      res.set("Content-Length", String(buffer.length));
      res.send(buffer);
    } catch (error) {
      console.error("Download error:", error);
      res.status(404).json({ error: "File not found" });
    }
  });

  // File delete endpoint
  app.delete("/api/audio/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      await storage.deleteAudioFile(fileId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Delete failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
