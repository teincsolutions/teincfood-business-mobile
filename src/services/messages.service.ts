import { api } from './api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { chatService } from './chat.service';
import { useAuthStore } from '@/stores/auth.store';

export function useInboxConversationsQuery() {
  return useQuery({
    queryKey: ['inbox-conversations'],
    queryFn: () => api.get<any[]>('/conversations'),
  });
}

export function useConversationMessagesQuery(conversationId: string) {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => api.get<any[]>(`/conversations/${conversationId}/messages`),
    enabled: Boolean(conversationId),
  });
}

export function useSupportConversationQuery() {
  return useQuery({
    queryKey: ['support-conversation'],
    queryFn: () => api.post<any>('/conversations/support'),
  });
}

export function useChatParticipantQuery(userId: string) {
  return useQuery({
    queryKey: ['chat-participant', userId],
    queryFn: () => api.get<any>(`/users/${userId}`),
    enabled: Boolean(userId),
  });
}

export function useChatSocket(chatId: string, onEvent: (event: any) => void) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id || 'me');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId || !accessToken) return;

    chatService.connect().then(() => {
      chatService.joinChannel(chatId).catch(() => {});
    });

    const unsub = chatService.onMessage(chatId, (msg) => {
      onEvent(msg);
    });

    return () => {
      unsub();
      chatService.leaveChannel(chatId);
    };
  }, [chatId, accessToken, onEvent]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const localId = `cmsg_${Date.now()}`;
      chatService.sendMessage(chatId, trimmed, localId).catch(() => {});

      useAuthStore.getState();
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

  return { sendMessage, setTyping, markAsRead };
}
