// @ts-nocheck
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { YStack, Text } from "tamagui";
import { ContactChatScreen } from "@/components/chat/ContactChatScreen";
import { getChatClient } from "@/utils/chat-service";

export default function DirectPairChatScreen() {
  const { userId, contactType } = useLocalSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayAvatar, setDisplayAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = getChatClient();
        const currentUserId = client.getCurrentUserId();
        const conv = await client.conversations.startChat({
          contact_type: (contactType as string) || 'user',
          contact_id: userId as string,
        });
        if (!cancelled) {
          setConversationId(conv.id);
          const other = conv.participants?.find(
            (p: any) => p.user_id !== currentUserId,
          );
          setDisplayName(conv.business?.name ?? other?.user?.full_name ?? null);
          setDisplayAvatar(conv.business?.logo_url ?? other?.user?.avatar_url ?? null);
        }
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
