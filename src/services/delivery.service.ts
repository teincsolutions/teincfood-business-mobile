import { api } from './api';
import type { RiderDeliveryDetailResponse } from '@/types/api';

export async function fetchDeliveryDetail(deliveryId: string): Promise<RiderDeliveryDetailResponse> {
  return api.get<RiderDeliveryDetailResponse>(`/deliveries/${deliveryId}`);
}
