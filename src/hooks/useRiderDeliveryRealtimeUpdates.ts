import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { orderEventsService } from '@/services/order-events.service';

const RIDER_EVENTS = [
  'delivery.assigned',
  'delivery.status_changed',
  'delivery.pickup_confirmed',
  'order.status_changed',
];

/**
 * Subscribe to real-time delivery events and invalidate rider queries.
 * Rider screens (dashboard, deliveries list, delivery detail) get live updates
 * when a delivery is assigned, status changes, or pickup is confirmed.
 */
export function useRiderDeliveryRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = orderEventsService.onOrderUpdates((event) => {
      if (!RIDER_EVENTS.includes(event.type)) return;
      queryClient.invalidateQueries({ queryKey: ['rider'] });
    });
    return unsub;
  }, [queryClient]);
}
