import { api } from './api';

export interface SellerDashboardMetrics {
  today_orders: number;
  today_revenue_minor: number;
  pending_orders: number;
  average_rating: number;
  active_orders: number;
}

export interface SellerDashboardResponse {
  data: {
    metrics: SellerDashboardMetrics;
    recent_orders: any[];
  };
}

export async function fetchSellerDashboard(businessId: string): Promise<SellerDashboardResponse> {
  return api.get<SellerDashboardResponse>(`/businesses/${businessId}/dashboard`);
}
