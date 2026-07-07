import { useConversations as useLibConversations } from '@teincfood/chat-client';
import type { UseConversationsResult } from '@teincfood/chat-client';
import { getChatClient } from '@/utils/chat-service';

export function useInboxConversations(): UseConversationsResult {
  const client = getChatClient();
  return useLibConversations(client);
}

export type { UseConversationsResult } from '@teincfood/chat-client';
