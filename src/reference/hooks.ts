/**
 * React hooks for reference data synchronization and local cache access.
 */

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { referenceSyncService, openSyncDatabase, getReferenceData } from "@teincfood/core";
import type { ReferenceDataKey, ReferenceSyncOptions, ReferenceSyncResult } from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { invalidateCachedImages } from "@/hooks/useCachedImage";

export const REFERENCE_KEYS = {
  all: ["reference"] as const,
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
      .then((result: ReferenceSyncResult) => {
        if (cancelled) return;
        if (result.failed.length > 0) {
          console.debug("[ReferenceSync] failed keys (non-fatal):", result.failed);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Silent — will retry when online
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
 * App-level reference sync: downloads every reference-backed dataset (menus,
 * roles, members, taxes, business profile, operating hours) into the SQLite
 * cache so the restaurant can operate fully offline. Runs when the active
 * business changes while online, and whenever connectivity is restored.
 *
 * Call once from the seller/fleet layouts. It does not return data; screens
 * read the SQLite cache through `useReferenceData`.
 */
export function useBusinessReferenceDataSync() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const isCloudReachable = useConnectivityStore((s) => s.isCloudReachable);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Strict reachable gate: `unknown` (cold start before NetInfo) must not fire sync,
    // otherwise airplane launch hangs 30s on fetchReferenceVersions.
    if (!businessId || !isOnline || isCloudReachable !== "reachable") return;

    let cancelled = false;
    referenceSyncService
      .sync({ businessId })
      .then((result: ReferenceSyncResult) => {
        if (cancelled) return;
        invalidateCachedImages(queryClient);
        if (result.failed.length > 0) {
          console.debug("[ReferenceSync] failed keys (non-fatal):", result.failed);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Offline / low internet: sync will retry when connectivity restores; silence error spam
      });

    return () => {
      cancelled = true;
    };
  }, [businessId, isOnline, isCloudReachable, queryClient]);
}

/**
 * Read a reference data record from the local SQLite cache for the active
 * business. This query does not hit the network. It is useful for offline-
 * capable screens that need reference data regardless of connectivity.
 */
export function useReferenceData<T>(key: ReferenceDataKey) {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useQuery({
    queryKey: [...REFERENCE_KEYS.data(key), businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const db = await openSyncDatabase();
      return getReferenceData<T>(db, businessId, key);
    },
    staleTime: Infinity,
    enabled: !!businessId,
  });
}
