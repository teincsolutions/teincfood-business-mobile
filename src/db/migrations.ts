/**
 * SQLite migrations for the offline-first command outbox and event journal.
 *
 * Migration rules:
 *   - Append-only. Never modify existing migrations.
 *   - Add new migrations at the end of the MIGRATIONS array.
 */

import type { SQLiteDatabase } from "expo-sqlite";

export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      // Command outbox: durable queue of pending commands.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS commands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          command_id TEXT NOT NULL UNIQUE,
          command_type TEXT NOT NULL,
          command_version TEXT NOT NULL,
          business_id TEXT NOT NULL,
          entity_id TEXT,
          user_id TEXT NOT NULL,
          device_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          error TEXT,
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_attempted_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
        CREATE INDEX IF NOT EXISTS idx_commands_business ON commands(business_id);
        CREATE INDEX IF NOT EXISTS idx_commands_entity ON commands(entity_id);
        CREATE INDEX IF NOT EXISTS idx_commands_created_at ON commands(created_at);
      `);

      // Event journal: append-only log of all business events.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT NOT NULL UNIQUE,
          event_type TEXT NOT NULL,
          event_version TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          device_id TEXT NOT NULL,
          payload TEXT NOT NULL,
          origin TEXT NOT NULL,
          synced_to_cloud INTEGER NOT NULL DEFAULT 0,
          timestamp TEXT NOT NULL,
          persisted_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
        CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id);
        CREATE INDEX IF NOT EXISTS idx_events_synced ON events(synced_to_cloud);
        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_origin ON events(origin);
      `);

      // Local read-model snapshot table for quick display reconstruction.
      // Updated by event projections, not by direct UI writes.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS entity_snapshots (
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          last_event_id TEXT NOT NULL,
          last_event_timestamp TEXT NOT NULL,
          payload TEXT NOT NULL,
          PRIMARY KEY (entity_type, entity_id)
        );

        CREATE INDEX IF NOT EXISTS idx_snapshots_entity_id ON entity_snapshots(entity_id);
      `);

      // Reference data versioning table.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reference_data (
          key TEXT NOT NULL PRIMARY KEY,
          version TEXT NOT NULL,
          payload TEXT NOT NULL,
          downloaded_at TEXT NOT NULL
        );
      `);
    },
  },
];
