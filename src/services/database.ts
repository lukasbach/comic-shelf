import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const getDb = async (): Promise<Database> => {
  if (!db) {
    db = await Database.load('sqlite:comic-viewer.db');
  }
  return db;
};
