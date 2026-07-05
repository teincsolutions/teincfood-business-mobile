import { createMMKVStorageAdapter, useChat as useLibChat } from '@teincfood/chat-client';
import type { ChatClientConfig, UseChatOptions } from '@teincfood/chat-client';
import { useAuthStore } from '@/stores/auth.store';
import { mmkvStorage } from '@/utils/storage';
import { API_BASE_URL, WS_BASE_URL } from '@/utils/constants';

export function useChat(options: UseChatOptions) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const config: ChatClientConfig = {
    wsBaseUrl: WS_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    getAccessToken: () => Promise.resolve(accessToken ?? ''),
    storage: createMMKVStorageAdapter(mmkvStorage),
  };
  return useLibChat(config, options);
}

export type { UseChatOptions } from '@teincfood/chat-client';

// Re-export inbox hook for convenience
export { useInboxConversations } from './useInboxConversations';
