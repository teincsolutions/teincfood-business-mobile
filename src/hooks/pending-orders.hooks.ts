import { useEffect, useMemo } from "react";
import { usePendingOrdersStore } from "@/stores/pending-orders.store";
import { hydratePendingOrders } from "@/sync/pending-orders.service";
import { syncLogger } from "@/utils/sync-logger";
import type { SellerOrder } from "@/types/api/seller.api";

/**
 * Subscribe to locally queued (pending) orders for the active business.
 * Hydrates once from the persisted event journal on first mount.
 */
export function usePendingOrders(businessId?: string): SellerOrder[] {
  const hydrated = usePendingOrdersStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated) return;
    hydratePendingOrders().catch((error) => {
      syncLogger.error("usePendingOrders", "Hydrate failed", {
        error: String(error),
      });
    });
  }, [hydrated]);

  const allOrders = usePendingOrdersStore((s) => s.orders);

  return useMemo(
    () =>
      businessId
        ? allOrders.filter((o) => o.business_id === businessId)
        : allOrders,
    [allOrders, businessId],
  );
}
