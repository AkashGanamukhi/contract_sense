// This is a frontend-only application for contract analysis
// All data is stored in localStorage and processed client-side
// No server storage implementation needed currently

export interface IStorage {
  // Future storage methods for contract persistence can be added here
}

export class MemStorage implements IStorage {
  constructor() {
    // No server-side storage needed for current implementation
  }
}

export const storage = new MemStorage();
