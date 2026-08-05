import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { orderEventsService } from '@/services/order-events.service';
import { orderSnapshotsService } from '@/sync/order-snapshots.service';
import { getAppInstanceId } from '@/services/devices.service';
import { generateEventId } from '@/utils/uuid';
import type { DomainEvent } from '@/sync/types';

/**
 * Subscribe to real-time order events and invalidate all queries
 * under the given root key prefix (e.g. ['seller'], ['fleet'], ['kiosk']).
 * This causes React Query to refetch any active screens on that domain.
 * Each event is also persisted to the durable offline read model so order
 * history and states survive a restart while offline.
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

      const payload = { ...event } as Record<string, unknown>;
      const domainEvent: DomainEvent = {
        event_id: (payload.event_id as string) ?? generateEventId(),
        event_type: event.type,
        event_version: (payload.event_version as string) ?? '1.0',
        timestamp: (payload.timestamp as string) ?? new Date().toISOString(),
        device_id: (payload.device_id as string) ?? getAppInstanceId(),
        user_id: (payload.user_id as string) ?? 'system',
        entity_id: event.order_id ?? '',
        payload,
      };
      orderSnapshotsService.persistOrderEvent(domainEvent, 'cloud').catch(() => {});
    });
    return unsub;
  }, [queryClient]);
}
