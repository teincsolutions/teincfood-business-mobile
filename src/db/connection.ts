/**
 * SQLite connection shim → @teincfood/core.
 * Re-exports core's connection layer so the app's import paths stay stable.
 * Triggers core bootstrap once at import time (drivers injected before use).
 */
import { ensureCoreBootstrap } from "@/core/bootstrap";
export { openSyncDatabase, getSyncDatabase, closeSyncDatabase } from "@teincfood/core";

ensureCoreBootstrap();