import { api } from './api';
import type { WalletBalanceResponse, WalletHistoryResponse } from '@/types/api';

export async function fetchWalletBalance(businessId?: string): Promise<WalletBalanceResponse> {
  return api.get<WalletBalanceResponse>('/wallet/balance', {
    params: {
      ...(businessId ? { business_id: businessId, type: 'business' } : {}),
    },
  });
}

export async function fetchWalletHistory(
  params: { businessId?: string; page?: number; pageSize?: number } = {},
): Promise<WalletHistoryResponse> {
  const { businessId, page, pageSize } = params;
  return api.get<WalletHistoryResponse>('/wallet/history', {
    params: {
      ...(page ? { page } : {}),
      ...(pageSize ? { page_size: pageSize } : {}),
      ...(businessId ? { business_id: businessId, type: 'business' } : {}),
    },
  });
}
