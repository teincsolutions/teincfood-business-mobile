// @ts-nocheck
import { useRouter } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageSquare } from "@tamagui/lucide-icons";
import { BackButton } from "@/components/ui";
import { useInboxConversations } from "@/hooks/useChat";

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useInboxConversations();
  const allConversations = data?.data ?? [];
  // Separate support conversations — dedicated button for support, not in the list
  const conversations = allConversations.filter((c) => c.type !== 'support');

  if (!isLoading && allConversations.length === 0) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingTop={Math.max(insets.top, 50)}
      >
        <XStack
          alignItems="center"
          paddingHorizontal="$5"
          paddingBottom="$4"
          gap="$3"
        >
          <BackButton />
          <Text
            fontSize="$6"
            fontWeight="800"
            fontFamily="$heading"
            color="$color"
          >
            Messages
          </Text>
        </XStack>
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          padding="$10"
        >
          <MessageSquare size={80} color="$gray200" />
          <Text
            fontSize="$6"
            fontWeight="700"
            fontFamily="$heading"
            marginTop="$4"
            color="$color"
          >
            No messages yet
          </Text>
          <Text
            fontSize="$4"
            color="$colorSecondary"
            fontFamily="$body"
            marginTop="$2"
            textAlign="center"
          >
            Your conversations with restaurants and support will appear here.
          </Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top, 50)}
    >
      <XStack
        alignItems="center"
        paddingHorizontal="$5"
        paddingBottom="$4"
        gap="$3"
      >
        <BackButton />
        <Text
          fontSize="$6"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
        >
          Messages
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" gap="$5">
          <YStack backgroundColor="$backgroundSoft" borderRadius="$5" overflow="hidden">
            {conversations.map((chat, idx) => (
              <YStack key={chat.id}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(communication)/chat/${chat.id}`)
                  }
                  activeOpacity={0.7}
                >
                  <XStack padding="$4" gap="$3" alignItems="center">
                    <YStack
                      width={54}
                      height={54}
                      borderRadius="$full"
                      backgroundColor="$primaryLight"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize="$5" fontWeight="700" color="$primary">
                        {chat.type?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </YStack>

                    <YStack flex={1} gap="$1">
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text
                          fontSize="$4"
                          fontWeight="700"
                          fontFamily="$heading"
                          color="$color"
                        >
                          {chat.type === 'support' ? 'Support' : `Conversation`}
                        </Text>
                        <Text
                          fontSize="$2"
                          color="$colorSecondary"
                          fontFamily="$body"
                        >
                          {chat.updated_at
                            ? new Date(chat.updated_at).toLocaleDateString()
                            : ''}
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text
                          fontSize="$3"
                          color="$colorSecondary"
                          fontFamily="$body"
                          numberOfLines={1}
                          flex={1}
                        >
                          {chat.status === 'open' ? 'Open' : chat.status}
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>
                </TouchableOpacity>
                {idx < conversations.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>

        </YStack>
      </ScrollView>
    </YStack>
  );
}
