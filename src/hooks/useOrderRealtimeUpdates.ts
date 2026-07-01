import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { orderEventsService } from '@/services/order-events.service';

/**
 * Subscribe to real-time order events and invalidate all queries
 * under the given root key prefix (e.g. ['seller'], ['fleet'], ['kiosk']).
 * This causes React Query to refetch any active screens on that domain.
 */
export function useOrderRealtimeUpdates(rootKey: string[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = orderEventsService.onOrderUpdates((event) => {
      queryClient.invalidateQueries({ queryKey: rootKey });
      if (event.order_id) {
        const specificKey = [...rootKey, 'order', event.order_id];
        queryClient.invalidateQueries({ queryKey: specificKey });
      }
    });
    return unsub;
  }, [queryClient]);
}
