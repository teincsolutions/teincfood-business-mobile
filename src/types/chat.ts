import type { Message, MessageStatus } from '@teincfood/chat-client';

export type { Message, MessageStatus };

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export type PhoenixV2Frame = [
  string | null,
  string | null,
  string,
  string,
  Record<string, unknown> | undefined,
];

export type PhoenixOutbound = Record<string, unknown> & {
  topic: string;
  event: string;
  payload: Record<string, unknown>;
  ref?: string | null;
  joinRef?: string | null;
};
