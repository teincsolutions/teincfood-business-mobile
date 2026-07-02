import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { chatService } from './chat.service';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import { CHAT_CONFIG } from '@/utils/constants';
import type { StoredMessage, OutboundMessage, ChatMessageStatus } from '@/types/chat';

export interface SupportConversation {
  id: string;
  type: 'user' | 'internal' | 'support';
  status: 'active' | 'closed';
  assigned_agent_id?: string | null;
  order_id?: string | null;
  participants?: Array<{
    id: string;
    user_id: string;
    archived_at?: string | null;
  }>;
  inserted_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  sender_id: string;
  content: string;
  text: string;
  conversation_id: string;
  direction?: 'inbound' | 'outbound';
  channel?: 'app' | 'whatsapp';
  message_type?: 'text' | 'image' | 'document' | 'video' | 'audio';
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown> | null;
  sent_at: string;
  inserted_at: string;
}

export interface InboxConversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  unreadCount: number;
  time: string;
  type?: string;
}

interface ChatEvent {
  type: string;
  payload: SupportMessage;
  occurredAt: string;
}

type OnChatEvent = (event: ChatEvent) => void;

interface UseChatSocketOptions {
  topic?: string;
  conversationIdHint?: string;
  enableChannelHistory?: boolean;
  channelHistoryLimit?: number;
  onChannelHistory?: (messages: SupportMessage[]) => void;
}

function normalizeMessage(raw: Record<string, unknown>): SupportMessage {
  const text = String(raw.content ?? raw.text ?? '');
  const insertedAt = String(raw.inserted_at ?? raw.sent_at ?? new Date().toISOString());

  return {
    id: String(raw.id ?? ''),
    sender_id: String(raw.sender_id ?? raw.user_id ?? ''),
    content: text,
    text,
    conversation_id: String(raw.conversation_id ?? ''),
    direction: raw.direction as SupportMessage['direction'],
    channel: raw.channel as SupportMessage['channel'],
    message_type: raw.message_type as SupportMessage['message_type'],
    status: raw.status as SupportMessage['status'],
    metadata: (raw.metadata as Record<string, unknown> | null | undefined) ?? null,
    sent_at: String(raw.sent_at ?? insertedAt),
    inserted_at: insertedAt,
  };
}

function serverToStored(msg: SupportMessage, localId: string, status: ChatMessageStatus = 'sent'): StoredMessage {
  return {
    id: msg.id,
    localId,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    text: msg.text,
    status,
    channel: msg.channel ?? 'app',
    sentAt: msg.sent_at,
  };
}

function formatConversationTime(timestamp?: string) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export const messagesService = {
  async getConversations(): Promise<SupportConversation[]> {
    const response = await api.get<{ data: SupportConversation[] }>('/conversations');
    return response.data ?? [];
  },

  async getMessages(conversationId: string, offset = 0, limit = 50): Promise<SupportMessage[]> {
    const response = await api.get<{ data: SupportMessage[] }>(
      `/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
    );
    return (response.data ?? []).map((msg) => normalizeMessage(msg as unknown as Record<string, unknown>));
  },

  async getInboxConversations(): Promise<InboxConversation[]> {
    const conversations = await this.getConversations();
    return conversations.map((conversation) => ({
      id: conversation.id,
      name: conversation.type === 'support' ? 'TeincFood Support' : 'Conversation',
      avatar: undefined,
      lastMessage: conversation.type === 'support' ? 'Talk to our support team' : 'Open conversation',
      unreadCount: 0,
      time: formatConversationTime(conversation.updated_at),
      type: conversation.type,
    }));
  },

  async openSupportConversation(): Promise<SupportConversation> {
    const response = await api.post<{ data: SupportConversation }>(
      '/conversations/support',
      {},
    );
    return response.data;
  },
};

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function useInboxConversationsQuery() {
  return useQuery({
    queryKey: ['inbox-conversations'],
    queryFn: () => messagesService.getInboxConversations(),
  });
}

export function useSupportConversationQuery(enabled = true, scopeKey = 'default') {
  return useQuery({
    queryKey: ['support-conversation', scopeKey],
    queryFn: () => messagesService.openSupportConversation(),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}

export function useMessagesQuery(conversationId?: string, enabled = true) {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => messagesService.getMessages(conversationId as string),
    enabled: Boolean(conversationId) && enabled,
  });
}

export function useChatParticipantQuery(_userId: string) {
  return useQuery({
    queryKey: ['chat-participant', _userId],
    queryFn: async () => ({
      id: 'support',
      fullName: 'TeincFood Support',
      avatarUrl: undefined as string | undefined,
      phone: undefined as string | undefined,
    }),
    enabled: Boolean(_userId),
  });
}

// ---------------------------------------------------------------------------
// useChatSocket — the core WebSocket hook
// ---------------------------------------------------------------------------

export function useChatSocket(
  joinTarget: string,
  onEvent: OnChatEvent,
  options?: UseChatSocketOptions,
) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedOffset = useRef(0);

  const topic = useMemo(
    () => options?.topic || (joinTarget ? `chat:support:${joinTarget}` : ''),
    [joinTarget, options?.topic],
  );

  const store = useChatStore;

  // Eagerly load cached conversation ID for instant message display
  const cachedConversationId = useMemo(() => {
    return store.getState().conversationTopicCache[topic] ?? null;
  }, [topic, store]);

  useEffect(() => {
    if (!joinTarget || !topic) return;

    setIsReady(false);
    let unsubscribe: (() => void) | null = null;
    let typingUnsub: (() => void) | null = null;
    let mounted = true;

    const setup = async () => {
      try {
        if (!chatService.isConnected()) {
          await chatService.connect();
        }

        const joinPayload = await chatService.joinChannel(topic);
        const resolvedConversationId = String(
          joinPayload.conversation_id ?? options?.conversationIdHint ?? joinTarget,
        );
        if (mounted) {
          setConversationId(resolvedConversationId);
          store.getState().cacheConversationId(topic, resolvedConversationId);
        }
        
        // Subscribe to incoming messages
        unsubscribe = chatService.onMessage(topic, (msg) => {
          const payload = normalizeMessage(msg as unknown as Record<string, unknown>);

          // Persist incoming messages to store
          // Skip broadcast for own messages — already handled by optimistic insert + phx_reply
          if (payload.conversation_id && payload.sender_id !== currentUserIdRef.current) {
            store.getState().upsertMessage(payload.conversation_id, {
              id: payload.id,
              localId: payload.id,
              conversationId: payload.conversation_id,
              senderId: payload.sender_id,
              text: payload.text,
              status: 'delivered',
              channel: payload.channel ?? 'app',
              sentAt: payload.sent_at,
              deliveredAt: new Date().toISOString(),
            });
          }

          onEvent({ type: 'chat.message', payload, occurredAt: payload.sent_at });
        });

        // Subscribe to typing events
        typingUnsub = chatService.onTyping(topic, (data) => {
          if (data.is_typing) {
            setIsTyping(true);
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setIsTyping(false), CHAT_CONFIG.TYPING_TIMEOUT_MS);
          } else {
            setIsTyping(false);
          }
        });

        // Load channel history if needed (for order pair chats)
        if (options?.enableChannelHistory) {
          const history = await chatService.getMessages(topic, options.channelHistoryLimit ?? 50);

          // Persist channel history to store
          const conversationIdForHistory = resolvedConversationId;
          const storeMessages = history.map((item) =>
            serverToStored(
              normalizeMessage(item as unknown as Record<string, unknown>),
              item.id ?? '',
              'delivered',
            ),
          );
          for (const sm of storeMessages) {
            if (conversationIdForHistory) {
              store.getState().upsertMessage(conversationIdForHistory, sm);
            }
          }

          options.onChannelHistory?.(
            history.map((item) =>
              normalizeMessage(item as unknown as Record<string, unknown>),
            ),
          );
        }

        if (mounted) {
          setIsReady(true);
        }
      } catch {
        if (mounted) {
          setIsReady(false);
        }
      }
    };

    setup();

    return () => {
      mounted = false;
      unsubscribe?.();
      typingUnsub?.();
      chatService.leaveChannel(topic);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      setIsReady(false);
      setIsTyping(false);
    };
  }, [
    joinTarget,
    onEvent,
    options?.channelHistoryLimit,
    options?.enableChannelHistory,
    options?.onChannelHistory,
    topic,
    store,
  ]);

  // Sender ID for optimistic messages
  const currentUserId = useAuthStore((state) => state.user?.id || '');
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const cid = conversationId || options?.conversationIdHint || cachedConversationId || '';
      if (!topic || !cid) return false;

      const localId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Optimistic insert into store (shows in UI immediately)
      const optimistic: StoredMessage = {
        id: localId,
        localId,
        conversationId: cid,
        senderId: currentUserId || '',
        text,
        status: 'sending',
        channel: 'app',
        sentAt: new Date().toISOString(),
      };
      store.getState().upsertMessage(cid, optimistic);

      if (!isReady || !chatService.hasJoined(topic)) {
        console.log('[Chat] Channel not ready (isReady=' + isReady + ' joined=' + chatService.hasJoined(topic) + '), queuing message');
        store.getState().updateMessageStatus(cid, localId, 'queued');
        store.getState().addToOutbox({
          id: localId,
          topic,
          conversationId: cid,
          text,
          status: 'queued',
          queuedAt: Date.now(),
        });
        return false;
      }

      try {
        const reply = await chatService.sendMessage(topic, text, localId);
        const serverId = (reply?.id as string) ?? localId;
        store.getState().updateMessageStatus(cid, localId, 'sent', serverId);
        return true;
      } catch (err) {
        console.warn('[Chat] Send on wire failed, queuing:', err);
        store.getState().updateMessageStatus(cid, localId, 'queued');
        store.getState().addToOutbox({
          id: localId,
          topic,
          conversationId: cid,
          text,
          status: 'queued',
          queuedAt: Date.now(),
        });
        return false;
      }
    },
    [topic, conversationId, cachedConversationId, isReady, options?.conversationIdHint, store, currentUserId],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!topic) return;
      chatService.sendTyping(topic, isTyping);
    },
    [topic],
  );

  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    const cid = conversationId || cachedConversationId;
    if (!cid || loadingOlder) return false;

    setLoadingOlder(true);
    try {
      const older = await messagesService.getMessages(cid, loadedOffset.current);
      if (older.length === 0) return false;

      loadedOffset.current += older.length;

      const storedMessages = older.map((msg) => ({
        id: msg.id,
        localId: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        text: msg.text,
        status: 'delivered' as ChatMessageStatus,
        channel: (msg.channel ?? 'app') as 'app' | 'whatsapp',
        sentAt: msg.sent_at,
      }));

      for (const sm of storedMessages) {
        store.getState().upsertMessage(cid, sm);
      }

      return older.length > 0;
    } catch {
      return false;
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, cachedConversationId, loadingOlder, store]);

  return { sendMessage, setTyping, conversationId, cachedConversationId, isReady, isTyping, loadingOlder, loadOlderMessages, loadedOffset };
}
