import { useMemo, useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { useChatSocket } from '@/services/messages.service';
import { useAuthStore } from '@/stores/auth.store';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

interface EventEnvelope {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  chatId?: string;
}

export function useConversations() {
  const conversationsQuery = useQuery({
    queryKey: ['inbox-conversations'],
    queryFn: async () => {
      return [];
    },
  });

  const conversations = conversationsQuery.data || [];
  const hasConversations = conversations.length > 0;

  return {
    conversations,
    hasConversations,
    isLoading: conversationsQuery.isLoading,
    refetch: conversationsQuery.refetch,
  };
}

export function useChat(chatId: string) {
  const currentUserId = useAuthStore((state) => state.user?.id || 'me');

  const participantQuery = useQuery({
    queryKey: ['chat-participant', chatId],
    queryFn: async () => {
      return null;
    },
    enabled: Boolean(chatId),
  });

  const participant = participantQuery.data;

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const onChatEvent = useCallback(
    (event: EventEnvelope) => {
      if (event.type !== 'chat.message') return;
      const payload = event.payload as { sender_id?: string; id?: string; text?: string } || {};
      const isMe = payload.sender_id === currentUserId;
      const time = new Date(event.occurredAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setMessages((prev) => [
        ...prev,
        {
          id: payload.id || String(Date.now()),
          text: payload.text || '',
          sender: isMe ? 'me' : 'them',
          time,
        },
      ]);
    },
    [currentUserId]
  );

  const { sendMessage: sendWsMessage, setTyping } = useChatSocket(chatId, onChatEvent);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      sendWsMessage(text);
    },
    [sendWsMessage]
  );

  const setIsTyping = useCallback(
    (isTyping: boolean) => {
      setTyping(isTyping);
    },
    [setTyping]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    participant,
    messages,
    isLoading: participantQuery.isLoading,
    sendMessage,
    setIsTyping,
    clearConversation,
  };
}
