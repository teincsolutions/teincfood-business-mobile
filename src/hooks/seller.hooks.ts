/**
 * Seller hooks — delegates to @teincfood/core for full offline support.
 * UI toast remains here; core handles outbox/queuing.
 */
export {
  useSellerOrdersQuery,
  useSellerOrderQuery,
  useAcceptOrderMutation,
  useRejectOrderMutation,
  useStartPreparingOrderMutation,
  useMarkOrderReadyMutation,
  useCompletePickupMutation,
  useCancelOrderMutation,
  useConfirmHandoverMutation,
  useAssignRiderMutation,
  useUpdateOrderStatusMutation,
  isQueuedTransition,
  SELLER_KEYS,
} from "@teincfood/core";
export { SELLER_KEYS as sellerKeys } from "@teincfood/core";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/stores/business.store";
import * as sellerService from "@/services/seller.service";
import type { BusinessDeliveriesParams } from "@/services/seller.service";
import type { BusinessDelivery, BusinessDeliveriesResponse } from "@/types/api";
import { SELLER_KEYS as Keys } from "@teincfood/core";

export function useBusinessDeliveriesQuery(enabled = true, filters?: { status?: string; search?: string }) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  return useInfiniteQuery<BusinessDeliveriesResponse, Error, BusinessDelivery[]>({
    queryKey: Keys.deliveries(activeBusinessId, filters as Record<string, unknown>),
    queryFn: async ({ pageParam = 1 }) => {
      const params: BusinessDeliveriesParams = { page: pageParam as number, page_size: 20 };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      return sellerService.fetchBusinessDeliveries(activeBusinessId!, params) as Promise<BusinessDeliveriesResponse>;
    },
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination;
      return p && p.page < p.total_pages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => data.pages.flatMap((p) => p.data),
    enabled: enabled && Boolean(activeBusinessId),
  });
}
