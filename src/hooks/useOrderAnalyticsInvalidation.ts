import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  POS_KEYS,
  REVENUE_KEYS,
  SELLER_ANALYTICS_KEYS,
  SELLER_DASHBOARD_KEYS,
  SELLER_KEYS,
  subscribeDbChanges,
  syncEngine,
} from "@teincfood/core";

const INVALIDATE_DEBOUNCE_MS = 400;

function isOrderEvent(eventType: string): boolean {
  return (
    eventType.startsWith("order.") ||
    eventType.startsWith("order:") ||
    eventType.startsWith("delivery.") ||
    eventType.startsWith("payment.")
  );
}

/**
 * Analytics and dashboard summaries are derived from the local order read
 * model, but the core reconciliation bridge only invalidates order lists and
 * the dashboard. Without this bridge, a sale completed offline can leave the
 * analytics screen showing its previous 30s-stale cache until the user
 * navigates away or pulls to refresh.
 *
 * Invalidate on both order events (other terminals / cloud) and local SQLite
 * order writes (this terminal's offline sales).
 */
export function useOrderAnalyticsInvalidation(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;

    const flush = () => {
      timer = undefined;
      if (!pending) return;
      pending = false;
      // Payment completion promotes awaiting_payment orders on the server;
      // refresh the Today/Orders boards so the status does not stay stale.
      void queryClient.invalidateQueries({ queryKey: POS_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: SELLER_ANALYTICS_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: REVENUE_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: SELLER_DASHBOARD_KEYS.all });
    };

    const schedule = () => {
      pending = true;
      if (!timer) timer = setTimeout(flush, INVALIDATE_DEBOUNCE_MS);
    };

    const unsubscribeEvents = syncEngine.subscribe((event) => {
      if (isOrderEvent(event.event_type)) schedule();
    });

    const unsubscribeDb = subscribeDbChanges((info) => {
      if (info.table === "orders" || info.table.startsWith("entity_snapshots")) {
        schedule();
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribeEvents();
      unsubscribeDb();
    };
  }, [queryClient]);
}
