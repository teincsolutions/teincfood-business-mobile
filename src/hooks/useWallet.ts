import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import * as walletService from '@/services/wallet.service';
import { useBusinessStore } from '@/stores/business.store';

const WALLET_KEYS = {
  all: ['wallet'] as const,
  balance: (scope?: string) => [...WALLET_KEYS.all, 'balance', scope] as const,
  history: (scope?: string) => [...WALLET_KEYS.all, 'history', scope] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

export function useAllBalancesQuery(enabled = true) {
  return useQuery({
    queryKey: WALLET_KEYS.balance('all'),
    queryFn: () => walletService.fetchAllBalances(),
    enabled,
    staleTime: 30000,
  });
}

export function useBusinessWalletBalanceQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: WALLET_KEYS.balance(businessId),
    queryFn: () => walletService.fetchBusinessWalletBalance(businessId!),
    enabled: enabled && Boolean(businessId),
    staleTime: 30000,
  });
}

export function useWalletHistoryQuery(enabled = true) {
  const businessId = useBusinessId();
  return useInfiniteQuery({
    queryKey: [...WALLET_KEYS.history(businessId)],
    queryFn: ({ pageParam = 1 }) =>
      walletService.fetchWalletHistory({
        businessId,
        page: pageParam,
        pageSize: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      if (pagination.page < pagination.total_pages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      entries: data.pages.flatMap((p) => p.data.entries),
    }),
    enabled,
    staleTime: 30000,
  });
}
