import { api } from './api';
import type { POSOrderPreviewRequest, POSOrderPreviewResponse } from '@/types/pos.types';
import type { SellerOrdersResponse } from '@/types/api/seller.api';

// NOTE: no createPOSOrder — order creation has exactly one path:
// createLocalOrder in @teincfood/core (SQLite + sync_jobs + hours gate).

export async function fetchPOSOrderPreview(
  businessId: string,
  data: POSOrderPreviewRequest,
): Promise<POSOrderPreviewResponse> {
  return api.post<POSOrderPreviewResponse>(
    `/businesses/${businessId}/pos/orders/preview`,
    data,
  );
}

export async function fetchBusinessOrders(
  businessId: string,
  params?: Record<string, string>,
): Promise<SellerOrdersResponse> {
  return api.get<SellerOrdersResponse>(
    `/businesses/${businessId}/orders`,
    { params },
  );
}
