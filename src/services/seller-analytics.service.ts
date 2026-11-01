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

export interface AnalyticsRange {
  date_from?: string;
  date_to?: string;
}

function analyticsParams(
  period?: string,
  range?: AnalyticsRange,
): Record<string, string> | undefined {
  const params: Record<string, string> = {};
  if (period) params.period = period;
  if (range?.date_from) params.date_from = range.date_from;
  if (range?.date_to) params.date_to = range.date_to;
  return Object.keys(params).length > 0 ? params : undefined;
}

export async function fetchSellerAnalytics(
  businessId: string,
  period?: string,
  range?: AnalyticsRange,
): Promise<SellerAnalyticsResponse> {
  return api.get(`/businesses/${businessId}/analytics`, {
    params: analyticsParams(period, range),
  });
}

export async function fetchRevenueSummary(
  businessId: string,
  period = 'today',
  range?: AnalyticsRange,
): Promise<RevenueSummaryResponse> {
  return api.get(`/businesses/${businessId}/revenue-summary`, {
    params: analyticsParams(period, range),
  });
}
