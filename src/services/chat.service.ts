import { useChatStore } from '@/stores/chat.store';
import { phoenixSocket } from './phoenix-socket.service';
import type { ChatMessagePayload, ConnectionState, PhoenixV2Frame } from '@/types/chat';

type ChatEventCallback = (msg: ChatMessagePayload) => void;
type TypingEventCallback = (data: { user_id: string; is_typing: boolean }) => void;

class ChatService {
  private channels: Map<string, Set<ChatEventCallback>> = new Map();
  private typingCallbacks: Map<string, Set<TypingEventCallback>> = new Map();
  private topicUnsubscribers: Map<string, () => void> = new Map();
  private stateUnsub: (() => void) | null = null;

  connect(): Promise<void> {
    this.stateUnsub?.();
    this.stateUnsub = phoenixSocket.onConnectionStateChange((state) => {
      if (state === 'connected') {
        this.flushOutbox();
      }
    });
    return phoenixSocket.connect();
  }

  disconnect(): void {
    this.channels.clear();
    this.typingCallbacks.clear();
    this.topicUnsubscribers.forEach((unsub) => unsub());
    this.topicUnsubscribers.clear();
    this.stateUnsub?.();
    this.stateUnsub = null;
    phoenixSocket.disconnect();
  }

  retryConnection(): void {
    phoenixSocket.retryConnection();
  }

  onConnectionStateChange(fn: (state: ConnectionState) => void): () => void {
    return phoenixSocket.onConnectionStateChange(fn);
  }

  getConnectionState(): ConnectionState {
    return phoenixSocket.getConnectionState();
  }

  async joinChannel(topic: string): Promise<Record<string, unknown>> {
    const result = await phoenixSocket.joinChannel(topic);
    this.ensureFrameHandler(topic);
    return result;
  }

  leaveChannel(topic: string): void {
    this.channels.delete(topic);
    this.typingCallbacks.delete(topic);
    this.topicUnsubscribers.get(topic)?.();
    this.topicUnsubscribers.delete(topic);
    phoenixSocket.leaveChannel(topic);
  }

  private ensureFrameHandler(topic: string): void {
    if (this.topicUnsubscribers.has(topic)) return;

    const unsub = phoenixSocket.onFrame(topic, ([_joinRef, _ref, _topic, event, payload]) => {
      if (event === 'new_message') {
        const raw = payload;
        const chatPayload: ChatMessagePayload = {
          id: raw.id as string | undefined,
          sender_id: (raw.user_id ?? raw.sender_id) as string,
          text: (raw.content ?? raw.text ?? '') as string,
          sent_at: raw.sent_at as string | undefined,
          inserted_at: raw.inserted_at as string | undefined,
          conversation_id: raw.conversation_id as string | undefined,
          channel: raw.channel as ChatMessagePayload['channel'],
          status: raw.status as string | undefined,
          message_type: raw.message_type as string | undefined,
          direction: raw.direction as string | undefined,
          ...raw,
        } as ChatMessagePayload;

        const callbacks = this.channels.get(topic);
        if (callbacks) {
          callbacks.forEach((cb) => cb(chatPayload));
        }
      } else if (event === 'typing') {
        const typingData = payload as { user_id: string; is_typing: boolean };
        const callbacks = this.typingCallbacks.get(topic);
        if (callbacks) {
          callbacks.forEach((cb) => cb(typingData));
        }
      }
    });

    this.topicUnsubscribers.set(topic, unsub);
  }

  onMessage(topic: string, callback: ChatEventCallback): () => void {
    if (!this.channels.has(topic)) {
      this.channels.set(topic, new Set());
    }
    this.channels.get(topic)!.add(callback);

    return () => {
      this.channels.get(topic)?.delete(callback);
    };
  }

  onTyping(topic: string, callback: TypingEventCallback): () => void {
    if (!this.typingCallbacks.has(topic)) {
      this.typingCallbacks.set(topic, new Set());
    }
    this.typingCallbacks.get(topic)!.add(callback);

    return () => {
      this.typingCallbacks.get(topic)?.delete(callback);
    };
  }

  async sendMessage(topic: string, text: string, localId: string): Promise<Record<string, unknown>> {
    return phoenixSocket.pushWithReply(topic, 'new_message', {
      body: text,
      message: text,
      client_message_id: localId,
    });
  }

  sendTyping(topic: string, isTyping: boolean): void {
    this.sendRaw(topic, 'typing', { is_typing: isTyping });
  }

  private sendRaw(topic: string, event: string, payload: Record<string, unknown>): void {
    if (phoenixSocket.socket?.readyState === WebSocket.OPEN) {
      const frame: PhoenixV2Frame = [null, null, topic, event, payload];
      phoenixSocket.socket.send(JSON.stringify(frame));
    }
  }

  async getMessages(topic: string, limit = 50): Promise<ChatMessagePayload[]> {
    const response = await phoenixSocket.pushWithReply(topic, 'get_messages', { limit });
    const messages = Array.isArray(response.messages)
      ? (response.messages as Array<Record<string, unknown>>)
      : [];

    return messages.map((raw) => ({
      id: raw.id as string | undefined,
      sender_id: (raw.sender_id ?? raw.user_id ?? '') as string,
      text: (raw.content ?? raw.text ?? '') as string,
      sent_at: (raw.sent_at ?? raw.inserted_at) as string | undefined,
      inserted_at: raw.inserted_at as string | undefined,
      conversation_id: raw.conversation_id as string | undefined,
      channel: raw.channel as ChatMessagePayload['channel'],
      status: raw.status as string | undefined,
      ...raw,
    })) as ChatMessagePayload[];
  }

  getSupportChatTopic(userId: string): string {
    return `chat:support:${userId}`;
  }

  getOrderChatTopic(orderId: string, participantA: string, participantB: string): string {
    const sorted = [participantA, participantB].sort();
    return `chat:pair:order_${orderId}_${sorted[0]}_${sorted[1]}`;
  }

  private async flushOutbox(): Promise<void> {
    const store = useChatStore.getState();
    const pending = store.getPendingOutbox();

    for (const msg of pending) {
      store.updateOutboxStatus(msg.id, 'sending');

      try {
        const reply = await this.sendMessage(msg.topic, msg.text, msg.id);
        const serverId = (reply?.id as string) ?? msg.id;

        store.updateOutboxStatus(msg.id, 'sent');
        store.updateMessageStatus(msg.conversationId, msg.id, 'sent', serverId);

        setTimeout(() => store.removeFromOutbox(msg.id), 1000);
      } catch {
        store.updateOutboxStatus(msg.id, 'failed');
      }
    }
  }

  isConnected(): boolean {
    return phoenixSocket.isConnected();
  }

  hasJoined(topic: string): boolean {
    return phoenixSocket.hasJoined(topic);
  }
}

export const chatService = new ChatService();
