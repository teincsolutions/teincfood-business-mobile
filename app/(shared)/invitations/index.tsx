// @ts-nocheck
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MailOpen, Clock, ChevronRight } from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import {
  useNotificationsQuery,
  useNotificationsStream,
} from "@/hooks/useNotifications";
import { NotificationActionCard } from "@/components/notifications/NotificationActionCard";

export default function InvitationsScreen() {
  const insets = useSafeAreaInsets();
  const { data: notifications = [], refetch, isRefetching } = useNotificationsQuery();
  useNotificationsStream(true);

  const pendingInvites = notifications.filter(
    (n) =>
      n.payload?.action_required === "true" &&
      (n.payload?.notification_category === "rider_invitation" ||
        n.payload?.notification_category === "business_member_invitation"),
  );

  const renderInvite = ({ item }: { item: (typeof notifications)[0] }) => (
    <Card padding="$4" bordered marginBottom="$3">
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">
          {item.title}
        </Text>
        <Text fontSize="$3" color="$colorMuted">
          {item.message}
        </Text>
        <Text fontSize="$2" color="$colorMuted">
          {item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : ""}
        </Text>
        <NotificationActionCard notification={item} onDone={() => {}} />
      </YStack>
    </Card>
  );

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack
        padding="$4"
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text fontSize="$7" fontWeight="bold">
          Invitations
        </Text>
        {pendingInvites.length > 0 && (
          <YStack
            backgroundColor="$primary"
            borderRadius="$10"
            minWidth={24}
            height={24}
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$2"
          >
            <Text color="white" fontSize="$2" fontWeight="bold">
              {pendingInvites.length}
            </Text>
          </YStack>
        )}
      </XStack>

      <FlatList
        data={pendingInvites}
        keyExtractor={(item) => item.id}
        renderItem={renderInvite}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
        ListEmptyComponent={
          <YStack alignItems="center" paddingVertical="$10" gap="$4">
            <Clock size={48} color="$colorMuted" />
            <Text fontSize="$5" color="$colorMuted">
              No pending invitations
            </Text>
            <Text fontSize="$4" color="$colorMuted" textAlign="center">
              When a business sends you an invitation, it will appear here.
            </Text>
          </YStack>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
          />
        }
      />
    </YStack>
  );
}
