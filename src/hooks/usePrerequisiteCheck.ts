import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useHasBusiness() {
  return useQuery({
    queryKey: ['businesses', 'check'],
    queryFn: async () => {
      try {
        const data: unknown = await api.get('/v1/seller/businesses');
        if (Array.isArray(data)) return (data as any[]).length > 0;
        const arr = (data as any)?.data;
        return Array.isArray(arr) && arr.length > 0;
      } catch {
        return false;
      }
    },
    staleTime: 60_000,
  });
}

export function useHasRiderProfile() {
  return useQuery({
    queryKey: ['rider', 'profile', 'check'],
    queryFn: async () => {
      try {
        await api.get('/v1/rider/profile');
        return true;
      } catch {
        return false;
      }
    },
    staleTime: 60_000,
  });
}
