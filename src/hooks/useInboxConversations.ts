import { useQuery } from '@tanstack/react-query';
import { ConversationService, createMMKVStorageAdapter } from '@teincfood/chat-client';
import { useAuthStore } from '@/stores/auth.store';
import { mmkvStorage } from '@/utils/storage';
import { API_BASE_URL } from '@/utils/constants';

const conversationService = new ConversationService({
  wsBaseUrl: '',
    apiBaseUrl: API_BASE_URL,
  getAccessToken: () => Promise.resolve(useAuthStore.getState().accessToken ?? ''),
  storage: createMMKVStorageAdapter(mmkvStorage),
});

export function useInboxConversations() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['inbox-conversations'],
    queryFn: () => conversationService.getInboxConversations(currentUserId),
  });
}
