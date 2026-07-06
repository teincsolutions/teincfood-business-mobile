import { ConversationService, createMMKVStorageAdapter } from '@teincfood/chat-client';
import { mmkvStorage } from './storage';
import { API_BASE_URL } from './constants';
import { useAuthStore } from '@/stores/auth.store';

let _service: ConversationService | null = null;

export function getConversationService(): ConversationService {
  if (!_service) {
    _service = new ConversationService({
      wsBaseUrl: '',
      apiBaseUrl: API_BASE_URL,
      getAccessToken: () => Promise.resolve(useAuthStore.getState().accessToken ?? ''),
      storage: createMMKVStorageAdapter(mmkvStorage),
    });
  }
  return _service;
}
