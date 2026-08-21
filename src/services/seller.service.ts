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

export async function completeOrderPickup(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/complete-pickup`);
}

export async function cancelOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/cancel`);
}

export async function cancelOrderDeliveryFailure(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/cancel-delivery-failure`);
}

// ─── Business Orders ───

export interface BusinessOrdersParams {
  page?: number;
  page_size?: number;
  status?: string;
  q?: string;
  order_number?: string;
  payment_mode?: string;
}

export async function fetchBusinessOrders(
  businessId: string,
  params?: BusinessOrdersParams,
): Promise<SellerOrdersResponse> {
  return api.get<SellerOrdersResponse>(`/businesses/${businessId}/orders`, { params });
}

export async function fetchBusinessOrderByNumber(businessId: string, orderNumber: string): Promise<SellerOrderDetailResponse> {
  return api.get<SellerOrderDetailResponse>(`/businesses/${businessId}/orders/${orderNumber}`);
}

// ─── Deliveries ───

export interface BusinessDeliveriesParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}

export async function fetchBusinessDeliveries(
  businessId: string,
  params?: BusinessDeliveriesParams,
): Promise<SellerOrdersResponse> {
  return api.get<SellerOrdersResponse>(`/businesses/${businessId}/deliveries`, { params });
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
