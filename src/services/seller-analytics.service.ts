import { api } from './api';

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

export async function fetchSellerAnalyticsMetrics(): Promise<any> {
  return api.get('/orders');
}

export async function fetchSellerPerformance(): Promise<any> {
  return api.get('/orders');
}

export async function fetchTopSellingItems(): Promise<any> {
  return api.get('/orders');
}

export async function fetchSellerAnalytics(): Promise<any> {
  return api.get('/orders');
}
