import { api } from './api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { chatService } from './chat.service';
import { useAuthStore } from '@/stores/auth.store';
import type {
  ConversationListResponse,
  ConversationResponse,
  ConversationMessagesResponse,
  ConversationMessage,
} from '@/types/api';

export function useInboxConversationsQuery() {
  return useQuery<ConversationListResponse>({
    queryKey: ['inbox-conversations'],
    queryFn: () => api.get<ConversationListResponse>('/conversations'),
  });
}

export function useConversationMessagesQuery(conversationId: string) {
  return useQuery<ConversationMessagesResponse>({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => api.get<ConversationMessagesResponse>(`/conversations/${conversationId}/messages`),
    enabled: Boolean(conversationId),
  });
}

export function useSupportConversationQuery() {
  return useQuery<ConversationResponse>({
    queryKey: ['support-conversation'],
    queryFn: () => api.post<ConversationResponse>('/conversations/support'),
  });
}

export function useChatParticipantQuery(userId: string) {
  return useQuery({
    queryKey: ['chat-participant', userId],
    queryFn: () => api.get<Record<string, unknown>>(`/users/${userId}`),
    enabled: Boolean(userId),
  });
}

export function useChatSocket(chatId: string, onEvent: (event: any) => void) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const onEventRef = useRef(onEvent);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Keep onEvent ref in sync without triggering effect re-run
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!chatId || !accessToken) return;

    setJoinError(null);

    chatService.connect().then(() => {
      chatService.joinChannel(chatId).catch((err) => {
        const reason = err?.message || err?.reason || String(err);
        console.error('[ChatSocket] Failed to join channel', chatId, reason);
        setJoinError(reason);
      });
    });

    const unsub = chatService.onMessage(chatId, (msg) => {
      onEventRef.current(msg);
    });

    return () => {
      unsub();
      chatService.leaveChannel(chatId);
    };
  }, [chatId, accessToken]); // removed onEvent from deps — using ref instead

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const localId = `cmsg_${Date.now()}`;
      chatService.sendMessage(chatId, trimmed, localId).catch(() => {});
    },
    [chatId]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      chatService.sendTyping(chatId, isTyping);
    },
    [chatId]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      await api.patch(`/conversations/${chatId}/messages/${messageId}/read`);
      queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
    },
    [chatId, queryClient]
  );

  return { sendMessage, setTyping, markAsRead, joinError };
}
