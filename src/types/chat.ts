export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'queued';

export interface StoredMessage {
  id: string;
  localId: string;
  conversationId: string;
  senderId: string;
  text: string;
  status: ChatMessageStatus;
  channel: 'app' | 'whatsapp';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface OutboundMessage {
  id: string;
  topic: string;
  conversationId: string;
  text: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  queuedAt: number;
}

export interface ChatMessagePayload {
  id?: string;
  sender_id: string;
  text: string;
  content?: string;
  user_id?: string;
  sent_at?: string;
  inserted_at?: string;
  conversation_id?: string;
  channel?: 'app' | 'whatsapp';
  status?: string;
  message_type?: string;
  direction?: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

/** Phoenix V2 WebSocket frame: [joinRef, ref, topic, event, payload] */
export type PhoenixV2Frame = [
  joinRef: string | null,
  ref: string | null,
  topic: string,
  event: string,
  payload: Record<string, unknown>,
];

export interface PhoenixOutbound {
  topic: string;
  event: string;
  payload: Record<string, unknown>;
  ref?: string;
  joinRef?: string | null;
}
