// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, XStack, Text, Button } from "tamagui";
import { ContactChatScreen } from "@/components/chat/ContactChatScreen";
import { BackButton } from "@/components/ui";
import { getChatClient } from "@/utils/chat-service";
import { useAuthStore } from "@/stores/auth.store";

export default function DirectPairChatScreen() {
  const router = useRouter();
  const { userId, contactType, senderBusinessId } = useLocalSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayAvatar, setDisplayAvatar] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

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

        // Sync the auth token before the REST call. The conversation screen can
        // open before the layout effect has started the chat client (or right
        // after a token rotation), which used to produce a 401 here.
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

        const currentUserId = client.getCurrentUserId();
        const conv = await client.conversations.startChat({
          contact_type: (contactType as string) || "user",
          contact_id: userId as string,
          sender_business_id: (senderBusinessId as string) || null,
        });
        if (!cancelled) {
          setConversationId(conv.id);
          const other = conv.participants?.find(
            (p: any) => p.user_id !== currentUserId,
          );
          // If senderBusinessId is set, we're messaging as our own business —
          // show the OTHER participant, not our own business.
          // If senderBusinessId is not set and contactType is "business",
          // the business IS the contact (user messaged a business directly).
          const isBizContact = (contactType as string) === "business";
          const showBizAsContact = !!conv.business && !senderBusinessId && isBizContact;
          setDisplayName(
            showBizAsContact
              ? conv.business.name
              : other?.user?.full_name ?? null,
          );
          setDisplayAvatar(
            showBizAsContact
              ? conv.business.logo_url
              : other?.user?.avatar_url ?? null,
          );
          setPhoneNumber(
            showBizAsContact
              ? conv.business?.phone ?? null
              : other?.user?.phone ?? null,
          );
        }
      } catch (e) {
        console.error("[Chat] Failed to create conversation:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, contactType, senderBusinessId, attempt]);

  if (loading) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <XStack paddingHorizontal="$4" paddingTop="$4">
          <BackButton />
        </XStack>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Loading conversation...
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
            Failed to open conversation
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
      displayName={displayName}
      displayAvatar={displayAvatar}
      phoneNumber={phoneNumber ?? undefined}
      isBusiness={!!senderBusinessId}
    />
  );
}
