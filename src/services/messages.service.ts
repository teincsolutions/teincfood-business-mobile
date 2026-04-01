import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import type { EventEnvelope } from './backend-contracts.types';
import { mockBackend } from './mock-backend.service';
import { mockChatSocket } from './realtime-mock.service';
import { useAuthStore } from '@/stores/auth.store';

export function useInboxConversationsQuery() {
  return useQuery({
    queryKey: ['inbox-conversations'],
    queryFn: () => mockBackend.getInboxConversations(),
  });
}

export function useChatParticipantQuery(userId: string) {
  return useQuery({
    queryKey: ['chat-participant', userId],
    queryFn: () => mockBackend.getChatParticipant(userId),
    enabled: Boolean(userId),
  });
}

export function useChatSocket(chatId: string, onEvent: (event: EventEnvelope) => void) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id || 'me');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId || !accessToken) return;

    mockChatSocket.connect(accessToken);
    const unsubscribe = mockChatSocket.subscribe((event) => {
      if (event.chatId && event.chatId !== chatId) return;
      onEvent(event);
    });

    return () => {
      unsubscribe();
      mockChatSocket.disconnect();
    };
  }, [chatId, accessToken, onEvent]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      mockChatSocket.send(
        {
          clientMessageId: `cmsg_${Date.now()}`,
          chatId,
          text: trimmed,
        },
        userId
      );
    },
    [chatId, userId]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      mockChatSocket.typing(chatId, userId, isTyping);
    },
    [chatId, userId]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      // Mark as read via socket
      mockChatSocket.markRead(chatId, messageId, userId);
      
      // Also mark as read in the backend to update inbox conversations
      await mockBackend.markChatAsRead(chatId, messageId);
      
      // Invalidate the inbox conversations query to refresh the unread count
      queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
    },
    [chatId, userId, queryClient]
  );

  return { sendMessage, setTyping, markAsRead };
}
