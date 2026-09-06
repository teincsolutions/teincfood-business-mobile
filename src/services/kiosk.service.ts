import { api } from './api';
import type { SellerOrder, SellerOrdersResponse, BusinessDelivery, DeliveryRider } from '@/types/api';

export async function fetchKioskOrders(businessId?: string): Promise<SellerOrdersResponse> {
  if (businessId) {
    return api.get<SellerOrdersResponse>(`/businesses/${businessId}/orders`);
  }
  return api.get<SellerOrdersResponse>('/orders');
}

export async function acceptKioskOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/accept`);
}

export async function rejectKioskOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/reject`);
}

export async function startPreparingKioskOrder(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/start-preparing`);
}

export async function markKioskOrderReady(orderId: string): Promise<{ data: SellerOrder }> {
  return api.post(`/orders/${orderId}/ready-for-delivery`);
}

export async function confirmKioskPickup(deliveryId: string): Promise<{ data: BusinessDelivery }> {
  return api.post(`/deliveries/${deliveryId}/confirm-pickup`);
}

export async function fetchAvailableRiders(businessId?: string): Promise<{ data: DeliveryRider[] }> {
  return api.get('/deliveries/available-riders', {
    params: { business_id: businessId },
  });
}

export async function assignKioskOrderToRider(orderId: string, riderId: string): Promise<{ data: BusinessDelivery }> {
  return api.post('/deliveries/assign', { order_id: orderId, rider_id: riderId });
}
