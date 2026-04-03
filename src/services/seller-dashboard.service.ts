/**
 * Seller Dashboard Service
 * Handles seller dashboard metrics and recent orders
 */

import type { SellerOrder } from '@/services/mock-data.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SellerDashboardMetrics {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  averageRating: number;
  activeOrders: number;
}

export interface SellerDashboardResponse {
  metrics: SellerDashboardMetrics;
  recentOrders: SellerOrder[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_METRICS: SellerDashboardMetrics = {
  todayOrders: 24,
  todayRevenue: 1250.0,
  pendingOrders: 5,
  averageRating: 4.8,
  activeOrders: 3,
};

const MOCK_RECENT_ORDERS: SellerOrder[] = [
  {
    id: '1',
    orderNumber: '#ORD-001',
    status: 'pending',
    items: 3,
    total: 45.0,
    customer: 'John Doe',
    orderDate: new Date().toISOString(),
    paymentMethod: 'mobile_money',
    paymentStatus: 'paid',
  },
  {
    id: '2',
    orderNumber: '#ORD-002',
    status: 'preparing',
    items: 2,
    total: 32.5,
    customer: 'Jane Smith',
    orderDate: new Date().toISOString(),
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
  },
  {
    id: '3',
    orderNumber: '#ORD-003',
    status: 'ready',
    items: 4,
    total: 67.0,
    customer: 'Kwame Asante',
    orderDate: new Date().toISOString(),
    paymentMethod: 'card',
    paymentStatus: 'paid',
  },
];

// ─── Mock API Functions ──────────────────────────────────────────────────────

const SIMULATED_DELAY = 400;

export async function fetchSellerDashboardMetrics(): Promise<SellerDashboardMetrics> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_METRICS }), SIMULATED_DELAY);
  });
}

export async function fetchSellerDashboardRecentOrders(): Promise<SellerOrder[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_RECENT_ORDERS]), SIMULATED_DELAY);
  });
}

export async function fetchSellerDashboard(): Promise<SellerDashboardResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        metrics: { ...MOCK_METRICS },
        recentOrders: [...MOCK_RECENT_ORDERS],
      });
    }, SIMULATED_DELAY);
  });
}