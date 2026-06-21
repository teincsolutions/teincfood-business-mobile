// @ts-nocheck
import { useRouter } from "expo-router";
import { FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { YStack, XStack, Text, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageSquare } from "@tamagui/lucide-icons";
import { BackButton } from "@/components/ui";
import { useInboxConversations } from "@/hooks/useChat";

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isRefetching, refetch } = useInboxConversations();
  const allConversations = data?.data ?? [];
  const conversations = allConversations.filter((c) => c.type !== 'support');

  const renderConversation = ({ item: chat, index }) => (
    <YStack>
      <TouchableOpacity
        onPress={() => router.push(`/(communication)/chat/${chat.id}`)}
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
              <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                {chat.type === 'support' ? 'Support' : 'Conversation'}
              </Text>
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString() : ''}
              </Text>
            </XStack>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" numberOfLines={1} flex={1}>
                {chat.status === 'open' ? 'Open' : chat.status}
              </Text>
            </XStack>
          </YStack>
        </XStack>
      </TouchableOpacity>
      {index < conversations.length - 1 && <Separator />}
    </YStack>
  );

  const ListEmptyComponent = () => (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$10">
      <MessageSquare size={80} color="$gray200" />
      <Text fontSize="$6" fontWeight="700" fontFamily="$heading" marginTop="$4" color="$color">
        No messages yet
      </Text>
      <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" marginTop="$2" textAlign="center">
        Your conversations with restaurants and support will appear here.
      </Text>
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Messages
        </Text>
      </XStack>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          paddingHorizontal: 20,
          flexGrow: 1,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </YStack>
  );
}
