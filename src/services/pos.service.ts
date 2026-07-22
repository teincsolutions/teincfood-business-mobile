import { api } from './api';
import type { POSOrderCreateRequest, POSOrderCreateResponse, POSOrderPreviewRequest, POSOrderPreviewResponse } from '@/types/pos.types';
import type { SellerOrdersResponse } from '@/types/api/seller.api';

export async function createPOSOrder(
  businessId: string,
  data: POSOrderCreateRequest,
): Promise<POSOrderCreateResponse> {
  return api.post<POSOrderCreateResponse>(
    `/businesses/${businessId}/pos/orders`,
    data,
  );
}

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
