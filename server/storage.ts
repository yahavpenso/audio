import { AudioTrack, AudioEffect, AudioSelection } from "@shared/schema";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface IStorage {
  // Project operations
  getProject(projectId: string): Promise<any>;
  saveProject(projectId: string, project: any): Promise<void>;
  listProjects(userId: string): Promise<any[]>;
  deleteProject(projectId: string): Promise<void>;

  // File operations
  uploadAudioFile(arrayBuffer: Buffer, fileName: string): Promise<{ fileId: string; fileName: string; fileSize: number; uploadedAt: string }>;
  downloadAudioFile(fileId: string): Promise<Buffer>;
  deleteAudioFile(fileId: string): Promise<void>;
  getFileInfo(fileId: string): Promise<{ fileName: string; fileSize: number; uploadedAt: string } | null>;
}

const STORAGE_DIR = path.join(process.cwd(), ".audio_storage");

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// In-memory storage for demonstration (replace with database in production)
const projects = new Map<string, any>();
const fileMetadata = new Map<string, { fileName: string; fileSize: number; uploadedAt: string }>();

export class MemStorage implements IStorage {
  async getProject(projectId: string): Promise<any> {
    return projects.get(projectId) || null;
  }

  async saveProject(projectId: string, project: any): Promise<void> {
    projects.set(projectId, {
      ...project,
      updatedAt: new Date(),
    });
  }

  async listProjects(userId: string): Promise<any[]> {
    return Array.from(projects.values()).filter((p) => p.userId === userId);
  }

  async deleteProject(projectId: string): Promise<void> {
    projects.delete(projectId);
  }

  async uploadAudioFile(arrayBuffer: Buffer, fileName: string): Promise<{ fileId: string; fileName: string; fileSize: number; uploadedAt: string }> {
    const fileId = randomUUID();
    const filePath = path.join(STORAGE_DIR, fileId);

    // Save file to disk
    fs.writeFileSync(filePath, arrayBuffer);

    const fileInfo = {
      fileName,
      fileSize: arrayBuffer.length,
      uploadedAt: new Date().toISOString(),
    };

    fileMetadata.set(fileId, fileInfo);

    return {
      fileId,
      ...fileInfo,
    };
  }

  async downloadAudioFile(fileId: string): Promise<Buffer> {
    const filePath = path.join(STORAGE_DIR, fileId);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileId}`);
    }

    return fs.readFileSync(filePath);
  }

  async deleteAudioFile(fileId: string): Promise<void> {
    const filePath = path.join(STORAGE_DIR, fileId);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    fileMetadata.delete(fileId);
  }

  async getFileInfo(fileId: string): Promise<{ fileName: string; fileSize: number; uploadedAt: string } | null> {
    return fileMetadata.get(fileId) || null;
  }
}

// Export singleton instance
export const storage = new MemStorage();
