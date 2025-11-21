/**
 * File Storage Service
 * Handles uploading and retrieving audio files from server storage
 */

import { FileUploadResponse } from "@shared/schema";

/**
 * Upload audio file to server storage
 */
export async function uploadAudioFile(arrayBuffer: ArrayBuffer, fileName: string): Promise<FileUploadResponse> {
  const blob = new Blob([arrayBuffer], { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", blob, fileName);

  const response = await fetch("/api/upload-audio", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Download audio file from server storage
 */
export async function downloadAudioFile(fileId: string): Promise<ArrayBuffer> {
  const response = await fetch(`/api/audio/${fileId}`);

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

/**
 * Delete audio file from server storage
 */
export async function deleteAudioFile(fileId: string): Promise<void> {
  const response = await fetch(`/api/audio/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`);
  }
}

/**
 * Get file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get storage usage percentage
 * Replit storage limit is typically 25GB per project
 */
export function getStorageUsagePercent(totalBytes: number, limitBytes = 25 * 1024 * 1024 * 1024): number {
  return Math.round((totalBytes / limitBytes) * 100);
}
