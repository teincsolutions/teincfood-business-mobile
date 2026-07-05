// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { ChatConversationScreen } from "@/components/chat/ChatConversationScreen";

export default function DirectPairChatScreen() {
  const { userId, name, phone } = useLocalSearchParams();
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  const contactName = Array.isArray(name) ? name[0] : name;
  const contactPhone = Array.isArray(phone) ? phone[0] : phone;

  if (!normalizedUserId) {
    return <ChatConversationScreen userId="support" />;
  }

  return (
    <ChatConversationScreen
      userId={normalizedUserId}
      contactName={contactName || undefined}
      contactPhone={contactPhone || undefined}
      isDirect={true}
    />
  );
}
