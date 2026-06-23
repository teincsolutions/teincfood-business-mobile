import { useQuery } from '@tanstack/react-query';
import * as sellerAnalyticsService from '@/services/seller-analytics.service';
import { useBusinessStore } from '@/stores/business.store';

export const SELLER_ANALYTICS_KEYS = {
  all: ['seller-analytics'] as const,
  analytics: (businessId: string, period: string) =>
    [...SELLER_ANALYTICS_KEYS.all, businessId, period] as const,
};

export function useSellerAnalyticsQuery(period = 'today', enabled = true) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useQuery({
    queryKey: SELLER_ANALYTICS_KEYS.analytics(activeBusinessId ?? '', period),
    queryFn: () =>
      sellerAnalyticsService.fetchSellerAnalytics(activeBusinessId!, period),
    enabled: enabled && Boolean(activeBusinessId),
    staleTime: 30000,
  });
}

export { SELLER_ANALYTICS_KEYS as sellerAnalyticsKeys };
