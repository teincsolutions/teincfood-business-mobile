import { useInfiniteQuery } from '@tanstack/react-query';
import { useBusinessStore } from '@/stores/business.store';
import { fetchBusinessDeliveries } from '@/services/delivery.service';
import type { BusinessDeliveriesParams } from '@/services/delivery.service';

export const DELIVERY_KEYS = {
  all: ['business-deliveries'] as const,
  list: (businessId?: string, filters?: Record<string, unknown>) =>
    ['business-deliveries', businessId, filters] as const,
};

export function useBusinessDeliveriesQuery(
  enabled = true,
  filters?: { status?: string; search?: string },
) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useInfiniteQuery({
    queryKey: DELIVERY_KEYS.list(activeBusinessId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: BusinessDeliveriesParams = { page: pageParam, page_size: 20 };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      return fetchBusinessDeliveries(activeBusinessId!, params);
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination ?? {};
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => data.pages.flatMap((p) => p.data),
    enabled: enabled && Boolean(activeBusinessId),
  });
}
