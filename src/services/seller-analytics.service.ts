import { api } from './api';

export interface AnalyticsTopItem {
  name: string;
  quantity: number;
  revenue_minor: number;
}

export interface AnalyticsOrdersByStatus {
  delivered: number;
  cancelled: number;
  pending: number;
}

export interface AnalyticsRevenueByDay {
  date: string;
  revenue_minor: number;
}

export interface SellerAnalyticsData {
  period: string;
  total_revenue_minor: number;
  total_orders: number;
  average_order_value_minor: number;
  top_items: AnalyticsTopItem[];
  orders_by_status: AnalyticsOrdersByStatus;
  revenue_by_day: AnalyticsRevenueByDay[];
}

export interface SellerAnalyticsResponse {
  data: SellerAnalyticsData;
}

export async function fetchSellerAnalytics(businessId: string, period?: string): Promise<SellerAnalyticsResponse> {
  const params = period ? { period } : undefined;
  return api.get(`/businesses/${businessId}/analytics`, { params });
}
