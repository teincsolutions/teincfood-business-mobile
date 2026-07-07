import { useContacts as useLibContacts } from '@teincfood/chat-client';
import type { UseContactsResult, ContactContext } from '@teincfood/chat-client';
import { getChatClient } from '@/utils/chat-service';

export function useContacts(context?: ContactContext, businessId?: string): UseContactsResult {
  const client = getChatClient();
  return useLibContacts(client, context, businessId);
}

export type { UseContactsResult, ContactContext } from '@teincfood/chat-client';
