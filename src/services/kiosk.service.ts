import { api } from './api';
import type { KioskOrder, KioskOrdersResponse } from '@/models/api';

export async function fetchKioskOrders(): Promise<KioskOrdersResponse> {
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

export async function confirmKioskPickup(orderId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${orderId}/confirm-pickup`);
}

export async function fetchAvailableRiders(): Promise<{ data: Record<string, unknown>[] }> {
  return api.get('/business/riders');
}

export async function assignKioskOrderToRider(orderId: string, riderId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post('/deliveries/assign', { delivery_id: orderId, rider_id: riderId });
}
