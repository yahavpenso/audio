import { projectsTable, type ProjectInsert, type ProjectRow } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";

// Initialize database connection
const db = drizzle(process.env.DATABASE_URL!);

export interface IStorage {
  // Projects
  createProject(project: ProjectInsert): Promise<ProjectRow>;
  getProject(id: string): Promise<ProjectRow | undefined>;
  listProjects(userId: string): Promise<ProjectRow[]>;
  updateProject(id: string, updates: Partial<ProjectInsert>): Promise<ProjectRow>;
  deleteProject(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createProject(project: ProjectInsert): Promise<ProjectRow> {
    const result = await db
      .insert(projectsTable)
      .values(project)
      .returning();
    return result[0];
  }

  async getProject(id: string): Promise<ProjectRow | undefined> {
    const result = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .limit(1);
    return result[0];
  }

  async listProjects(userId: string): Promise<ProjectRow[]> {
    const result = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId))
      .orderBy(desc(projectsTable.updatedAt));
    return result;
  }

  async updateProject(id: string, updates: Partial<ProjectInsert>): Promise<ProjectRow> {
    const safeUpdates = {
      ...updates,
      updatedAt: new Date(),
    } as any;

    const result = await db
      .update(projectsTable)
      .set(safeUpdates)
      .where(eq(projectsTable.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, id));
  }
}

export const storage = new DatabaseStorage();
