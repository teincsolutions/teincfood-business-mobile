// @ts-nocheck
import { useRouter } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Image, Separator, Input } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MessageSquare, ChevronRight } from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { useInboxConversationsQuery } from "@/services/messages.service";

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: conversationsData } = useInboxConversationsQuery();
  const conversations = conversationsData || [];

  if (conversations.length === 0) {
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
      {/* Header */}
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
          {/* Search Bar */}
          <XStack
          flex={1}
            alignItems="center"
            backgroundColor="$backgroundSoft"
            borderRadius="$4"
            paddingHorizontal="$4"
            height={50}
          >
            <Search size={20} color="$colorSecondary" />
            <Input
              flex={1}
              placeholder="Search messages..."
              backgroundColor="transparent"
              borderWidth={0}
              height={50}
              paddingHorizontal="$2"
            />
          </XStack>

          {/* Conversation List */}
          <YStack backgroundColor="$backgroundSoft" borderRadius="$5" overflow="hidden">
            {conversations.map((chat, idx) => (
              <YStack  key={chat.id}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(communication)/chat/${chat.id}`)
                  }
                  activeOpacity={0.7}
                >
                  <XStack padding="$4" gap="$3" alignItems="center">
                    <YStack position="relative">
                      <Image
                        source={{ uri: chat.avatar }}
                        width={54}
                        height={54}
                        borderRadius="$full"
                      />
                      {chat.unreadCount > 0 && (
                        <YStack
                          position="absolute"
                          top={0}
                          right={0}
                          width={14}
                          height={14}
                          borderRadius="$full"
                          backgroundColor="$primary"
                          borderWidth={2}
                          borderColor="$white"
                        />
                      )}
                    </YStack>

                    <YStack flex={1} gap="$1">
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text
                          fontSize="$4"
                          fontWeight="700"
                          fontFamily="$heading"
                          color="$color"
                        >
                          {chat.name}
                        </Text>
                        <Text
                          fontSize="$2"
                          color="$colorSecondary"
                          fontFamily="$body"
                        >
                          {chat.time}
                        </Text>
                      </XStack>
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text
                          fontSize="$3"
                          color={
                            chat.unreadCount > 0 ? "$color" : "$colorSecondary"
                          }
                          fontWeight={chat.unreadCount > 0 ? "700" : "400"}
                          fontFamily="$body"
                          numberOfLines={1}
                          flex={1}
                        >
                          {chat.lastMessage}
                        </Text>
                        {chat.unreadCount > 0 && (
                          <YStack
                            backgroundColor="$primary"
                            minWidth={20}
                            height={20}
                            borderRadius="$full"
                            justifyContent="center"
                            alignItems="center"
                            paddingHorizontal="$1"
                            marginLeft="$2"
                          >
                            <Text fontSize={10} fontWeight="800" color="$white">
                              {chat.unreadCount}
                            </Text>
                          </YStack>
                        )}
                      </XStack>
                    </YStack>
                  </XStack>
                </TouchableOpacity>
                {idx < conversations.length - 1 && (
                  <Separator/>
                )}
              </YStack>
            ))}
          </YStack>

          {/* Support Section */}
          <YStack
            backgroundColor="$orangeMuted"
            padding="$5"
            borderRadius="$5"
            gap="$3"
            borderWidth={1}
            borderColor="$orange"
            marginTop="$2"
          >
            <XStack gap="$3" alignItems="center">
              <YStack backgroundColor="$white" padding="$2" borderRadius="$3">
                <MessageSquare size={24} color="$primary" />
              </YStack>
              <YStack flex={1}>
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$color"
                >
                  24/7 Support
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Need help? Talk to our team.
                </Text>
                <Button
                  variant="primary"
                  flex={1}
                  marginTop="$2"
                  onPress={() => router.push(`/(communication)/chat/support`)}
                >
                  Chat
                </Button>
              </YStack>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
