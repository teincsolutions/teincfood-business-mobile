import { useQuery } from '@tanstack/react-query';
import * as deliveryService from '@/services/delivery.service';

export const DELIVERY_KEYS = {
  all: ['delivery'] as const,
  detail: (id: string) => [...DELIVERY_KEYS.all, 'detail', id] as const,
};

export function useDeliveryDetailQuery(deliveryId: string, enabled = true) {
  return useQuery({
    queryKey: DELIVERY_KEYS.detail(deliveryId),
    queryFn: () => deliveryService.fetchDeliveryDetail(deliveryId),
    enabled: enabled && Boolean(deliveryId),
  });
}
