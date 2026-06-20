import { api } from './api';
import type { KioskOrder } from '@/models/kiosk.model';

export interface AvailableRider {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'bicycle' | 'motorcycle' | 'car';
  plateNumber: string;
  rating: number;
  distanceKm: number;
  isOnline: boolean;
  avatarUrl?: string;
}

export interface KioskOrdersResponse {
  pendingOrders: KioskOrder[];
  preparingOrders: KioskOrder[];
  readyOrders: KioskOrder[];
}

export interface KioskOrderActionResponse {
  success: boolean;
  message: string;
  order?: KioskOrder;
}

export async function fetchKioskOrders(): Promise<KioskOrdersResponse> {
  return api.get('/v1/seller/kiosk/orders');
}

export async function acceptKioskOrder(orderId: string): Promise<KioskOrderActionResponse> {
  return api.post(`/v1/seller/kiosk/orders/${orderId}/accept`);
}

export async function rejectKioskOrder(orderId: string): Promise<KioskOrderActionResponse> {
  return api.post(`/v1/seller/kiosk/orders/${orderId}/reject`);
}

export async function markKioskOrderReady(orderId: string): Promise<KioskOrderActionResponse> {
  return api.patch(`/v1/seller/kiosk/orders/${orderId}/ready`);
}

export async function fetchAvailableRiders(): Promise<AvailableRider[]> {
  return api.get('/v1/seller/kiosk/riders');
}

export async function assignKioskOrderToRider(
  orderId: string,
  riderId: string
): Promise<KioskOrderActionResponse> {
  return api.post(`/v1/seller/kiosk/orders/${orderId}/assign`, { riderId });
}
