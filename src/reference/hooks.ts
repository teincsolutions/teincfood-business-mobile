/**
 * React hooks for reference data synchronization and local cache access.
 */

import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { referenceSyncService } from "./service";
import { useBusinessStore } from "@/stores/business.store";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { openSyncDatabase } from "@/db/connection";
import { getReferenceData } from "./operations";
import { invalidateCachedImages } from "@/hooks/useCachedImage";
import type { ReferenceDataKey, ReferenceSyncOptions } from "./types";

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
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!businessId || !isOnline) return;

    let cancelled = false;
    referenceSyncService
      .sync({ businessId })
      .then((result) => {
        if (cancelled) return;
        // New images were downloaded into durable storage — re-resolve cached
        // image queries so screens swap to the local files.
        invalidateCachedImages(queryClient);
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
  }, [businessId, isOnline, queryClient]);
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
