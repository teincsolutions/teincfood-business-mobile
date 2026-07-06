import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getConversationService } from '@/utils/chat-service';
import { useEffect } from 'react';

const INBOX_KEY = ['inbox-conversations'] as const;

export function useInboxConversations() {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: INBOX_KEY,
    queryFn: () => getConversationService().getInboxConversations(),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const client = (globalThis as Record<string, unknown>).__teincfood_chat_client__ as
      | { on: (event: string, cb: (...args: unknown[]) => void) => () => void }
      | undefined;
    if (!client) return;

    const unsub = client.on('message', () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    });

    return () => unsub();
  }, [queryClient]);

  return result;
}
