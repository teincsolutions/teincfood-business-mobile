// @ts-nocheck
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { YStack, Text } from "tamagui";
import { ContactChatScreen } from "@/components/chat/ContactChatScreen";
import { getConversationService } from "@/utils/chat-service";

export default function DirectPairChatScreen() {
  const { userId, displayName, displayAvatar } = useLocalSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const conv = await getConversationService().startChat({
          contactType: 'user',
          contactId: userId,
        });
        if (!cancelled) setConversationId(conv.id);
      } catch (e) {
        console.error('[Chat] Failed to create conversation:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Text fontSize="$4" color="$colorSecondary">Loading conversation...</Text>
      </YStack>
    );
  }

  if (!conversationId) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Text fontSize="$4" color="$error">Failed to open conversation</Text>
      </YStack>
    );
  }

  return (
    <ContactChatScreen
      conversationId={conversationId}
      displayName={displayName}
      displayAvatar={displayAvatar}
    />
  );
}
