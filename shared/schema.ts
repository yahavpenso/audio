import { z } from "zod";
import { pgTable, text, integer, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Audio track for multi-track editing
export interface AudioTrack {
  id: string;
  name: string;
  storageFileId?: string; // Reference to file in storage (instead of embedded data)
  volume: number; // 0-100
  pan: number; // -100 to 100
  isMuted: boolean;
  isSolo: boolean;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  fileSize?: number; // Size in bytes
  uploadedAt?: string; // ISO timestamp
}

// Database tables
export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  name: text("name").notNull(),
  description: text("description"),
  tracks: jsonb("tracks").$type<AudioTrack[]>().default([]),
  effects: jsonb("effects").$type<AudioEffect[]>().default([]),
  selection: jsonb("selection").$type<AudioSelection | null>(),
  duration: doublePrecision("duration").default(0),
  totalFileSize: doublePrecision("total_file_size").default(0), // Sum of all track files in bytes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProjectRow = typeof projectsTable.$inferSelect;
export const projectInsertSchema = createInsertSchema(projectsTable);
export type ProjectInsert = z.infer<typeof projectInsertSchema>;

// Audio file metadata (legacy, kept for compatibility)
export interface AudioFile {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

// Unified effect type system
export interface PanningEffect {
  id: string;
  type: "panning";
  startTime: number;
  duration: number;
  intensity: number; // 0-100
}

export interface ReverbEffect {
  id: string;
  type: "reverb";
  startTime: number;
  duration: number;
  dryWet: number; // 0-100 (mix)
  decay: number; // 0.1-10 seconds
}

export interface DelayEffect {
  id: string;
  type: "delay";
  startTime: number;
  duration: number;
  dryWet: number; // 0-100 (mix)
  delayTime: number; // 0.05-2 seconds
  feedback: number; // 0-80%
}

export interface EQEffect {
  id: string;
  type: "eq";
  startTime: number;
  duration: number;
  lowGain: number; // -12 to +12 dB
  midGain: number; // -12 to +12 dB
  highGain: number; // -12 to +12 dB
}

export interface CompressorEffect {
  id: string;
  type: "compressor";
  startTime: number;
  duration: number;
  threshold: number; // -100 to 0 dB
  ratio: number; // 1 to 20
  attack: number; // 0 to 1 seconds
  release: number; // 0 to 1 seconds
}

export interface PitchShiftEffect {
  id: string;
  type: "pitchshift";
  startTime: number;
  duration: number;
  semitones: number; // -24 to +24 semitones
}

export interface DistortionEffect {
  id: string;
  type: "distortion";
  startTime: number;
  duration: number;
  amount: number; // 0-100 (intensity of distortion)
  tone: number; // 0-100 (brightness)
}

export interface ChorusEffect {
  id: string;
  type: "chorus";
  startTime: number;
  duration: number;
  rate: number; // 0.5-5 Hz
  depth: number; // 0-100 (mix intensity)
  dryWet: number; // 0-100 (wet/dry mix)
}

export type AudioEffect = PanningEffect | ReverbEffect | DelayEffect | EQEffect | CompressorEffect | PitchShiftEffect | DistortionEffect | ChorusEffect;

// Export format options
export type ExportFormat = "wav" | "mp3";

export interface WavExportSettings {
  format: "wav";
  sampleRate: number;
  bitDepth: number;
}

export interface Mp3ExportSettings {
  format: "mp3";
  bitrate: number;
}

export type ExportSettings = WavExportSettings | Mp3ExportSettings;

// Audio selection for cutting
export interface AudioSelection {
  startTime: number;
  endTime: number;
}

// File upload response from server
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  url?: string; // Optional: URL to retrieve the file
}

// Zod schemas for validation
export const audioTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  storageFileId: z.string().optional(),
  volume: z.number().min(0).max(100),
  pan: z.number().min(-100).max(100),
  isMuted: z.boolean(),
  isSolo: z.boolean(),
  duration: z.number().min(0),
  sampleRate: z.number(),
  numberOfChannels: z.number(),
  fileSize: z.number().optional(),
  uploadedAt: z.string().optional(),
});

export const panningEffectSchema = z.object({
  id: z.string(),
  type: z.literal("panning"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1).max(10),
  intensity: z.number().min(0).max(100),
});

export const reverbEffectSchema = z.object({
  id: z.string(),
  type: z.literal("reverb"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  dryWet: z.number().min(0).max(100),
  decay: z.number().min(0.1).max(10),
});

export const delayEffectSchema = z.object({
  id: z.string(),
  type: z.literal("delay"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  dryWet: z.number().min(0).max(100),
  delayTime: z.number().min(0.05).max(2),
  feedback: z.number().min(0).max(80),
});

export const eqEffectSchema = z.object({
  id: z.string(),
  type: z.literal("eq"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  lowGain: z.number().min(-12).max(12),
  midGain: z.number().min(-12).max(12),
  highGain: z.number().min(-12).max(12),
});

export const compressorEffectSchema = z.object({
  id: z.string(),
  type: z.literal("compressor"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  threshold: z.number().min(-100).max(0),
  ratio: z.number().min(1).max(20),
  attack: z.number().min(0).max(1),
  release: z.number().min(0).max(1),
});

export const pitchShiftEffectSchema = z.object({
  id: z.string(),
  type: z.literal("pitchshift"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  semitones: z.number().min(-24).max(24),
});

export const distortionEffectSchema = z.object({
  id: z.string(),
  type: z.literal("distortion"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  amount: z.number().min(0).max(100),
  tone: z.number().min(0).max(100),
});

export const chorusEffectSchema = z.object({
  id: z.string(),
  type: z.literal("chorus"),
  startTime: z.number().min(0),
  duration: z.number().min(0.1),
  rate: z.number().min(0.5).max(5),
  depth: z.number().min(0).max(100),
  dryWet: z.number().min(0).max(100),
});

export const audioEffectSchema = z.union([
  panningEffectSchema,
  reverbEffectSchema,
  delayEffectSchema,
  eqEffectSchema,
  compressorEffectSchema,
  pitchShiftEffectSchema,
  distortionEffectSchema,
  chorusEffectSchema,
]);

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

export const fileUploadResponseSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  uploadedAt: z.string(),
  url: z.string().optional(),
});
