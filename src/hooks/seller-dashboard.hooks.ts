import { useQuery } from '@tanstack/react-query';
import * as sellerDashboardService from '@/services/seller-dashboard.service';
import type { SellerDashboardMetrics } from '@/services/seller-dashboard.service';

export const SELLER_DASHBOARD_KEYS = {
  all: ['seller-dashboard'] as const,
  metrics: (businessId: string) => [...SELLER_DASHBOARD_KEYS.all, 'metrics', businessId] as const,
  recentOrders: (businessId: string) => [...SELLER_DASHBOARD_KEYS.all, 'recent-orders', businessId] as const,
  full: (businessId: string) => [...SELLER_DASHBOARD_KEYS.all, 'full', businessId] as const,
};

export function useSellerDashboardMetricsQuery(businessId: string, enabled = true) {
  return useQuery({
    queryKey: SELLER_DASHBOARD_KEYS.metrics(businessId),
    queryFn: async () => {
      const res = await sellerDashboardService.fetchSellerDashboard(businessId);
      return res.data.metrics;
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSellerDashboardRecentOrdersQuery(businessId: string, enabled = true) {
  return useQuery({
    queryKey: SELLER_DASHBOARD_KEYS.recentOrders(businessId),
    queryFn: async () => {
      const res = await sellerDashboardService.fetchSellerDashboard(businessId);
      return res.data.recent_orders;
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSellerDashboardQuery(businessId: string, enabled = true) {
  return useQuery({
    queryKey: SELLER_DASHBOARD_KEYS.full(businessId),
    queryFn: async () => {
      const res = await sellerDashboardService.fetchSellerDashboard(businessId);
      return res.data;
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 1000 * 60 * 2,
  });
}

export { SELLER_DASHBOARD_KEYS as sellerDashboardKeys };
