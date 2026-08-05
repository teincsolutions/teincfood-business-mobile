/**
 * SQLite connection for the offline-first command outbox and event journal.
 *
 * Uses expo-sqlite. The database is opened once at app startup and reused.
 */

import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { syncLogger } from "@/utils/sync-logger";
import { MIGRATIONS } from "./migrations";

const DB_NAME = "teincfood_sync.db";

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase> | null = null;

export async function openSyncDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await openDatabaseAsync(DB_NAME);
    await runMigrations(db);
    dbInstance = db;
    syncLogger.info("SQLite", "Database opened and migrated", {
      name: DB_NAME,
    });
    return db;
  })();

  // If open/migrate fails, reset the cached promise so a later attempt can
  // recover instead of rethrowing the same error forever.
  initPromise = initPromise.catch((error) => {
    initPromise = null;
    syncLogger.error("SQLite", "Failed to open sync database", {
      error: String(error),
    });
    throw error;
  });

  return initPromise;
}

export function getSyncDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    throw new Error(
      "Sync database not initialized. Call openSyncDatabase() first.",
    );
  }
  return dbInstance;
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    for (const migration of MIGRATIONS) {
      const row = await db.getFirstAsync<{ version: number }>(
        "SELECT version FROM migrations WHERE version = ?;",
        migration.version,
      );
      if (row) continue;

      await migration.up(db);
      await db.runAsync(
        "INSERT INTO migrations (version, applied_at) VALUES (?, ?);",
        migration.version,
        new Date().toISOString(),
      );
      syncLogger.info("SQLite", "Applied migration", {
        version: migration.version,
      });
    }
  });
}

export async function closeSyncDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
    syncLogger.info("SQLite", "Database closed");
  }
}
