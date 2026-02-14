import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const getDb = async (): Promise<Database> => {
  if (!db) {
    db = await Database.load('sqlite:comic-viewer.db');
    // Enable foreign keys for ON DELETE CASCADE
    await db.execute('PRAGMA foreign_keys = ON');
  }
  return db;
};
