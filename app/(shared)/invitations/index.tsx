// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Clock, CheckCircle } from "@tamagui/lucide-icons";
import { BackButton, Button, FormInput, DrawerToggleButton } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { toast } from "sonner-native";
import {
  useUserInvitationsQuery,
  useLeaveBusinessMutation,
  useAcceptBusinessInvitationMutation,
  useAcceptFleetInvitationMutation,
  useDeclineBusinessInvitationMutation,
  extractApiErrorMessage,
} from "@teincfood/core";
import { useRefreshBusinesses } from "@/hooks/useRefreshBusinesses";

export default function InvitationsScreen({ embedded = false }: { embedded?: boolean }) {
  const insets = useSafeAreaInsets();
  const { code: linkedCode } = useLocalSearchParams<{ code?: string }>();
  const { data: invitesRes, refetch, isRefetching } = useUserInvitationsQuery();
  const leaveBusiness = useLeaveBusinessMutation();
  const acceptMember = useAcceptBusinessInvitationMutation();
  const acceptFleet = useAcceptFleetInvitationMutation();
  const declineMember = useDeclineBusinessInvitationMutation();
  const refreshBusinesses = useRefreshBusinesses();

  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null);
  const [confirmDeclineCode, setConfirmDeclineCode] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [manualCode, setManualCode] = useState(
    typeof linkedCode === "string" ? linkedCode : "",
  );

  const invitations = invitesRes?.data ?? [];

  // `business_owner` is the owner's own business and `rider_linked` is an
  // already-accepted relationship. Neither is a pending team invitation;
  // showing them as pending made owners look like invitees and offered a
  // "Leave Business" action for their own business.
  const isInvitationType = (type: string) =>
    type === "business_member" || type === "fleet_rider";

  const pending = invitations.filter(
    (i) =>
      isInvitationType(i.type) &&
      i.status === "pending" &&
      !confirmedIds.has(i.id),
  );

  const joined = invitations.filter(
    (i) =>
      i.type !== "business_owner" &&
      (i.status === "accepted" || i.status === "active"),
  );

  const markDone = (id: string) =>
    setConfirmedIds((prev) => new Set(prev).add(id));

  // Hide every pending row for a business once any of its codes is accepted —
  // email + phone invites are separate rows for the same business.
  const markBusinessDone = (businessId: string | null | undefined) => {
    if (!businessId) return;
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      for (const i of invitations) {
        if (
          i.business_id === businessId &&
          isInvitationType(i.type) &&
          i.status === "pending"
        ) {
          next.add(i.id);
        }
      }
      return next;
    });
  };

  const businessIdOf = (res: unknown): string | null => {
    const data = (res as { data?: { business_id?: string } } | null)?.data;
    return data?.business_id ?? null;
  };

  const acceptByCode = (
    code: string,
    itemId: string | null,
    onError?: (msg: string) => void,
  ) => {
    const matched = itemId ? pending.find((i) => i.id === itemId) ?? null : null;
    const onAccepted = (res: unknown) => {
      markBusinessDone(matched?.business_id ?? businessIdOf(res));
      if (itemId) markDone(itemId);
      toast.success("Invitation accepted!");
      void refreshBusinesses(matched?.business_id ?? businessIdOf(res));
    };
    // Member endpoint first; fleet codes fall through to the fleet endpoint.
    acceptMember.mutate(
      { code },
      {
        onSuccess: onAccepted,
        onError: () => {
          acceptFleet.mutate(
            { code },
            {
              onSuccess: onAccepted,
              onError: (e2) => {
                const msg = extractApiErrorMessage(e2);
                console.debug("[Invitations] accept failed", e2);
                if (onError) onError(msg);
                else toast.error(msg);
              },
            },
          );
        },
      },
    );
  };

  const submitManualCode = () => {
    const code = manualCode.trim();
    if (!/^[0-9]{6}$/.test(code)) {
      toast.error("Enter the 6-digit code from your invitation");
      return;
    }
    const match = pending.find((i) => i.code === code);
    acceptByCode(code, match ? match.id : null);
  };

  const handleConfirmLeave = () => {
    if (!confirmLeaveId) return;
    leaveBusiness.mutate(confirmLeaveId, {
      onSettled: () => {
        setConfirmLeaveId(null);
        void refreshBusinesses(null);
      },
    });
  };

  const handleConfirmDecline = () => {
    if (!confirmDeclineCode) return;
    const code = confirmDeclineCode;
    declineMember.mutate(
      { code },
      {
        onSuccess: () => {
          const match = pending.find((i) => i.code === code);
          if (match) markDone(match.id);
          toast.success("Invitation declined");
        },
        onError: (e) => {
          console.debug("[Invitations] decline failed", e);
          toast.error(extractApiErrorMessage(e));
        },
        onSettled: () => setConfirmDeclineCode(null),
      },
    );
  };

  const busy =
    acceptMember.isPending || acceptFleet.isPending || declineMember.isPending;

  const renderPending = ({ item }) => {
    const isFleet = item.type === "fleet_rider";
    return (
      <Card padding="$4" bordered marginBottom="$3">
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            {item.business_name || "Business"}
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {isFleet
              ? "Invited to join as a delivery rider"
              : `Invited to join as a team member${item.role ? ` • ${item.role}` : ""}`}
          </Text>
          <Text fontSize="$2" color="$colorMuted">
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString()
              : ""}
          </Text>
          <XStack gap="$2" marginTop="$1">
            <YStack flex={1}>
              <Button
                loading={busy}
                disabled={busy}
                onPress={() => item.code && acceptByCode(item.code, item.id)}
              >
                Accept
              </Button>
            </YStack>
            {isFleet ? null : (
              <YStack flex={1}>
                <Button
                  variant="outline"
                  loading={false}
                  disabled={busy}
                  onPress={() => item.code && setConfirmDeclineCode(item.code)}
                >
                  Decline
                </Button>
              </YStack>
            )}
          </XStack>
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
            variant="danger"
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
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        {embedded ? <DrawerToggleButton /> : <BackButton />}
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
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

      <YStack flex={1} width="100%" maxWidth={600} alignSelf="center">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.status === "pending"
            ? renderPending({ item })
            : renderJoined({ item })
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
        ListHeaderComponent={
          <Card padding="$4" bordered marginBottom="$3">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="600">
                Have a code?
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                Enter the 6-digit code from your email or SMS invitation.
              </Text>
              <FormInput
                label="Invitation code"
                value={manualCode}
                onChangeText={(v) => setManualCode(v.replace(/\D/g, "").slice(0, 6))}
                keyboardType="numeric"
                placeholder="123456"
              />
              <Button
                loading={busy}
                disabled={busy || manualCode.trim().length !== 6}
                onPress={submitManualCode}
              >
                Use code
              </Button>
            </YStack>
          </Card>
        }
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
      </YStack>

      <AppAlertDialog
        open={confirmLeaveId !== null}
        onOpenChange={() => setConfirmLeaveId(null)}
        title="Leave Business"
        description="Are you sure you want to leave this business? You may need a new invitation to rejoin."
        confirmText="Leave"
        isDestructive
        onConfirm={handleConfirmLeave}
      />

      <AppAlertDialog
        open={confirmDeclineCode !== null}
        onOpenChange={() => setConfirmDeclineCode(null)}
        title="Decline invitation"
        description="This invitation will be removed. The business can invite you again later."
        confirmText="Decline"
        isDestructive
        onConfirm={handleConfirmDecline}
      />
    </YStack>
  );
}
