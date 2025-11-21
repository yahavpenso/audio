import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { projectInsertSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects API
  app.post("/api/projects", async (req, res) => {
    try {
      const data = projectInsertSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create project" });
      }
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const userId = req.query.userId as string || "default";
      const projects = await storage.listProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to list projects" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const data = projectInsertSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, data);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update project" });
      }
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
