import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export function useTrackOrderQuery(orderId: string) {
  return useQuery({
    queryKey: ['track-order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`),
    enabled: Boolean(orderId),
  });
}
