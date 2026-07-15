import { api } from './api';
import type { KioskOrder, KioskOrdersResponse } from '@/types/api';

export interface AvailableRider {
  id: string;
  name: string;
  phone: string | null;
  vehicle_type: string | null;
  rating: number | null;
  distance: number | null;
}

export async function fetchKioskOrders(businessId?: string): Promise<KioskOrdersResponse> {
  if (businessId) {
    return api.get<KioskOrdersResponse>(`/businesses/${businessId}/orders`);
  }
  return api.get<KioskOrdersResponse>('/orders');
}

export async function acceptKioskOrder(orderId: string): Promise<{ data: KioskOrder }> {
  return api.post(`/orders/${orderId}/accept`);
}

export async function rejectKioskOrder(orderId: string): Promise<{ data: KioskOrder }> {
  return api.post(`/orders/${orderId}/reject`);
}

export async function startPreparingKioskOrder(orderId: string): Promise<{ data: KioskOrder }> {
  return api.post(`/orders/${orderId}/start-preparing`);
}

export async function markKioskOrderReady(orderId: string): Promise<{ data: KioskOrder }> {
  return api.post(`/orders/${orderId}/ready-for-delivery`);
}

export async function confirmKioskPickup(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${deliveryId}/confirm-pickup`);
}

export async function fetchAvailableRiders(businessId?: string): Promise<{ data: Record<string, unknown>[] }> {
  return api.get('/deliveries/available-riders', {
    params: { business_id: businessId },
  });
}

export async function assignKioskOrderToRider(orderId: string, riderId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post('/deliveries/assign', { order_id: orderId, rider_id: riderId });
}
