import { ChatClient } from '@teincfood/chat-client';
import type { AuthTokens, ChatStorage } from '@teincfood/chat-client';
import { AppState } from 'react-native';
import { accountStorage, clearAccountStoragePrefix } from './storage';
import { API_BASE_URL, WS_BASE_URL } from './constants';
import { eventsService, refreshSession } from '@teincfood/core';

let _client: ChatClient | null = null;

/**
 * Chat messages are account data. The adapter maps every chat key through the
 * active account prefix so a new login cannot hydrate the previous user's
 * inbox. `clear()` only removes chat keys for the current account.
 */
function createAccountChatStorage(): ChatStorage {
  return {
    async getItem<T = unknown>(key: string): Promise<T | null> {
      const raw = accountStorage.getString(key);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    async setItem<T = unknown>(key: string, value: T): Promise<void> {
      // accountStorage refuses writes before login and during a scope switch.
      accountStorage.set(key, JSON.stringify(value));
    },
    async removeItem(key: string): Promise<void> {
      accountStorage.delete(key);
    },
    async clear(): Promise<void> {
      clearAccountStoragePrefix("chat:");
    },
  };
}

export function getChatClient(): ChatClient {
  if (!_client) {
    _client = new ChatClient({
      baseUrl: API_BASE_URL,
      wsUrl: WS_BASE_URL,
      storage: createAccountChatStorage(),
      surface: "business-mobile",
      onTokenExpired: async (): Promise<AuthTokens | null> => {
        // Reuse core's single-flight refresh. Chat and REST must never rotate
        // the refresh token in parallel — the backend revokes the old token on
        // every use, so a second concurrent refresh would 401 the session.
        // Core owns the health-gated logout when the refresh token is dead.
        const tokens = await refreshSession();
        return tokens
          ? {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
            }
          : null;
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

let _appStateSub: { remove: () => void } | null = null;

/**
 * Recover the realtime connection when the app returns to the foreground.
 * Mobile OSes suspend sockets while backgrounded; without this the client
 * keeps a dead socket and new messages are silently queued forever.
 */
function setupChatResumeHandlers(): void {
  if (_appStateSub) return;
  _appStateSub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void getChatClient().resume(true).catch(() => {});
    }
  });
}

function teardownChatResumeHandlers(): void {
  _appStateSub?.remove();
  _appStateSub = null;
}

export async function connectChatClient(userId: string, accessToken: string, refreshToken?: string): Promise<ChatClient> {
  const c = getChatClient();
  c.setCurrentUserId(userId);
  await c.start({
    access_token: accessToken,
    refresh_token: refreshToken ?? accessToken,
  });
  setupChatEventBridge();
  setupChatResumeHandlers();
  return c;
}

export function disconnectChatClient(): void {
  teardownChatResumeHandlers();
  teardownChatEventBridge();
  _client?.stop();
}

/** Drop the client instance so the next login rebuilds it against the new scope. */
export function resetChatClient(): void {
  disconnectChatClient();
  _client = null;
}
