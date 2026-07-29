/**
 * React hooks for reference data synchronization and local cache access.
 */

import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { referenceSyncService } from "./service";
import { openSyncDatabase } from "@/db/connection";
import { getReferenceData } from "./operations";
import type { ReferenceDataKey, ReferenceSyncOptions } from "./types";

export const REFERENCE_KEYS = {
  sync: ["reference", "sync"] as const,
  data: (key: ReferenceDataKey) => ["reference", "data", key] as const,
};

/**
 * Trigger reference data synchronization when the active business changes.
 *
 * This hook does not return data; it fires a background sync and updates the
 * TanStack Query cache. Set `enabled` to false to disable automatic sync.
 */
export function useReferenceDataSync(
  businessId: string | undefined,
  options: Omit<ReferenceSyncOptions, "businessId"> & { enabled?: boolean } = {},
) {
  const { enabled = true, ...syncOptions } = options;

  useEffect(() => {
    if (!enabled || !businessId) return;

    let cancelled = false;
    referenceSyncService
      .sync({ businessId, ...syncOptions })
      .then((result) => {
        if (cancelled) return;
        if (result.failed.length > 0) {
          console.warn("[ReferenceSync] failed keys:", result.failed);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[ReferenceSync] sync error:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId, enabled, JSON.stringify(syncOptions)]);
}

/**
 * Manually trigger reference data sync.
 */
export function useSyncReferenceData() {
  return useCallback(
    async (options: ReferenceSyncOptions) => {
      return referenceSyncService.sync(options);
    },
    [],
  );
}

/**
 * Read a reference data record from the local SQLite cache.
 *
 * This query does not hit the network. It is useful for offline-capable
 * screens that need reference data regardless of connectivity.
 */
export function useReferenceData<T>(key: ReferenceDataKey) {
  return useQuery({
    queryKey: REFERENCE_KEYS.data(key),
    queryFn: async () => {
      const db = await openSyncDatabase();
      return getReferenceData<T>(db, key);
    },
    staleTime: Infinity,
  });
}
