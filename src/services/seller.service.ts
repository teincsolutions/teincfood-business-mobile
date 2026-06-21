import { api } from './api';

// ─── Orders ───

export async function fetchSellerOrders(): Promise<any> {
  return api.get('/orders');
}

export async function fetchSellerOrder(orderId: string): Promise<any> {
  return api.get(`/orders/${orderId}`);
}

export async function createOrder(data: any): Promise<any> {
  return api.post('/orders', data);
}

export async function deleteOrder(orderId: string): Promise<any> {
  return api.delete(`/orders/${orderId}`);
}

// ─── Order Actions ───

export async function acceptOrder(orderId: string): Promise<any> {
  return api.post(`/orders/${orderId}/accept`);
}

export async function rejectOrder(orderId: string): Promise<any> {
  return api.post(`/orders/${orderId}/reject`);
}

export async function startPreparingOrder(orderId: string): Promise<any> {
  return api.post(`/orders/${orderId}/start-preparing`);
}

export async function markOrderReady(orderId: string): Promise<any> {
  return api.post(`/orders/${orderId}/ready-for-delivery`);
}

export async function cancelOrder(orderId: string): Promise<any> {
  return api.post(`/orders/${orderId}/cancel`);
}

export async function cancelOrderDeliveryFailure(orderId: string): Promise<any> {
  return api.post(`/orders/${orderId}/cancel-delivery-failure`);
}

// ─── Business Orders ───

export async function fetchBusinessOrders(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/orders`);
}

export async function fetchBusinessOrderByNumber(businessId: string, orderNumber: string): Promise<any> {
  return api.get(`/businesses/${businessId}/orders/${orderNumber}`);
}

// ─── Legacy aliases (kept for backward compat with hooks) ───

export async function updateOrderStatus(orderId: string, status: string): Promise<any> {
  return api.post(`/orders/${orderId}/${status}`);
}

export async function markOrderDelivered(orderId: string): Promise<any> {
  return api.post(`/deliveries/${orderId}/delivered`);
}
