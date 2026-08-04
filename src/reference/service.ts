/**
 * Reference Data Synchronization Service.
 *
 * Responsible for downloading, versioning, and caching reference data
 * (menus, categories, modifiers, taxes, printers, etc.) locally.
 *
 * This service is separate from the Sync Engine, which handles transactional
 * commands and events.
 */

import { openSyncDatabase } from "@/db/connection";
import { syncLogger } from "@/utils/sync-logger";
import { generateUUID } from "@/utils/uuid";
import * as menuService from "@/services/menu.service";
import { cacheImageBatch } from "./image-cache";
import type { MenuItemListResponse } from "@/types/api";
import {
  getReferenceData,
  getReferenceVersion,
  setReferenceData,
} from "./operations";
import {
  fetchReferenceVersions,
  fetchReferenceData,
  fetchReferenceChanges,
} from "./api";
import type {
  ReferenceDataKey,
  ReferenceSyncOptions,
  ReferenceSyncResult,
  ReferenceDataRecord,
} from "./types";

const DEFAULT_SYNC_KEYS: ReferenceDataKey[] = [
  "menu:items",
  "menu:categories",
];

class ReferenceSyncService {
  private isSyncing = false;

  async sync(options: ReferenceSyncOptions): Promise<ReferenceSyncResult> {
    if (this.isSyncing) {
      return {
        synced: [],
        skipped: [],
        failed: [],
        errors: {} as Record<ReferenceDataKey, string>,
      };
    }

    this.isSyncing = true;
    syncLogger.info("ReferenceSync", "Starting reference data sync", {
      businessId: options.businessId,
      keys: options.keys,
    });

    const result: ReferenceSyncResult = {
      synced: [],
      skipped: [],
      failed: [],
      errors: {} as Record<ReferenceDataKey, string>,
    };

    try {
      const db = await openSyncDatabase();
      const keys = options.keys ?? DEFAULT_SYNC_KEYS;

      // Attempt version-aware sync. If the backend does not support versioning
      // endpoints, fall back to legacy full-fetch per key.
      let versions: { key: ReferenceDataKey; version: string }[] | null = null;
      try {
        versions = await fetchReferenceVersions(options.businessId);
      } catch (error) {
        syncLogger.warn("ReferenceSync", "Version endpoint unavailable, using fallback", {
          error: String(error),
        });
      }

      for (const key of keys) {
        try {
          const synced = await this.syncKey(db, key, options, versions);
          if (synced) {
            result.synced.push(key);
            if (key === "menu:items") {
              await this.cacheMenuImages(db);
            }
          } else {
            result.skipped.push(key);
          }
        } catch (error) {
          result.failed.push(key);
          result.errors[key] = String(error);
          syncLogger.error("ReferenceSync", `Failed to sync ${key}`, {
            error: String(error),
          });
        }
      }
    } finally {
      this.isSyncing = false;
    }

    syncLogger.info("ReferenceSync", "Reference data sync complete", {
      synced: result.synced,
      skipped: result.skipped,
      failed: result.failed,
    });

    return result;
  }

  private async syncKey(
    db: Awaited<ReturnType<typeof openSyncDatabase>>,
    key: ReferenceDataKey,
    options: ReferenceSyncOptions,
    versions: { key: ReferenceDataKey; version: string }[] | null,
  ): Promise<boolean> {
    const localVersion = await getReferenceVersion(db, key);

    if (!options.force && localVersion && !options.incremental) {
      // In non-incremental mode without force, we still re-sync if version
      // info says there is a newer version on the server.
      const serverVersion = versions?.find((v) => v.key === key)?.version;
      if (serverVersion && serverVersion === localVersion) {
        syncLogger.debug("ReferenceSync", `Up to date: ${key}`, {
          version: localVersion,
        });
        return false;
      }
    }

    let payload: unknown;
    let version: string;

    if (versions) {
      const serverVersion = versions.find((v) => v.key === key)?.version;
      if (serverVersion && localVersion && serverVersion !== localVersion) {
        try {
          const changeSet = await fetchReferenceChanges(
            options.businessId,
            key,
            localVersion,
          );
          payload = changeSet.changes;
          version = changeSet.to_version;
        } catch {
          // Fall back to full fetch if changes endpoint fails.
          const data = await fetchReferenceData(options.businessId, [key]);
          payload = data[key];
          version = serverVersion;
        }
      } else {
        const data = await fetchReferenceData(options.businessId, [key]);
        payload = data[key];
        version = serverVersion ?? generateUUID();
      }
    } else {
      // Backend does not support reference sync endpoints yet.
      const fallback = await this.fetchFallback(key, options.businessId);
      payload = fallback.payload;
      version = fallback.version;
    }

    await setReferenceData(db, {
      key,
      // Defensive: never write a NULL version. If the backend ever omits the
      // version, generate one so the row is still usable; the next version
      // comparison will simply see a mismatch and re-sync.
      version: version ?? generateUUID(),
      payload,
      downloadedAt: new Date().toISOString(),
    });

    return true;
  }

  private async fetchFallback(
    key: ReferenceDataKey,
    businessId: string,
  ): Promise<{ payload: unknown; version: string }> {
    switch (key) {
      case "menu:items": {
        const response = await menuService.fetchBusinessMenuItems(businessId, 1);
        return {
          payload: response,
          version: this.hashPayload(response),
        };
      }
      case "menu:categories": {
        const response = await menuService.fetchBusinessCategories(businessId);
        return {
          payload: response,
          version: this.hashPayload(response),
        };
      }
      default:
        throw new Error(`No fallback fetch available for ${key}`);
    }
  }

  private async cacheMenuImages(
    db: Awaited<ReturnType<typeof openSyncDatabase>>,
  ): Promise<void> {
    try {
      const cached = await getReferenceData<MenuItemListResponse>(
        db,
        "menu:items",
      );
      const items = cached?.payload?.data ?? [];
      const imageUrls = items.map((item) => item.image_url);
      const cachedImages = await cacheImageBatch(imageUrls, {
        skipIfCached: true,
      });
      syncLogger.debug("ReferenceSync", "Menu images cached", {
        count: cachedImages.length,
      });
    } catch (error) {
      syncLogger.warn("ReferenceSync", "Failed to cache menu images", {
        error: String(error),
      });
    }
  }

  private hashPayload(payload: unknown): string {
    // Simple deterministic hash for fallback versioning.
    // Replace with a proper hash (e.g. SHA-256) when backend versioning is ready.
    const json = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `local-${Math.abs(hash).toString(16)}`;
  }

  async getCached<T>(key: ReferenceDataKey): Promise<ReferenceDataRecord<T> | null> {
    const db = await openSyncDatabase();
    return getReferenceData<T>(db, key);
  }
}

export const referenceSyncService = new ReferenceSyncService();
