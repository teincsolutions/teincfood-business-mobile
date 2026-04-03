/**
 * Seller Analytics Hooks
 * TanStack Query hooks for seller analytics and performance data
 */

import { useQuery } from '@tanstack/react-query';
import * as sellerAnalyticsService from '@/services/seller-analytics.service';
import type {
  SellerAnalyticsMetrics,
  PerformancePeriod,
  TopSellingItem,
  SellerAnalyticsResponse,
} from '@/services/seller-analytics.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const SELLER_ANALYTICS_KEYS = {
  all: ['seller-analytics'] as const,
  metrics: () => [...SELLER_ANALYTICS_KEYS.all, 'metrics'] as const,
  performance: () => [...SELLER_ANALYTICS_KEYS.all, 'performance'] as const,
  topItems: () => [...SELLER_ANALYTICS_KEYS.all, 'top-items'] as const,
  full: () => [...SELLER_ANALYTICS_KEYS.all, 'full'] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetches seller analytics metrics (total revenue, orders, avg value, rating)
 */
export function useSellerAnalyticsMetricsQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_ANALYTICS_KEYS.metrics(),
    queryFn: () => sellerAnalyticsService.fetchSellerAnalyticsMetrics(),
    enabled,
    staleTime: 30000,
  });
}

/**
 * Fetches seller performance by period (today, week, month)
 */
export function useSellerPerformanceQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_ANALYTICS_KEYS.performance(),
    queryFn: () => sellerAnalyticsService.fetchSellerPerformance(),
    enabled,
    staleTime: 30000,
  });
}

/**
 * Fetches top selling items
 */
export function useTopSellingItemsQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_ANALYTICS_KEYS.topItems(),
    queryFn: () => sellerAnalyticsService.fetchTopSellingItems(),
    enabled,
    staleTime: 30000,
  });
}

/**
 * Fetches full seller analytics data
 */
export function useSellerAnalyticsQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_ANALYTICS_KEYS.full(),
    queryFn: () => sellerAnalyticsService.fetchSellerAnalytics(),
    enabled,
    staleTime: 30000,
  });
}

// Export query keys for external use
export { SELLER_ANALYTICS_KEYS as sellerAnalyticsKeys };