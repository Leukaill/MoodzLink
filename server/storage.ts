// Since we're using Supabase as the backend, this storage interface is simplified
// All data operations will be handled through Supabase client-side

export interface IStorage {
  // Placeholder methods - actual implementation will be in Supabase
  healthCheck(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export const storage = new MemStorage();
