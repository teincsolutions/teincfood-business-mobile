/**
 * SQLite operations for reference data cache.
 */

import type { SQLiteDatabase } from "expo-sqlite";
import type { ReferenceDataKey, ReferenceDataRecord } from "./types";

export async function getReferenceData<T>(
  db: SQLiteDatabase,
  key: ReferenceDataKey,
): Promise<ReferenceDataRecord<T> | null> {
  const row = await db.getFirstAsync<{
    key: string;
    version: string;
    payload: string;
    downloaded_at: string;
  }>("SELECT * FROM reference_data WHERE key = ?;", key);

  if (!row) return null;

  return {
    key: row.key as ReferenceDataKey,
    version: row.version,
    payload: JSON.parse(row.payload) as T,
    downloadedAt: row.downloaded_at,
  };
}

export async function getReferenceVersion(
  db: SQLiteDatabase,
  key: ReferenceDataKey,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ version: string }>(
    "SELECT version FROM reference_data WHERE key = ?;",
    key,
  );
  return row?.version ?? null;
}

export async function setReferenceData<T>(
  db: SQLiteDatabase,
  record: ReferenceDataRecord<T>,
): Promise<void> {
  await db.runAsync(
    `
      INSERT INTO reference_data (key, version, payload, downloaded_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        version = excluded.version,
        payload = excluded.payload,
        downloaded_at = excluded.downloaded_at;
    `,
    record.key,
    record.version,
    JSON.stringify(record.payload),
    record.downloadedAt,
  );
}

export async function deleteReferenceData(
  db: SQLiteDatabase,
  key: ReferenceDataKey,
): Promise<void> {
  await db.runAsync("DELETE FROM reference_data WHERE key = ?;", key);
}

export async function getAllReferenceDataKeys(
  db: SQLiteDatabase,
): Promise<ReferenceDataKey[]> {
  const rows = await db.getAllAsync<{ key: string }>(
    "SELECT key FROM reference_data ORDER BY key;",
  );
  return rows.map((r) => r.key as ReferenceDataKey);
}
