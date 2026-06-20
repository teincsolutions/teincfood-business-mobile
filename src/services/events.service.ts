import { phoenixSocket } from './phoenix-socket.service';

type EventCallback = (event: Record<string, unknown>) => void;

class EventsService {
  private refCount = 0;
  private topic: string | null = null;
  private joined = false;
  private lastSequence = 0;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private wildcardListeners: Set<EventCallback> = new Set();
  private frameHandlerUnsub: (() => void) | null = null;

  connect(userId: string): () => void {
    this.refCount++;
    const topic = `events:${userId}`;

    if (this.refCount === 1) {
      this.topic = topic;

      this.frameHandlerUnsub = phoenixSocket.onFrame(topic, ([_joinRef, _ref, _topic, event, payload]) => {
        this.recordSequence(payload as Record<string, unknown>);
        const typeListeners = this.listeners.get(event);
        if (typeListeners) {
          typeListeners.forEach((cb) => cb(payload as Record<string, unknown>));
        }
        this.wildcardListeners.forEach((cb) => cb(payload as Record<string, unknown>));
      });

      const joinPayload = this.lastSequence > 0 ? { last_sequence: this.lastSequence } : {};

      phoenixSocket.connect()
        .then(() => phoenixSocket.joinChannel(topic, joinPayload))
        .then(() => {
          this.joined = true;
        })
        .catch(() => {});
    }

    let disconnected = false;
    return () => {
      if (disconnected) return;
      disconnected = true;

      this.refCount = Math.max(0, this.refCount - 1);

      if (this.refCount === 0) {
        if (this.topic && this.joined) {
          phoenixSocket.leaveChannel(this.topic);
        }
        this.frameHandlerUnsub?.();
        this.frameHandlerUnsub = null;
        this.joined = false;
        this.topic = null;
      }
    };
  }

  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  onAny(callback: EventCallback): () => void {
    this.wildcardListeners.add(callback);
    return () => {
      this.wildcardListeners.delete(callback);
    };
  }

  isConnected(): boolean {
    return this.joined && phoenixSocket.isConnected();
  }

  private recordSequence(payload: Record<string, unknown>): void {
    const seq = payload?.["_sequence"];
    if (typeof seq === "number" && seq > this.lastSequence) {
      this.lastSequence = seq;
    }
  }
}

export const eventsService = new EventsService();
