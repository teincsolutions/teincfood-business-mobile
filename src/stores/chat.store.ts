import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/utils/storage';
import { CHAT_STORAGE_KEYS } from '@/utils/constants';
import type { StoredMessage, OutboundMessage, ChatMessageStatus } from '@/types/chat';

interface ChatState {
  messages: Record<string, StoredMessage[]>;
  outbox: OutboundMessage[];
  typingUsers: Record<string, { userId: string; timestamp: number }>;
  conversationTopicCache: Record<string, string>;

  upsertMessage: (conversationId: string, msg: StoredMessage) => void;
  updateMessageStatus: (
    conversationId: string,
    localId: string,
    status: ChatMessageStatus,
    serverId?: string,
  ) => void;
  getConversationMessages: (conversationId: string) => StoredMessage[];
  addToOutbox: (msg: OutboundMessage) => void;
  removeFromOutbox: (outboxId: string) => void;
  updateOutboxStatus: (outboxId: string, status: OutboundMessage['status']) => void;
  getPendingOutbox: () => OutboundMessage[];
  setTyping: (topic: string, userId: string, isTyping: boolean) => void;
  clearConversation: (conversationId: string) => void;
  cacheConversationId: (topic: string, conversationId: string) => void;
}

const storage = createJSONStorage(() => ({
  getItem: (name) => mmkvStorage.getString(name) ?? null,
  setItem: (name, value) => mmkvStorage.set(name, value),
  removeItem: (name) => mmkvStorage.delete(name),
}));

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {},
      outbox: [],
      typingUsers: {},
      conversationTopicCache: {},

      upsertMessage: (conversationId, msg) =>
        set((state) => {
          const existing = state.messages[conversationId] ?? [];
          const idx = existing.findIndex(
            (m) => m.id === msg.id || m.localId === msg.localId,
          );
          const next = [...existing];
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...msg };
          } else {
            next.push(msg);
          }
          return {
            messages: { ...state.messages, [conversationId]: next },
          };
        }),

      updateMessageStatus: (conversationId, localId, status, serverId) =>
        set((state) => {
          const existing = state.messages[conversationId] ?? [];
          const next = existing.map((m) => {
            if (m.localId !== localId && m.id !== localId) return m;
            return {
              ...m,
              status,
              ...(serverId ? { id: serverId } : {}),
            };
          });
          return {
            messages: { ...state.messages, [conversationId]: next },
          };
        }),

      getConversationMessages: (conversationId) =>
        get().messages[conversationId] ?? [],

      addToOutbox: (msg) =>
        set((state) => ({ outbox: [...state.outbox, msg] })),

      removeFromOutbox: (outboxId) =>
        set((state) => ({
          outbox: state.outbox.filter((m) => m.id !== outboxId),
        })),

      updateOutboxStatus: (outboxId, status) =>
        set((state) => ({
          outbox: state.outbox.map((m) =>
            m.id === outboxId ? { ...m, status } : m,
          ),
        })),

      getPendingOutbox: () => get().outbox.filter((m) => m.status !== 'sent'),

      setTyping: (topic, userId, isTyping) =>
        set((state) => {
          if (!isTyping) {
            const next = { ...state.typingUsers };
            delete next[topic];
            return { typingUsers: next };
          }
          return {
            typingUsers: {
              ...state.typingUsers,
              [topic]: { userId, timestamp: Date.now() },
            },
          };
        }),

      clearConversation: (conversationId) =>
        set((state) => {
          const next = { ...state.messages };
          delete next[conversationId];
          return { messages: next };
        }),

      cacheConversationId: (topic, conversationId) =>
        set((state) => ({
          conversationTopicCache: {
            ...state.conversationTopicCache,
            [topic]: conversationId,
          },
        })),
    }),
    {
      name: CHAT_STORAGE_KEYS.MESSAGES,
      storage,
      partialize: (state) => ({
        messages: state.messages,
        outbox: state.outbox,
        conversationTopicCache: state.conversationTopicCache,
      }),
    },
  ),
);
