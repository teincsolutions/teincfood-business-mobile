// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clock } from "@tamagui/lucide-icons";
import { BackButton } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import {
  useUserInvitationsQuery,
  useLeaveBusinessMutation,
} from "@/hooks/useInvitations";
import { NotificationActionCard } from "@/components/notifications/NotificationActionCard";
import { useNotificationsQuery } from "@/hooks/useNotifications";

export default function InvitationsScreen() {
  const insets = useSafeAreaInsets();
  const { data: invitesRes, refetch, isRefetching } = useUserInvitationsQuery();
  const { data: notifications = [] } = useNotificationsQuery();
  const leaveBusiness = useLeaveBusinessMutation();

  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const invitations = invitesRes?.data ?? [];

  const pending = invitations.filter(
    (i) => i.status === "pending" && !confirmedIds.has(i.id),
  );

  const joined = invitations.filter(
    (i) => i.status === "accepted" || i.status === "active",
  );

  const handleConfirmLeave = () => {
    if (!confirmLeaveId) return;
    leaveBusiness.mutate(confirmLeaveId, {
      onSettled: () => setConfirmLeaveId(null),
    });
  };

  const renderPending = ({ item }) => {
    // Find matching notification for the accept/dismiss buttons
    const matchingNotif = notifications.find(
      (n) =>
        n.payload?.code === item.code &&
        n.payload?.notification_category ===
          (item.type === "fleet_rider" ? "rider_invitation" : "business_member_invitation"),
    );

    return (
      <Card padding="$4" bordered marginBottom="$3">
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            {item.business_name || "Business"}
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {item.type === "fleet_rider"
              ? "Invited to join as a delivery rider"
              : "Invited to join as a team member"}
          </Text>
          <Text fontSize="$2" color="$colorMuted">
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : ""}
          </Text>
          {matchingNotif && (
            <NotificationActionCard
              notification={matchingNotif}
              onDone={() => setConfirmedIds((prev) => new Set(prev).add(item.id))}
            />
          )}
        </YStack>
      </Card>
    );
  };

  const renderJoined = ({ item }) => (
    <Card padding="$4" bordered marginBottom="$3" backgroundColor="$green2">
      <YStack gap="$2">
        <XStack gap="$2" alignItems="center">
          <CheckCircle size={18} color="$green10" />
          <Text fontSize="$5" fontWeight="600" color="$green10">
            Joined
          </Text>
        </XStack>
        <Text fontSize="$3" color="$colorMuted">
          {item.business_name || "Business"}
        </Text>
        {item.role && (
          <Text fontSize="$3" color="$colorMuted">
            Role: {item.role}
          </Text>
        )}
        {item.is_fleet_managed ? (
          <YStack
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            backgroundColor="$yellow2"
          >
            <Text fontSize="$3" color="$yellow10">
              Fleet-managed — contact your fleet manager to leave
            </Text>
          </YStack>
        ) : (
          <Button
            variant="outline"
            borderColor="$red10"
            color="$red10"
            size="$3"
            onPress={() => setConfirmLeaveId(item.id)}
            disabled={leaveBusiness.isPending}
          >
            Leave Business
          </Button>
        )}
      </YStack>
    </Card>
  );

  const data = [...pending, ...joined];

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
        {pending.length > 0 && (
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
              {pending.length}
            </Text>
          </YStack>
        )}
      </XStack>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.status === "pending" ? renderPending({ item }) : renderJoined({ item })
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
        ListEmptyComponent={
          <YStack alignItems="center" paddingVertical="$10" gap="$4">
            <Clock size={48} color="$colorMuted" />
            <Text fontSize="$5" color="$colorMuted">
              No invitations
            </Text>
            <Text fontSize="$4" color="$colorMuted" textAlign="center">
              When a business sends you an invitation, it will appear here.
            </Text>
          </YStack>
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      />

      <AppAlertDialog
        open={confirmLeaveId !== null}
        onOpenChange={() => setConfirmLeaveId(null)}
        title="Leave Business"
        description="Are you sure you want to leave this business? You may need a new invitation to rejoin."
        confirmText="Leave"
        isDestructive
        onConfirm={handleConfirmLeave}
      />
    </YStack>
  );
}
