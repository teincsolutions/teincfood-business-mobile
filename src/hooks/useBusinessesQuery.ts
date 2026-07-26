import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessSummary } from '@/types/business.model';
import * as businessService from '@/services/business.service';
import { useBusinessStore } from '@/stores/business.store';

export const BUSINESSES_QUERY_KEY = ['businesses', 'mine'];

export function useBusinessesQuery() {
  const setBusinesses = useBusinessStore((s) => s.setBusinesses);

  const query = useQuery({
    queryKey: BUSINESSES_QUERY_KEY,
    queryFn: async () => {
      const res = await businessService.fetchMyBusinesses();
      return (res.data || []) as BusinessSummary[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Sync query data to Zustand store — always refresh activeBusiness
  // with fresh API data so fields like business_number, is_open are present.
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    setBusinesses(query.data);
    const store = useBusinessStore.getState();
    const currentId = store.activeBusiness?.id;
    const fresh = currentId
      ? query.data.find((b) => b.id === currentId)
      : query.data[0];
    if (fresh) {
      store.setActiveBusiness(fresh as any);
    }
  }, [query.data]);

  return query;
}
