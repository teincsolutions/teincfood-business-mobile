import { chatService } from '@/services/chat.service';
import {
  useInboxConversationsQuery,
  useChatParticipantQuery,
  useChatSocket,
  useSupportConversationQuery,
  useConversationMessagesQuery,
} from '@/services/messages.service';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import type { StoredMessage } from '@/types/chat';
import type {
  ConversationListResponse,
  Conversation,
  ConversationMessage,
} from '@/models/api';

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
  onChannelHistory?: (messages: ConversationMessage[]) => void;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id || '');
  const isSupportChat = userId === 'support';
  const isOrderPairChat = Boolean(orderId && userId && currentUserId && !isSupportChat);
  const chatTopic = isSupportChat
    ? chatService.getSupportChatTopic(currentUserId)
    : isOrderPairChat
      ? chatService.getOrderChatTopic(orderId!, currentUserId, userId!)
      : '';
  const chatJoinTarget = isSupportChat ? currentUserId : isOrderPairChat ? userId || '' : '';

  const { data: supportConversation, isLoading: supportLoading } = useSupportConversationQuery();
  const socketState = useChatSocket(chatTopic, onChatEvent);

  const activeConversationId = isSupportChat
    ? supportConversation?.data?.id ?? undefined
    : undefined;

  const participantQuery = useChatParticipantQuery(isSupportChat ? 'support' : userId || '');
  const messagesQuery = useConversationMessagesQuery(activeConversationId ?? '');

  const storedMessages = useChatStore(
    (state) =>
      activeConversationId
        ? state.messages[activeConversationId] ?? EMPTY_MESSAGES
        : EMPTY_MESSAGES,
  );

  const isReady = Boolean(chatTopic) && !supportLoading && (isSupportChat ? Boolean(supportConversation) : true);

  const loadOlderMessages = async (): Promise<boolean> => {
    if (!activeConversationId || messagesQuery.isFetching) return false;
    const offset = storedMessages.length;
    const result = await messagesQuery.refetch();
    if (!result.data?.data) return false;
    return result.data.data.length > 0;
  };

  return {
    currentUserId,
    isSupportChat,
    isOrderPairChat,
    supportConversation: supportConversation?.data,
    chatTopic,
    chatJoinTarget,
    activeConversationId,
    user: participantQuery.data,
    initialMessages: messagesQuery.data?.data,
    storedMessages,
    sendMessage: socketState.sendMessage,
    setTyping: socketState.setTyping,
    isTyping: false,
    conversationId: activeConversationId,
    isReady,
    loadOlderMessages,
    loadingOlder: messagesQuery.isFetching,
  };
}
