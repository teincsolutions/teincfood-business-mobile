import { api } from './api';
import type { SellerOrder } from '@/models/seller.model';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export interface UpdateOrderStatusResponse {
  success: boolean;
  order: SellerOrder;
  message: string;
}

export interface SellerOrderDetailResponse {
  order: SellerOrder;
}

export async function fetchSellerOrder(orderId: string): Promise<SellerOrderDetailResponse> {
  return api.get(`/v1/seller/orders/${orderId}`);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<UpdateOrderStatusResponse> {
  return api.patch(`/v1/seller/orders/${orderId}/status`, { status });
}

export async function startPreparingOrder(orderId: string): Promise<UpdateOrderStatusResponse> {
  return updateOrderStatus(orderId, 'preparing');
}

export async function markOrderReady(orderId: string): Promise<UpdateOrderStatusResponse> {
  return updateOrderStatus(orderId, 'ready');
}

export async function markOrderDelivered(orderId: string): Promise<UpdateOrderStatusResponse> {
  return updateOrderStatus(orderId, 'delivered');
}

export async function fetchSellerOrders(): Promise<{ orders: SellerOrder[] }> {
  return api.get('/v1/seller/orders');
}

export async function acceptOrder(orderId: string): Promise<UpdateOrderStatusResponse> {
  return api.post(`/v1/seller/orders/${orderId}/accept`);
}

export async function rejectOrder(orderId: string): Promise<UpdateOrderStatusResponse> {
  return api.post(`/v1/seller/orders/${orderId}/reject`);
}
