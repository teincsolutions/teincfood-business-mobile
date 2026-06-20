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
];

class OrderEventsService {
  onOrderUpdates(callback: OrderEventHandler): () => void {
    const unsubscribers: Array<() => void> = [];

    for (const eventType of ORDER_RELATED_EVENTS) {
      unsubscribers.push(
        eventsService.on(eventType, (data) => {
          callback({
            type: eventType,
            order_id: data.order_id as string | undefined,
            status: data.to_status as string | undefined,
            ...data,
          });
        }),
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }
}

export const orderEventsService = new OrderEventsService();
