import type { Message, MessageStatus } from '@teincfood/chat-client';

export type { Message, MessageStatus };

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

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
