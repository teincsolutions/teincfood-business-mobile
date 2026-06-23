import { api } from './api';
import type {
  SellerOrder,
  SellerOrdersResponse,
  SellerOrderDetailResponse,
} from '@/types/api';

// ─── Orders ───

export async function fetchSellerOrders(): Promise<SellerOrdersResponse> {
  return api.get<SellerOrdersResponse>('/orders');
}

export async function fetchSellerOrder(orderId: string): Promise<SellerOrderDetailResponse> {
  return api.get<SellerOrderDetailResponse>(`/orders/${orderId}`);
}

export async function createOrder(data: Record<string, unknown>): Promise<SellerOrderDetailResponse> {
  return api.post<SellerOrderDetailResponse>('/orders', data);
}

export async function deleteOrder(orderId: string): Promise<void> {
  return api.delete(`/orders/${orderId}`);
}

// ─── Order Actions ───

export async function acceptOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/accept`);
}

export async function rejectOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/reject`);
}

export async function startPreparingOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/start-preparing`);
}

export async function markOrderReady(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/ready-for-delivery`);
}

export async function cancelOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/cancel`);
}

export async function cancelOrderDeliveryFailure(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/cancel-delivery-failure`);
}

// ─── Business Orders ───

export async function fetchBusinessOrders(businessId: string): Promise<SellerOrdersResponse> {
  return api.get<SellerOrdersResponse>(`/businesses/${businessId}/orders`);
}

export async function fetchBusinessOrderByNumber(businessId: string, orderNumber: string): Promise<SellerOrderDetailResponse> {
  return api.get<SellerOrderDetailResponse>(`/businesses/${businessId}/orders/${orderNumber}`);
}

// ─── Legacy alias ───

export async function updateOrderStatus(orderId: string, status: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/${status}`);
}

// ─── Handover ───

export async function confirmHandover(deliveryId: string): Promise<{ data: { id: string; status: string } }> {
  return api.post(`/deliveries/${deliveryId}/confirm-handover`);
}

// ─── Analytics ───

export async function fetchBusinessAnalytics(businessId: string, period?: string): Promise<{ data: Record<string, unknown> }> {
  const params = period ? { period } : undefined;
  return api.get(`/businesses/${businessId}/analytics`, { params });
}
