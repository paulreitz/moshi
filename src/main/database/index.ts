import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'moshi.db');
}

function getMigrationsPath(): string {
  // In production, migrations are bundled with the app
  // In development, they're in the source directory
  if (app.isPackaged) {
    return join(process.resourcesPath, 'migrations');
  }
  // In dev mode, __dirname is out/main, so we need to go to project root
  return join(app.getAppPath(), 'src', 'main', 'database', 'migrations');
}

export function initDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (db) return db;

  const dbPath = getDbPath();
  const sqlite = new Database(dbPath);

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');

  db = drizzle(sqlite, { schema });

  // Run migrations on startup
  const migrationsPath = getMigrationsPath();
  migrate(db, { migrationsFolder: migrationsPath });

  return db;
}

export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export { schema };
