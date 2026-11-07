import { api } from './api';
import type { WalletBalanceResponse, WalletHistoryResponse } from '@teincfood/core';

export async function fetchAllBalances(): Promise<WalletBalanceResponse> {
  return api.get<WalletBalanceResponse>('/wallet/balance');
}

export async function fetchBusinessWalletBalance(businessId: string): Promise<WalletBalanceResponse> {
  return api.get<WalletBalanceResponse>('/wallet/balance', {
    params: { business_id: businessId, type: 'business' },
  });
}

export async function withdrawFromWallet(params: {
  businessId: string;
  amountMinor: number;
  momoNumber?: string;
  provider?: string;
}): Promise<{
  data: {
    transaction_id: string;
    reference: string;
    amount_minor: number;
    fee_minor: number;
    total_debit_minor: number;
    status: string;
    message: string;
  };
}> {
  return api.post('/wallet/withdraw', {
    business_id: params.businessId,
    amount_minor: params.amountMinor,
    ...(params.momoNumber ? { momo_number: params.momoNumber } : {}),
    ...(params.provider ? { provider: params.provider } : {}),
  });
}

export async function requestTaxCertificate(params: {
  businessId: string;
  certificateUrl: string;
  notes?: string;
}): Promise<{
  data: {
    tax_certificate_status: string;
    tax_certificate_url: string;
    balance_minor: number;
    message: string;
  };
}> {
  return api.post('/wallet/tax-certificate', {
    business_id: params.businessId,
    certificate_url: params.certificateUrl,
    ...(params.notes ? { notes: params.notes } : {}),
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
