/**
 * Sync reconciliation bridge.
 *
 * Subscribes to domain events produced by the Sync Engine and performs local
 * cleanup when offline-created entities are reconciled with the cloud:
 *   - Marks events synced to cloud.
 *   - Invalidates TanStack Query caches for affected entities.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncEngine } from "@/sync/engine";
import { getSyncDatabase } from "@/db/connection";
import { markEventsSynced } from "@/db/operations";
import { syncLogger } from "@/utils/sync-logger";
import { POS_KEYS } from "@/hooks/pos.hooks";
import { SELLER_KEYS } from "@/hooks/seller.hooks";
import type { DomainEvent } from "@/sync/types";

function isLocalOrderEvent(event: DomainEvent): boolean {
  const payload = event.payload as Record<string, unknown> | undefined;
  if (!payload) return false;
  const localOrderNumber = payload.local_order_number;
  return typeof localOrderNumber === "string" && localOrderNumber.startsWith("TFL-");
}

export function useSyncReconciliation(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    return syncEngine.subscribe(async (event) => {
      syncLogger.event(event, "received");

      if (event.event_type === "order.created" && isLocalOrderEvent(event)) {
        try {
          const db = getSyncDatabase();
          await markEventsSynced(db, [event.event_id]);
        } catch (error) {
          syncLogger.error("Reconciliation", "Failed to mark event synced", {
            error: String(error),
          });
        }

        const payload = event.payload as Record<string, unknown>;
        const businessId = payload.business_id as string | undefined;
        if (businessId) {
          queryClient.invalidateQueries({ queryKey: POS_KEYS.orders(businessId) });
          queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
        }
      }
    });
  }, [queryClient]);
}
