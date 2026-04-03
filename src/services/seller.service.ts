/**
 * Seller Service
 * Handles seller-related API calls for order management
 */

import type { SellerOrder } from '@/services/mock-data.service';
import { MOCK_SELLER_ORDERS } from '@/services/mock-data.service';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export interface UpdateOrderStatusResponse {
  success: boolean;
  order: SellerOrder;
  message: string;
}

export interface SellerOrderDetailResponse {
  order: SellerOrder;
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Fetch a single seller order by ID
 */
export async function fetchSellerOrder(orderId: string): Promise<SellerOrderDetailResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const order = MOCK_SELLER_ORDERS.find((o) => o.id === orderId);

  if (!order) {
    throw new Error('Order not found');
  }

  return { order };
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<UpdateOrderStatusResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const orderIndex = MOCK_SELLER_ORDERS.findIndex((o) => o.id === orderId);

  if (orderIndex === -1) {
    throw new Error('Order not found');
  }

  // Update the order status in mock data
  MOCK_SELLER_ORDERS[orderIndex] = {
    ...MOCK_SELLER_ORDERS[orderIndex],
    status,
  };

  return {
    success: true,
    order: MOCK_SELLER_ORDERS[orderIndex],
    message: `Order status updated to ${status}`,
  };
}

/**
 * Start preparing an order (pending -> preparing)
 */
export async function startPreparingOrder(orderId: string): Promise<UpdateOrderStatusResponse> {
  return updateOrderStatus(orderId, 'preparing');
}

/**
 * Mark order as ready (preparing -> ready)
 */
export async function markOrderReady(orderId: string): Promise<UpdateOrderStatusResponse> {
  return updateOrderStatus(orderId, 'ready');
}

/**
 * Mark order as delivered (ready -> delivered)
 */
export async function markOrderDelivered(orderId: string): Promise<UpdateOrderStatusResponse> {
  return updateOrderStatus(orderId, 'delivered');
}

/**
 * Fetch all seller orders
 */
export async function fetchSellerOrders(): Promise<{ orders: SellerOrder[] }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return { orders: [...MOCK_SELLER_ORDERS] };
}

/**
 * Accept a pending order
 */
export async function acceptOrder(orderId: string): Promise<UpdateOrderStatusResponse> {
  return updateOrderStatus(orderId, 'preparing');
}

/**
 * Reject an order
 */
export async function rejectOrder(orderId: string): Promise<UpdateOrderStatusResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const orderIndex = MOCK_SELLER_ORDERS.findIndex((o) => o.id === orderId);

  if (orderIndex === -1) {
    throw new Error('Order not found');
  }

  // Remove from mock data (in real app, would mark as rejected)
  const order = MOCK_SELLER_ORDERS.splice(orderIndex, 1)[0];

  return {
    success: true,
    order,
    message: 'Order rejected successfully',
  };
}