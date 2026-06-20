import { chatService } from '@/services/chat.service';
import {
  useInboxConversationsQuery,
  useChatParticipantQuery,
  useChatSocket,
  useSupportConversationQuery,
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
  onChatEvent,
  onChannelHistory,
}: {
  userId?: string;
  orderId?: string;
  onChatEvent: (event: any) => void;
  onChannelHistory?: (messages: any[]) => void;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id || '');
  const isSupportChat = userId === 'support';
  const isOrderPairChat = Boolean(orderId && userId && currentUserId && !isSupportChat);

  const { data: supportConversation } = useSupportConversationQuery();

  const chatTopic = isSupportChat
    ? chatService.getSupportChatTopic(currentUserId)
    : isOrderPairChat
      ? chatService.getOrderChatTopic(orderId!, currentUserId, userId!)
      : '';

  const chatJoinTarget = isSupportChat
    ? currentUserId
    : isOrderPairChat
      ? userId || ''
      : '';

  const socketState = useChatSocket(chatTopic, onChatEvent);

  const activeConversationId = isSupportChat
    ? supportConversation?.id || undefined
    : undefined;

  const participantQuery = useChatParticipantQuery(isSupportChat ? 'support' : userId || '');

  const storedMessages = useChatStore(
    (state) =>
      activeConversationId
        ? state.messages[activeConversationId] ?? EMPTY_MESSAGES
        : EMPTY_MESSAGES,
  );

  return {
    currentUserId,
    isSupportChat,
    isOrderPairChat,
    supportConversation,
    chatTopic,
    chatJoinTarget,
    activeConversationId,
    user: participantQuery.data,
    initialMessages: undefined,
    storedMessages,
    sendMessage: socketState.sendMessage,
    setTyping: socketState.setTyping,
    isTyping: false,
    conversationId: activeConversationId,
    isReady: false,
    loadOlderMessages: async () => false,
    loadingOlder: false,
  };
}
