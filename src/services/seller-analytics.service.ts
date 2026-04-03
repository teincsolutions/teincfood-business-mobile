/**
 * Seller Analytics Service
 * Handles seller analytics data and performance metrics
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SellerAnalyticsMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  averageRating: number;
  peakHour: string;
}

export interface PerformancePeriod {
  period: string;
  revenue: number;
  orders: number;
}

export interface TopSellingItem {
  name: string;
  sold: number;
}

export interface SellerAnalyticsResponse {
  metrics: SellerAnalyticsMetrics;
  recentPerformance: PerformancePeriod[];
  topSellingItems: TopSellingItem[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_ANALYTICS_METRICS: SellerAnalyticsMetrics = {
  totalRevenue: 12500.0,
  totalOrders: 156,
  averageOrderValue: 80.13,
  averageRating: 4.8,
  peakHour: '12:00 PM - 2:00 PM',
};

const MOCK_RECENT_PERFORMANCE: PerformancePeriod[] = [
  { period: 'Today', revenue: 850.0, orders: 12 },
  { period: 'This Week', revenue: 4200.0, orders: 58 },
  { period: 'This Month', revenue: 12500.0, orders: 156 },
];

const MOCK_TOP_SELLING_ITEMS: TopSellingItem[] = [
  { name: 'Jollof Rice', sold: 45 },
  { name: 'Banku & Tilapia', sold: 32 },
  { name: 'Grilled Chicken', sold: 28 },
];

// ─── Mock API Functions ──────────────────────────────────────────────────────

const SIMULATED_DELAY = 400;

export async function fetchSellerAnalyticsMetrics(): Promise<SellerAnalyticsMetrics> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_ANALYTICS_METRICS }), SIMULATED_DELAY);
  });
}

export async function fetchSellerPerformance(): Promise<PerformancePeriod[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_RECENT_PERFORMANCE]), SIMULATED_DELAY);
  });
}

export async function fetchTopSellingItems(): Promise<TopSellingItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_TOP_SELLING_ITEMS]), SIMULATED_DELAY);
  });
}

export async function fetchSellerAnalytics(): Promise<SellerAnalyticsResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        metrics: { ...MOCK_ANALYTICS_METRICS },
        recentPerformance: [...MOCK_RECENT_PERFORMANCE],
        topSellingItems: [...MOCK_TOP_SELLING_ITEMS],
      });
    }, SIMULATED_DELAY);
  });
}