/**
 * Seller Dashboard Hooks
 * TanStack Query hooks for seller dashboard metrics and recent orders
 */

import { useQuery } from '@tanstack/react-query';
import * as sellerDashboardService from '@/services/seller-dashboard.service';
import type { SellerDashboardMetrics } from '@/services/seller-dashboard.service';
import type { SellerOrder } from '@/services/mock-data.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const SELLER_DASHBOARD_KEYS = {
  all: ['seller-dashboard'] as const,
  metrics: () => [...SELLER_DASHBOARD_KEYS.all, 'metrics'] as const,
  recentOrders: () => [...SELLER_DASHBOARD_KEYS.all, 'recent-orders'] as const,
  full: () => [...SELLER_DASHBOARD_KEYS.all, 'full'] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetches seller dashboard metrics (today's orders, revenue, pending, rating)
 */
export function useSellerDashboardMetricsQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_DASHBOARD_KEYS.metrics(),
    queryFn: () => sellerDashboardService.fetchSellerDashboardMetrics(),
    enabled,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

/**
 * Fetches seller recent orders for dashboard
 */
export function useSellerDashboardRecentOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_DASHBOARD_KEYS.recentOrders(),
    queryFn: () => sellerDashboardService.fetchSellerDashboardRecentOrders(),
    enabled,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

/**
 * Fetches full seller dashboard data (metrics + recent orders)
 */
export function useSellerDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_DASHBOARD_KEYS.full(),
    queryFn: () => sellerDashboardService.fetchSellerDashboard(),
    enabled,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

// Export query keys for external use
export { SELLER_DASHBOARD_KEYS as sellerDashboardKeys };