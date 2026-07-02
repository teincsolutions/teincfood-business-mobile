// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MailOpen, Clock, CheckCircle } from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import {
  useNotificationsQuery,
  useNotificationsStream,
} from "@/hooks/useNotifications";
import { NotificationActionCard } from "@/components/notifications/NotificationActionCard";
import { useRemoveMemberMutation } from "@/hooks/useBusinessMembers";
import { extractApiErrorMessage } from "@/utils/error";
import { toast } from "sonner-native";

export default function InvitationsScreen() {
  const insets = useSafeAreaInsets();
  const { data: notifications = [], refetch, isRefetching } = useNotificationsQuery();
  useNotificationsStream(true);

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);
  const removeMember = useRemoveMemberMutation();

  const markDone = (id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
  };

  const markJoined = (id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    setJoinedIds((prev) => new Set(prev).add(id));
  };

  const pendingInvites = notifications.filter(
    (n) =>
      !completedIds.has(n.id) &&
      n.payload?.action_required === "true" &&
      (n.payload?.notification_category === "rider_invitation" ||
        n.payload?.notification_category === "business_member_invitation"),
  );

  const joinedInvites = notifications.filter(
    (n) =>
      joinedIds.has(n.id) &&
      (n.payload?.notification_category === "rider_invitation" ||
        n.payload?.notification_category === "business_member_invitation"),
  );

  const handleConfirmLeave = () => {
    if (!confirmLeave) return;
    removeMember.mutate(confirmLeave, {
      onSuccess: () => {
        toast.success("Left the business");
        setJoinedIds((prev) => {
          const next = new Set(prev);
          next.delete(confirmLeave);
          return next;
        });
        setConfirmLeave(null);
      },
      onError: (err) => {
        toast.error(extractApiErrorMessage(err));
        setConfirmLeave(null);
      },
    });
  };

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
        <NotificationActionCard
          notification={item}
          onDone={() => markJoined(item.id)}
        />
      </YStack>
    </Card>
  );

  const renderJoined = ({ item }: { item: (typeof notifications)[0] }) => (
    <Card padding="$4" bordered marginBottom="$3" backgroundColor="$green2">
      <YStack gap="$2">
        <XStack gap="$2" alignItems="center">
          <CheckCircle size={18} color="$green10" />
          <Text fontSize="$5" fontWeight="600" color="$green10">
            Joined
          </Text>
        </XStack>
        <Text fontSize="$3" color="$colorMuted">
          {item.title} — {item.message}
        </Text>
        <Button
          variant="outline"
          borderColor="$red10"
          color="$red10"
          size="$3"
          onPress={() => setConfirmLeave(item.id)}
        >
          Leave Business
        </Button>
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
        data={[...pendingInvites, ...joinedInvites]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          joinedIds.has(item.id) ? renderJoined({ item }) : renderInvite({ item })
        }
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

      <AppAlertDialog
        open={confirmLeave !== null}
        onOpenChange={() => setConfirmLeave(null)}
        title="Leave Business"
        description="Are you sure you want to leave this business? You may need a new invitation to rejoin."
        confirmText="Leave"
        isDestructive
        onConfirm={handleConfirmLeave}
      />
    </YStack>
  );
}
