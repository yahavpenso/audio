import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fileUploadResponseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload-audio", async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const result = await storage.uploadAudioFile(file.buffer, file.originalname);
      
      res.json(fileUploadResponseSchema.parse(result));
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // File download endpoint
  app.get("/api/audio/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const buffer = await storage.downloadAudioFile(fileId);
      
      res.set("Content-Type", "audio/wav");
      res.set("Content-Length", buffer.length);
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
