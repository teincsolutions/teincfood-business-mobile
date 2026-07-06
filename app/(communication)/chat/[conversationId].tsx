// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { ChatConversationScreen } from "@/components/chat/ChatConversationScreen";

export default function ConversationScreen() {
  const { conversationId, displayName, displayAvatar, phoneNumber } = useLocalSearchParams();

  return (
    <ChatConversationScreen
      conversationId={conversationId}
      displayName={displayName}
      displayAvatar={displayAvatar}
      phoneNumber={phoneNumber}
    />
  );
}
