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

  // Sync query data to Zustand store
  useEffect(() => {
    if (!query.data) return;
    setBusinesses(query.data);
    if (query.data.length > 0) {
      const store = useBusinessStore.getState();
      if (!store.activeBusiness) {
        store.setActiveBusiness(query.data[0] as any);
      }
    }
  }, [query.data]);

  return query;
}
