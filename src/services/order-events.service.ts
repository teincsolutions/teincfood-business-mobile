import { eventsService } from './events.service';

export interface OrderEventPayload {
  type: string;
  order_id?: string;
  status?: string;
  to_status?: string;
  [key: string]: unknown;
}

type OrderEventHandler = (payload: OrderEventPayload) => void;

const ORDER_RELATED_EVENTS = [
  'order.status_changed',
  'order.created',
  'delivery.assigned',
  'delivery.status_changed',
  'delivery.pickup_confirmed',
  'payment.completed',
  'payment.failed',
  'rider.location_updated',
];

class OrderEventsService {
  onOrderUpdates(callback: OrderEventHandler): () => void {
    const unsubscribers: Array<() => void> = [];

    console.log('[OrderEventsService] subscribing to events', { events: ORDER_RELATED_EVENTS });

    for (const eventType of ORDER_RELATED_EVENTS) {
      unsubscribers.push(
        eventsService.on(eventType, (data) => {
          const payload: OrderEventPayload = {
            type: eventType,
            order_id: data.order_id as string | undefined,
            status: data.to_status as string | undefined,
            ...data,
          };
          console.log('[OrderEventsService] dispatching event', { eventType, payload });
          callback(payload);
        }),
      );
    }

    return () => {
      console.log('[OrderEventsService] unsubscribing from all events');
      unsubscribers.forEach((unsub) => unsub());
    };
  }
}

export const orderEventsService = new OrderEventsService();
