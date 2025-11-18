// Storage interface for audio editor
// This application is primarily client-side using Web Audio API
// No persistent storage needed as all processing happens in the browser

export interface IStorage {
  // Placeholder for future backend features if needed
}

export class MemStorage implements IStorage {
  constructor() {
    // No server-side storage needed for this client-side audio editor
  }
}

export const storage = new MemStorage();
