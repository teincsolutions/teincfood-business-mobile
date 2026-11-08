import { api } from './api';
import type { SellerOrder, SellerOrdersResponse, BusinessDelivery } from '@teincfood/core';

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

/** Shape returned by `GET /deliveries/available-riders` (flattened by the API). */
export interface AvailableRider {
  id: string;
  rider_number?: string | null;
  name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  rating?: number | null;
  vehicle_type?: string | null;
  status?: string | null;
  is_online?: boolean;
  is_active?: boolean;
  kyc_status?: string | null;
  license_number?: string | null;
  user?: {
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null;
  vehicle?: {
    id: string;
    type: string | null;
    plate_number?: string | null;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    year?: number | null;
  } | null;
}

export interface AvailableRidersResponse {
  data: AvailableRider[];
}

export async function fetchAvailableRiders(
  businessId?: string,
): Promise<AvailableRidersResponse> {
  return api.get<AvailableRidersResponse>('/deliveries/available-riders', {
    params: { business_id: businessId },
  });
}

export async function assignKioskOrderToRider(
  orderId: string,
  riderId: string,
  idempotencyKey?: string,
): Promise<{ data: BusinessDelivery }> {
  return api.post('/deliveries/assign', {
    order_id: orderId,
    rider_id: riderId,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
  });
}
