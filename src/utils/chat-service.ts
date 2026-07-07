import { ChatClient, createMMKVStorageAdapter } from '@teincfood/chat-client';
import { mmkvStorage } from './storage';
import { API_BASE_URL, WS_BASE_URL } from './constants';
import { useAuthStore } from '@/stores/auth.store';

let _client: ChatClient | null = null;

export function getChatClient(): ChatClient {
  if (!_client) {
    _client = new ChatClient({
      baseUrl: API_BASE_URL,
      wsUrl: WS_BASE_URL,
      storage: createMMKVStorageAdapter(mmkvStorage),
    });
  }
  return _client;
}

export async function connectChatClient(userId: string, accessToken: string): Promise<ChatClient> {
  const c = getChatClient();
  c.setCurrentUserId(userId);
  await c.start({ access_token: accessToken, refresh_token: accessToken });
  return c;
}

export function disconnectChatClient(): void {
  _client?.stop();
}
