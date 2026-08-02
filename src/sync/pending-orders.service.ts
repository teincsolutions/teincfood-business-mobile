/**
 * Pending Orders Service.
 *
 * Bridges optimistic order events (queued while offline) into the
 * Pending Orders Store so every terminal can render them, and cleans them up
 * once the cloud acknowledges the order.
 *
 * Event sources:
 *   - The Sync Engine broadcasts `order.create_queued` events locally.
 *   - The Local Node broadcasts the same events to LAN clients.
 *   - The cloud returns `order.created` (echoing `local_order_number`).
 *
 * The optimistic event payload for `order.create_queued` is the SellerOrder
 * itself; `order.created` carries `local_order_number` matching the optimistic
 * order's `order_number`.
 */

import { openSyncDatabase } from "@/db/connection";
import {
  insertEvent,
  getUnsyncedEvents,
  markEventsSynced,
} from "@/db/operations";
import { usePendingOrdersStore } from "@/stores/pending-orders.store";
import { syncLogger } from "@/utils/sync-logger";
import type { DomainEvent } from "@/sync/types";
import type { SellerOrder } from "@/types/api/seller.api";

const PENDING_EVENT_TYPE = "order.create_queued";

let invalidator: (() => void) | null = null;

/**
 * Register a callback used to invalidate TanStack Query caches when a pending
 * order is reconciled. Returns an unregister function.
 */
export function registerPendingOrdersInvalidator(fn: () => void): () => void {
  invalidator = fn;
  return () => {
    if (invalidator === fn) invalidator = null;
  };
}

/**
 * Load persisted unsynced order:create_queued events into the store.
 * Idempotent; safe to call after app restart while still offline.
 */
export async function hydratePendingOrders(): Promise<void> {
  const store = usePendingOrdersStore.getState();
  if (store.hydrated) return;

  try {
    const db = await openSyncDatabase();
    const byNumber = new Map<string, SellerOrder>();

    for (const origin of ["local", "lan"] as const) {
      const events = await getUnsyncedEvents(db, origin, Number.MAX_SAFE_INTEGER);
      for (const event of events) {
        if (event.event_type !== PENDING_EVENT_TYPE) continue;
        const order = event.payload as unknown as SellerOrder;
        if (order?.order_number) byNumber.set(order.order_number, order);
      }
    }

    usePendingOrdersStore.setState({ orders: [...byNumber.values()] });
  } catch (error) {
    syncLogger.error("PendingOrders", "Hydration failed", {
      error: String(error),
    });
  } finally {
    usePendingOrdersStore.getState().setHydrated(true);
  }
}

/**
 * Apply a domain event to the pending-orders store and persistence layer.
 *
 *   - order.create_queued → add to store + persist (origin local|lan).
 *   - order.created       → remove matching pending order, mark the persisted
 *                           optimistic event synced, and invalidate caches.
 *
 * Idempotent: duplicate events (local broadcast + LAN broadcast + direct
 * enqueue) are safe.
 */
export async function applyPendingOrderEvent(
  event: DomainEvent,
  origin: "local" | "lan" = "local",
): Promise<void> {
  try {
    if (event.event_type === PENDING_EVENT_TYPE) {
      const order = event.payload as unknown as SellerOrder;
      if (!order?.order_number) return;

      usePendingOrdersStore.getState().addOrder(order);

      const db = await openSyncDatabase();
      await insertEvent(db, { event, origin });
      return;
    }

    if (event.event_type === "order.created") {
      const payload = event.payload as Record<string, unknown> | undefined;
      const localOrderNumber = payload?.local_order_number;
      if (typeof localOrderNumber !== "string") return;

      usePendingOrdersStore.getState().removeByOrderNumber(localOrderNumber);

      const db = await openSyncDatabase();
      // Mark every persisted optimistic event for this local order number as
      // synced so it does not rehydrate as pending after a restart. Check both
      // origins: the creating terminal persisted "local", LAN clients "lan".
      const ids: string[] = [];
      for (const origin of ["local", "lan"] as const) {
        const unsynced = await getUnsyncedEvents(
          db,
          origin,
          Number.MAX_SAFE_INTEGER,
        );
        for (const e of unsynced) {
          if (e.event_type !== PENDING_EVENT_TYPE) continue;
          if (
            (e.payload as { order_number?: string })?.order_number ===
            localOrderNumber
          ) {
            ids.push(e.event_id);
          }
        }
      }
      if (ids.length > 0) {
        await markEventsSynced(db, ids);
      }

      invalidator?.();
    }
  } catch (error) {
    syncLogger.error("PendingOrders", "Failed to apply event", {
      error: String(error),
      event_type: event.event_type,
    });
  }
}
