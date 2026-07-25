import { api } from './api';
import type { BusinessDeliveriesResponse, RiderDeliveryDetailResponse } from '@/types/api';

export interface BusinessDeliveriesParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
}

export async function fetchBusinessDeliveries(
  businessId: string,
  params?: BusinessDeliveriesParams,
): Promise<BusinessDeliveriesResponse> {
  return api.get<BusinessDeliveriesResponse>(`/businesses/${businessId}/deliveries`, { params });
}

export async function fetchDeliveryDetail(deliveryId: string): Promise<RiderDeliveryDetailResponse> {
  return api.get<RiderDeliveryDetailResponse>(`/deliveries/${deliveryId}`);
}
