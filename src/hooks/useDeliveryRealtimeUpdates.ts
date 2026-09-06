import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { orderEventsService } from '@teincfood/core';

/**
 * Subscribe to real-time delivery events and invalidate queries
 * under the given root key prefix (e.g. ['fleet'], ['kiosk']).
 * Delivery events include: delivery.assigned, delivery.status_changed,
 * delivery.pickup_confirmed.
 */
export function useDeliveryRealtimeUpdates(rootKey: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = orderEventsService.onOrderUpdates((event) => {
      if (!event.type?.startsWith('delivery.')) return;
      queryClient.invalidateQueries({ queryKey: rootKey });
      if (event.order_id) {
        queryClient.invalidateQueries({
          queryKey: [...rootKey, 'delivery', event.order_id],
        });
      }
    });
    return unsub;
  }, [queryClient]);
}
