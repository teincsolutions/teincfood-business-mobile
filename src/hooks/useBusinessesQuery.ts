import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessSummary } from '@/types/business.model';
import * as businessService from '@/services/business.service';
import { useBusinessStore } from '@/stores/business.store';
import { useAuthStore } from '@/stores/auth.store';

/** Prefix used for invalidation (matches every account-scoped list). */
export const BUSINESSES_QUERY_KEY = ['businesses', 'mine'];

/** Query key includes the account id as a second isolation boundary. */
export function businessesQueryKey(userId: string | null) {
  return ['businesses', 'mine', userId ?? 'anonymous'] as const;
}

export function useBusinessesQuery() {
  const setBusinesses = useBusinessStore((s) => s.setBusinesses);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const query = useQuery({
    queryKey: businessesQueryKey(userId),
    queryFn: async () => {
      const res = await businessService.fetchMyBusinesses();
      return (res.data || []) as BusinessSummary[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Sync query data to Zustand store — always refresh activeBusiness with
  // fresh API data so fields like business_number and is_open are present.
  // An empty result must clear the old active business; otherwise a brand-new
  // account can keep operating on the previous user's business.
  useEffect(() => {
    if (!Array.isArray(query.data)) return;
    setBusinesses(query.data);
    const store = useBusinessStore.getState();
    const currentId = store.activeBusiness?.id;
    const fresh = currentId
      ? query.data.find((b) => b.id === currentId)
      : query.data.find((b) => b.isDefault) ?? query.data[0];
    store.setActiveBusiness((fresh ?? null) as any);
  }, [query.data, setBusinesses, userId]);

  return query;
}
