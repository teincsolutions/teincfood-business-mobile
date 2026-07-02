// @ts-nocheck
import { useLocalSearchParams } from 'expo-router';
import { ChatConversationScreen } from '@/components/chat/ChatConversationScreen';

export default function OrderPairChatScreen() {
  const { userId, orderId, name, phone } = useLocalSearchParams();
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  const normalizedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const contactName = Array.isArray(name) ? name[0] : name;
  const contactPhone = Array.isArray(phone) ? phone[0] : phone;

  if (!normalizedUserId || !normalizedOrderId) {
    return <ChatConversationScreen userId="support" />;
  }

  return (
    <ChatConversationScreen
      userId={normalizedUserId}
      orderId={normalizedOrderId}
      contactName={contactName || undefined}
      contactPhone={contactPhone || undefined}
    />
  );
}
