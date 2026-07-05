// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { ChatConversationScreen } from "@/components/chat/ChatConversationScreen";

export default function DirectPairChatScreen() {
  const { userId } = useLocalSearchParams();

  return (
    <ChatConversationScreen
      userId={userId}
      isDirect={true}
    />
  );
}
