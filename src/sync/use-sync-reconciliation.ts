/**
 * Sync reconciliation bridge.
 *
 * Subscribes to domain events produced by the Sync Engine and:
 *   - Applies order events to the pending-orders store (queued orders stay
 *     visible until the cloud confirms them).
 *   - Marks reconciled optimistic events as synced to cloud.
 *   - Invalidates TanStack Query caches for affected entities.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { syncEngine } from "@/sync/engine";
import {
  applyPendingOrderEvent,
  registerPendingOrdersInvalidator,
} from "@/sync/pending-orders.service";
import { localNodeService } from "@/local-node/service";
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
    // Pending-order reconciliation invalidates POS + seller order lists so the
    // server-confirmed order replaces the optimistic one. Invalidate from the
    // broadest key: POS_KEYS.orders() without a businessId would produce
    // ['pos','orders',undefined] which does not prefix-match business-scoped
    // keys.
    const unregisterInvalidator = registerPendingOrdersInvalidator(() => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
    });

    const unsubscribe = syncEngine.subscribe(async (event) => {
      syncLogger.event(event, "received");

      // The node relays engine events (e.g. order.created when a queued
      // command is replayed) to LAN clients so they reconcile their pending
      // orders and refresh caches.
      if (localNodeService.isLocalNode()) {
        localNodeService.broadcastToClients(event);
      }

      // Route both queued (optimistic) and reconciled (created) order events
      // into the pending-orders store.
      if (
        event.event_type === "order.create_queued" ||
        event.event_type === "order.created"
      ) {
        await applyPendingOrderEvent(event, "local");
      }

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

    return () => {
      unsubscribe();
      unregisterInvalidator();
    };
  }, [queryClient]);
}
