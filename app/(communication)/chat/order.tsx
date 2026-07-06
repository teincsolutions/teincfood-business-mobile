// @ts-nocheck
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { YStack, Text } from "tamagui";
import { ChatConversationScreen } from "@/components/chat/ChatConversationScreen";
import { getConversationService } from "@/utils/chat-service";

export default function OrderPairChatScreen() {
  const { userId, orderId, type, businessId, displayName, displayAvatar } = useLocalSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const convType = type || 'direct';
        const params: Record<string, unknown> = {
          orderId,
        };
        if (convType === 'business_group') {
          params.contactType = 'business';
          params.contactId = businessId || userId;
        } else {
          params.contactType = 'user';
          params.contactId = userId;
        }
        const conv = await getConversationService().startChat(params as any);
        if (!cancelled) setConversationId(conv.id);
      } catch (e) {
        console.error('[Chat] Failed to create conversation:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, orderId, type, businessId]);

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
    <ChatConversationScreen
      conversationId={conversationId}
      displayName={displayName}
      displayAvatar={displayAvatar}
    />
  );
}
