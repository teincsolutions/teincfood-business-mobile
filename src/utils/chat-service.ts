import { ChatClient, createMMKVStorageAdapter } from '@teincfood/chat-client';
import type { AuthTokens } from '@teincfood/chat-client';
import { mmkvStorage } from './storage';
import { API_BASE_URL, WS_BASE_URL } from './constants';
import { useAuthStore } from '@/stores/auth.store';
import { eventsService } from '@teincfood/core';

let _client: ChatClient | null = null;

export function getChatClient(): ChatClient {
  if (!_client) {
    _client = new ChatClient({
      baseUrl: API_BASE_URL,
      wsUrl: WS_BASE_URL,
      storage: createMMKVStorageAdapter(mmkvStorage),
      surface: "business-mobile",
      onTokenExpired: async (): Promise<AuthTokens | null> => {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) return null;

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (!response.ok) {
            // Only clear auth for auth errors, not 5xx server errors
            if (response.status === 401 || response.status === 403) {
              useAuthStore.getState().clearAuth();
            }
            return null;
          }
          const data = await response.json() as AuthTokens;
          useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
          return data;
        } catch {
          // Network/server errors — don't clear auth, token likely still valid
          return null;
        }
      },
    });
  }
  return _client;
}

let _bridgeUnsubs: (() => void)[] | null = null

function setupChatEventBridge(): void {
  if (_bridgeUnsubs) return
  const client = getChatClient()
  const events = [
    "message.sent",
    "conversation:created",
    "conversation:updated",
    "messages_read",
    "messages_delivered",
    "unread_count",
  ] as const
  _bridgeUnsubs = events.map((event) =>
    eventsService.on(event, (payload) => {
      const enriched = {
        ...payload,
        event,
        conversation_id: payload.conversation_id ?? payload.entity_id,
        user_id: payload.user_id ?? payload.actor_id,
        reader_id: payload.reader_id ?? payload.actor_id,
      }
      client.handlePushPayload(enriched as Record<string, unknown>)
    }),
  )
}

function teardownChatEventBridge(): void {
  _bridgeUnsubs?.forEach((fn) => fn())
  _bridgeUnsubs = null
}

export async function connectChatClient(userId: string, accessToken: string, refreshToken?: string): Promise<ChatClient> {
  const c = getChatClient();
  c.setCurrentUserId(userId);
  await c.start({
    access_token: accessToken,
    refresh_token: refreshToken ?? accessToken,
  });
  setupChatEventBridge();
  return c;
}

export function disconnectChatClient(): void {
  teardownChatEventBridge();
  _client?.stop();
}
