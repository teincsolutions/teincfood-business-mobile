/**
 * SQLite operations shim → @teincfood/core.
 * Re-exports core's db operations (command outbox, event journal, snapshots).
 */
export {
  insertCommand,
  getPendingCommands,
  updateCommandStatus,
  markCommandInFlight,
  deleteCommand,
  clearCompletedCommands,
  insertEvent,
  getEventsForEntity,
  getUnsyncedEvents,
  markEventsSynced,
  upsertEntitySnapshot,
  getEntitySnapshot,
  getEntitySnapshotsByType,
  deleteEntitySnapshot,
  pruneEntitySnapshots,
} from "@teincfood/core";
export type {
  InsertCommandInput,
  InsertEventInput,
  EntitySnapshot,
  UpsertEntitySnapshotInput,
} from "@teincfood/core";