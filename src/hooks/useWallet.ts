import { useQuery } from '@tanstack/react-query';
import * as walletService from '@/services/wallet.service';
import { useBusinessStore } from '@/stores/business.store';

const WALLET_KEYS = {
  all: ['wallet'] as const,
  balance: (businessId?: string) => [...WALLET_KEYS.all, 'balance', businessId] as const,
  history: (businessId?: string) => [...WALLET_KEYS.all, 'history', businessId] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

export function useWalletBalanceQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: WALLET_KEYS.balance(businessId),
    queryFn: () => walletService.fetchWalletBalance(businessId),
    enabled,
    staleTime: 30000,
  });
}

export function useWalletHistoryQuery(page = 1, pageSize = 20, enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: [...WALLET_KEYS.history(businessId), page, pageSize],
    queryFn: () => walletService.fetchWalletHistory({ businessId, page, pageSize }),
    enabled,
    staleTime: 30000,
  });
}
