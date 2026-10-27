// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { YStack, XStack, Text, Button } from "tamagui";
import { useRouter } from "expo-router";
import { ContactChatScreen } from "@/components/chat/ContactChatScreen";
import { BackButton } from "@/components/ui";
import { getChatClient } from "@/utils/chat-service";
import { useAuthStore } from "@/stores/auth.store";

export default function SupportChatScreen() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(communication)" as any);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setConversationId(null);

    (async () => {
      try {
        const client = getChatClient();

        // The chat client owns its own token copy. This screen can open while
        // the layout connection effect is still catching up (or after a token
        // rotation), so always hand it the current auth token before the REST
        // call. start() is idempotent and also refreshes the socket token.
        const { user, accessToken, refreshToken } = useAuthStore.getState();
        if (accessToken && user?.id) {
          client.setCurrentUserId(user.id);
          client.setTokens({
            access_token: accessToken,
            refresh_token: refreshToken ?? accessToken,
          });
          // Connect/refresh the socket in the background; the REST call below
          // must not wait up to 10s for a WebSocket handshake.
          void client
            .start({
              access_token: accessToken,
              refresh_token: refreshToken ?? accessToken,
            })
            .catch((err) => console.debug("[Chat] socket start failed", err));
        }

        const conv = await client.conversations.startSupportChat();
        if (!cancelled) setConversationId(conv.id);
      } catch (e) {
        console.error("[Chat] Failed to create support conversation:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loading) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <XStack paddingHorizontal="$4" paddingTop="$4">
          <BackButton />
        </XStack>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Connecting to support...
          </Text>
        </YStack>
      </YStack>
    );
  }

  if (error || !conversationId) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <XStack paddingHorizontal="$4" paddingTop="$4">
          <BackButton />
        </XStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingHorizontal="$6"
        >
          <Text fontSize="$5" fontWeight="600" color="$error" fontFamily="$heading" textAlign="center">
            Failed to connect to support
          </Text>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
            Check your connection and try again.
          </Text>
          <Button
            variant="primary"
            size="$4"
            onPress={() => setAttempt((n) => n + 1)}
          >
            Try Again
          </Button>
          <Button variant="outline" size="$4" onPress={goBack}>
            Go Back
          </Button>
        </YStack>
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
