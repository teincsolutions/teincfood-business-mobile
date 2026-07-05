// @ts-nocheck
import { useLocalSearchParams } from 'expo-router';
import { ChatConversationScreen } from '@/components/chat/ChatConversationScreen';

export default function OrderPairChatScreen() {
  const { userId, orderId } = useLocalSearchParams();

  return (
    <ChatConversationScreen
      userId={userId}
      orderId={orderId}
    />
  );
}
