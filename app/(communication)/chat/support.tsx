// @ts-nocheck
import { useEffect, useState } from "react";
import { YStack, Text } from "tamagui";
import { ContactChatScreen } from "@/components/chat/ContactChatScreen";
import { getChatClient } from "@/utils/chat-service";

export default function SupportChatScreen() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = getChatClient();
        const conv = await client.conversations.startSupportChat();
        if (!cancelled) setConversationId(conv.id);
      } catch (e) {
        console.error("[Chat] Failed to create support conversation:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        backgroundColor="$background"
      >
        <Text fontSize="$4" color="$colorSecondary">
          Connecting to support...
        </Text>
      </YStack>
    );
  }

  if (!conversationId) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        backgroundColor="$background"
      >
        <Text fontSize="$4" color="$error">
          Failed to connect to support
        </Text>
      </YStack>
    );
  }

  return (
    <ContactChatScreen
      conversationId={conversationId}
      displayName="Teinc Food Support"
    />
  );
}
