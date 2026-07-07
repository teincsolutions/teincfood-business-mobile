import { useChat as useLibChat } from '@teincfood/chat-client';
import type { UseChatResult } from '@teincfood/chat-client';
import { getChatClient } from '@/utils/chat-service';
import { useAuthStore } from '@/stores/auth.store';

export function useChat(conversationId: string | null): UseChatResult {
  const client = getChatClient();
  return useLibChat(client, conversationId);
}

export { useInboxConversations } from './useInboxConversations';
export { useOpenUserChat } from './useOpenUserChat';

export type { UseChatResult } from '@teincfood/chat-client';
