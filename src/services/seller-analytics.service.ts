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

export interface RevenuePaymentMethod {
  method: string;
  revenue_minor: number;
  count: number;
  percentage: number;
}

export interface RevenueOrderType {
  type: string;
  revenue_minor: number;
  count: number;
}

export interface RevenueByDay {
  date: string;
  revenue_minor: number;
  count: number;
}

export interface RevenueSummaryData {
  period: string;
  currency: string;
  total_revenue_minor: number;
  total_orders: number;
  average_order_value_minor: number;
  by_payment_method: RevenuePaymentMethod[];
  by_order_type: RevenueOrderType[];
  by_day: RevenueByDay[];
}

export interface RevenueSummaryResponse {
  data: RevenueSummaryData;
}

export async function fetchSellerAnalytics(businessId: string, period?: string): Promise<SellerAnalyticsResponse> {
  const params = period ? { period } : undefined;
  return api.get(`/businesses/${businessId}/analytics`, { params });
}

export async function fetchRevenueSummary(businessId: string, period = 'today'): Promise<RevenueSummaryResponse> {
  return api.get(`/businesses/${businessId}/revenue-summary`, {
    params: { period },
  });
}
