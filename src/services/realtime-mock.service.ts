import { useNotificationStore } from '@/stores/notification.store';
import type {
  ChatAckPayload,
  ChatMessagePayload,
  ChatSendPayload,
  EventEnvelope,
} from './backend-contracts.types';

const REGION = 'GH';
let sequence = 1000;

function nextEventId() {
  sequence += 1;
  return { eventId: `evt_${sequence}`, sequence };
}

function envelope<T>(type: string, payload: T, extras?: Partial<EventEnvelope<T>>): EventEnvelope<T> {
  const next = nextEventId();
  return {
    eventId: next.eventId,
    sequence: next.sequence,
    occurredAt: new Date().toISOString(),
    type,
    region: REGION,
    version: 1,
    orderId: null,
    chatId: null,
    payload,
    ...extras,
  };
}

export type ChatRealtimeHandler = (event: EventEnvelope) => void;

class MockChatSocket {
  private handlers = new Set<ChatRealtimeHandler>();
  private connected = false;

  connect(token: string, _lastSequence?: number) {
    this.connected = Boolean(token);
    if (!this.connected) return;

    const hello = envelope('hello_ack', { connected: true });
    this.emit(hello);
  }

  disconnect() {
    this.connected = false;
  }

  subscribe(handler: ChatRealtimeHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  send(payload: ChatSendPayload, senderId: string) {
    if (!this.connected) return;

    const serverMessageId = `msg_${Date.now()}`;
    const ackPayload: ChatAckPayload = {
      clientMessageId: payload.clientMessageId,
      serverMessageId,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    this.emit(envelope('chat.ack', ackPayload, { chatId: payload.chatId }));

    const me: ChatMessagePayload = {
      messageId: serverMessageId,
      senderId,
      text: payload.text,
    };
    this.emit(envelope('chat.message', me, { chatId: payload.chatId }));

    // Simulate a seller reply after a short delay.
    setTimeout(() => {
      if (!this.connected) return;
      const reply: ChatMessagePayload = {
        messageId: `msg_${Date.now()}_seller`,
        senderId: payload.chatId,
        text: 'Thanks! We received your message and will update your order shortly.',
      };
      this.emit(envelope('chat.message', reply, { chatId: payload.chatId }));
    }, 900);
  }

  typing(chatId: string, senderId: string, isTyping: boolean) {
    if (!this.connected) return;
    this.emit(
      envelope(
        'chat.typing',
        {
          senderId,
          isTyping,
        },
        { chatId }
      )
    );
  }

  markRead(chatId: string, messageId: string, readerId: string) {
    if (!this.connected) return;
    this.emit(
      envelope(
        'chat.read',
        {
          messageId,
          readerId,
        },
        { chatId }
      )
    );
  }

  private emit(event: EventEnvelope) {
    this.handlers.forEach((handler) => handler(event));
  }
}

export const mockChatSocket = new MockChatSocket();

export type NotificationStreamHandler = (event: EventEnvelope) => void;

export function subscribeNotificationStream(handler: NotificationStreamHandler) {
  const keepAlive = setInterval(() => {
    handler(envelope('stream.keepalive', { ok: true }));
  }, 25000);

  const randomUpdate = setInterval(() => {
    const pending = useNotificationStore.getState().notifications.filter((n) => !n.read);
    if (pending.length === 0) return;

    const latest = pending[0];
    handler(
      envelope('notification.created', {
        id: latest.id,
        title: latest.title,
        message: latest.message,
      })
    );
  }, 18000);

  return () => {
    clearInterval(keepAlive);
    clearInterval(randomUpdate);
  };
}
