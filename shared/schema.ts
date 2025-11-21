import { z } from "zod";
import { pgTable, text, integer, timestamp, jsonb, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Database tables
export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  name: text("name").notNull(),
  description: text("description"),
  audioFileName: text("audio_file_name"),
  duration: doublePrecision("duration").default(0),
  sampleRate: integer("sample_rate"),
  numberOfChannels: integer("number_of_channels"),
  audioData: text("audio_data"), // Base64 encoded audio buffer
  effects: jsonb("effects").$type<PanningEffect[]>().default([]),
  selection: jsonb("selection").$type<AudioSelection | null>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Type inference from table
export type ProjectRow = typeof projectsTable.$inferSelect;
export const projectInsertSchema = createInsertSchema(projectsTable);
export type ProjectInsert = z.infer<typeof projectInsertSchema>;

// Audio file metadata
export interface AudioFile {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

// Panning effect instance
export interface PanningEffect {
  id: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  intensity: number; // 0-100 (percentage)
}

// Export format options
export type ExportFormat = "wav" | "mp3";

export interface WavExportSettings {
  format: "wav";
  sampleRate: number; // 44100, 48000
  bitDepth: number; // 16, 24, 32
}

export interface Mp3ExportSettings {
  format: "mp3";
  bitrate: number; // 128, 192, 256, 320 kbps
}

export type ExportSettings = WavExportSettings | Mp3ExportSettings;

// Audio selection for cutting
export interface AudioSelection {
  startTime: number;
  endTime: number;
}

// Zod schemas for validation
export const panningEffectSchema = z.object({
  id: z.string(),
  startTime: z.number().min(0),
  duration: z.number().min(0.1).max(10),
  intensity: z.number().min(0).max(100),
});

export const audioSelectionSchema = z.object({
  startTime: z.number().min(0),
  endTime: z.number().min(0),
});

export const wavExportSettingsSchema = z.object({
  format: z.literal("wav"),
  sampleRate: z.union([z.literal(44100), z.literal(48000)]),
  bitDepth: z.union([z.literal(16), z.literal(24), z.literal(32)]),
});

export const mp3ExportSettingsSchema = z.object({
  format: z.literal("mp3"),
  bitrate: z.union([z.literal(128), z.literal(192), z.literal(256), z.literal(320)]),
});

export const exportSettingsSchema = z.union([wavExportSettingsSchema, mp3ExportSettingsSchema]);

export type InsertPanningEffect = z.infer<typeof panningEffectSchema>;
export type ExportSettingsInput = z.infer<typeof exportSettingsSchema>;
