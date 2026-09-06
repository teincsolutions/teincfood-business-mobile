/**
 * Offline order hydration.
 *
 * On startup / business change, seeds the TanStack Query cache from the
 * durable SQLite order read-model so the seller, POS, kitchen and display
 * screens render current + recent orders immediately, even before any network
 * fetch completes (and fully offline after a restart).
 */

import { useEffect } from "react";
import { queryClient } from "@/providers/QueryProvider";
import { useBusinessStore } from "@/stores/business.store";
import { orderSnapshotsService } from "@teincfood/core";
import { SELLER_KEYS } from "@/hooks/seller.hooks";
import { POS_KEYS } from "@/hooks/pos.hooks";
import type { SellerOrder } from "@teincfood/core";

export function useOfflineOrderHydration() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  useEffect(() => {
    if (!businessId) return;

    const bid = businessId;
    let cancelled = false;

    async function hydrate() {
      const orders = await orderSnapshotsService.getSellerList(bid, bid);
      if (cancelled || !orders || orders.length === 0) return;

      const pages: {
        pages: { data: SellerOrder[]; pagination: Record<string, unknown> }[];
        pageParams: number[];
      } = {
        pages: [
          {
            data: orders,
            pagination: {
              page: 1,
              total_pages: 1,
              page_size: orders.length,
              total: orders.length,
            },
          },
        ],
        pageParams: [1],
      };

      // Seed the same key shape the seller and POS screens use with no filters.
      queryClient.setQueryData(
        [...SELLER_KEYS.orders(bid)] as unknown as readonly unknown[],
        pages,
      );
      queryClient.setQueryData(
        [...POS_KEYS.orders(bid), undefined],
        pages,
      );
    }

    hydrate().catch(() => {});
    orderSnapshotsService.pruneOld().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [businessId]);
}
