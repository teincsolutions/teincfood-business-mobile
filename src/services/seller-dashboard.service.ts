import { api } from './api';

export interface SellerDashboardMetrics {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  averageRating: number;
  activeOrders: number;
}

export interface SellerDashboardResponse {
  metrics: SellerDashboardMetrics;
  recentOrders: any[];
}

export async function fetchSellerDashboardMetrics(): Promise<any> {
  return api.get('/orders');
}

export async function fetchSellerDashboardRecentOrders(): Promise<any> {
  return api.get('/orders');
}

export async function fetchSellerDashboard(): Promise<any> {
  return api.get('/orders');
}
