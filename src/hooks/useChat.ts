import { chatService } from '@/services/chat.service';
import {
  useInboxConversationsQuery,
  useChatParticipantQuery,
  useChatSocket,
  useSupportConversationQuery,
  useMessagesQuery,
} from '@/services/messages.service';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import type { StoredMessage } from '@/types/chat';

const EMPTY_MESSAGES: StoredMessage[] = [];

export function useInboxConversations() {
  return useInboxConversationsQuery();
}

export function useChat({
  userId,
  orderId,
  isDirect,
  onChatEvent,
  onChannelHistory,
}: {
  userId?: string;
  orderId?: string;
  isDirect?: boolean;
  onChatEvent: (event: any) => void;
  onChannelHistory?: (messages: any[]) => void;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id || '');
  const isSupportChat = userId === 'support';
  const isOrderPairChat = Boolean(orderId && userId && currentUserId && !isSupportChat);
  const isDirectPairChat = Boolean(isDirect && userId && currentUserId && !isSupportChat && !isOrderPairChat);

  const { data: supportConversation } = useSupportConversationQuery(
    isSupportChat,
    currentUserId,
  );

  const chatTopic = isSupportChat
    ? chatService.getSupportChatTopic(currentUserId)
    : isOrderPairChat
      ? chatService.getOrderChatTopic(orderId!, currentUserId, userId!)
      : isDirectPairChat
        ? chatService.getDirectChatTopic(currentUserId, userId!)
        : '';

  const chatJoinTarget = isSupportChat
    ? currentUserId
    : isOrderPairChat || isDirectPairChat
      ? userId || ''
      : '';

  const cachedConversationIdHint = useChatStore(
    (state) => state.conversationTopicCache[chatTopic] ?? undefined
  );

  const socketState = useChatSocket(chatJoinTarget, onChatEvent, {
    topic: chatTopic,
    conversationIdHint: isSupportChat
      ? (supportConversation?.id ?? cachedConversationIdHint)
      : cachedConversationIdHint,
    enableChannelHistory: isOrderPairChat || isDirectPairChat,
    channelHistoryLimit: 50,
    onChannelHistory,
  });

  // Use cached conversation ID immediately so stored messages show right away
  const activeConversationId = isSupportChat
    ? supportConversation?.id || socketState.cachedConversationId || socketState.conversationId || undefined
    : socketState.cachedConversationId || socketState.conversationId || undefined;

  const participantQuery = useChatParticipantQuery(isSupportChat ? 'support' : userId || '');

  // Load persisted messages from store eagerly (using cache if active ID not ready yet)
  const storedMessages = useChatStore(
    (state) => {
      if (!activeConversationId) return state.messages[chatTopic] ?? EMPTY_MESSAGES;
      return state.messages[activeConversationId] ?? state.messages[chatTopic] ?? EMPTY_MESSAGES;
    },
  );
  const messagesQuery = useMessagesQuery(activeConversationId, isSupportChat);

  return {
    currentUserId,
    isSupportChat,
    isOrderPairChat,
    isDirectPairChat,
    supportConversation,
    chatTopic,
    chatJoinTarget,
    activeConversationId,
    user: participantQuery.data,
    initialMessages: messagesQuery.data,
    storedMessages,
    sendMessage: socketState.sendMessage,
    setTyping: socketState.setTyping,
    isTyping: socketState.isTyping,
    conversationId: activeConversationId,
    isReady: socketState.isReady,
    loadOlderMessages: socketState.loadOlderMessages,
    loadingOlder: socketState.loadingOlder,
  };
}
