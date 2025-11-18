import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Audio editing is handled entirely client-side using Web Audio API
  // No backend API routes needed for MVP
  // Future enhancements could include server-side audio processing or file storage

  const httpServer = createServer(app);

  return httpServer;
}
