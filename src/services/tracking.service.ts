import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

export function useTrackOrderQuery(orderId: string) {
  return useQuery({
    queryKey: ['track-order', orderId],
    queryFn: () => mockBackend.getTrackOrder(orderId),
    enabled: Boolean(orderId),
  });
}
