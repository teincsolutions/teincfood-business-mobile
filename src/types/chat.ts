// Re-exports from @teincfood/chat-client
export type {
  MessageStatus,
  Message,
  ChatMessagePayload,
} from '@teincfood/chat-client';

// Local types used by phoenix-socket.service.ts
export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export type PhoenixV2Frame = [
  '0' | '1' | '2' | '3' | '4' | '6' | '7' | '8' | '9',
  string,
  string,
  string,
  unknown?,
];

export type PhoenixOutbound = Record<string, unknown> & {
  topic: string;
  event: string;
  payload: Record<string, unknown>;
  ref?: string | null;
};
