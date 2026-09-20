// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl, TextInput } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Sheet,
  Separator,
  Input,
  useMedia,
} from "tamagui";
import {
  UserPlus,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Check,
  Users,
  ClipboardList,
  CheckCheck,
  Eye,
  Ban,
  CookingPot,
  ClipboardCheck,
  CreditCard,
  Truck,
  BarChart3,
  Receipt,
  ArrowUpRight,
  Menu,
  Tag,
  Bike,
  Calculator,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { toast } from "sonner-native";
import {
  useBusinessMembersQuery,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useBusinessMemberInvitationsQuery,
  useRevokeMemberInvitationMutation,
  useDeleteMemberInvitationMutation,
  useResendMemberInvitationMutation,
  extractApiErrorMessage,
} from "@teincfood/core";
import { useBusinessRolesQuery } from "@teincfood/core";
import { useHasCapability, useMyBusinessCapabilities } from "@/hooks/useMyBusinessCapabilities";
import { usePlanLimit } from "@/hooks/usePlanLimit";

const ROLE_LABELS: Record<string, string> = {
  chief: "Chef",
  sales: "Sales",
  manager: "Manager",
  cashier: "Cashier",
};

const ROLE_COLORS: Record<string, string> = {
  chief: "$primary",
  sales: "$blue",
  manager: "$green",
  cashier: "$yellow",
};

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const media = useMedia();
  const {
    data: response,
    isLoading,
    refetch,
    isRefetching,
  } = useBusinessMembersQuery();
  const { data: rolesData } = useBusinessRolesQuery();
  const inviteMember = useInviteMemberMutation();
  const removeMember = useRemoveMemberMutation();
  const sentInvitesQuery = useBusinessMemberInvitationsQuery();
  const revokeInvite = useRevokeMemberInvitationMutation();
  const deleteInvite = useDeleteMemberInvitationMutation();
  const resendInvite = useResendMemberInvitationMutation();

  const members = response?.data ?? [];
  const roles = rolesData?.data ?? {};
  const canManageMembers = useHasCapability("business_members_manage");
  const { isLoading: capsLoading } = useMyBusinessCapabilities();
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");
  const [showAllCaps, setShowAllCaps] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const sentInvites: any[] =
    (sentInvitesQuery.data as any)?.data ??
    (Array.isArray(sentInvitesQuery.data) ? (sentInvitesQuery.data as any) : []);

  // Plan gate (backend counts active members + pending invitations).
  const { limit: memberLimit, atCap: atMemberCap } = usePlanLimit(
    "limits.members",
    members.length + sentInvites.length,
  );

  const handleInvite = () => {
    if (inviteMember.isPending) return;
    const identifier = inviteIdentifier.trim();
    if (!identifier) return;
    // Plan gate mirrors the backend (active members + pending invites).
    if (atMemberCap) {
      toast.error(`Member limit reached (${memberLimit} on your plan). Upgrade to invite more.`);
      return;
    }
    const data: Record<string, string> = { role: inviteRole };
    if (identifier.includes("@")) {
      data.email = identifier;
    } else {
      data.phone = identifier;
    }
    inviteMember.mutate(data, {
      onSuccess: () => {
        setInviteSheetOpen(false);
        setInviteIdentifier("");
        setInviteRole("manager");
        setShowAllCaps(false);
      },
    });
  };

  const handleRemove = () => {
    if (removeMember.isPending || !removingMember) return;
    removeMember.mutate(removingMember.user_id);
    setRemoveDialogOpen(false);
    setRemovingMember(null);
  };

  const handleResend = (invite: any) => {
    setResendingId(invite.id);
    resendInvite.mutate(invite.id, {
      onSuccess: () => toast.success("Invitation resent"),
      onError: (e) => {
        console.debug("[Members] resend failed", e);
        toast.error(extractApiErrorMessage(e));
      },
      onSettled: () => setResendingId(null),
    });
  };

  const handleConfirmRevoke = () => {
    if (!revokeTarget) return;
    revokeInvite.mutate(revokeTarget.id);
    setRevokeTarget(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteInvite.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const renderSentInvite = ({ item }: { item: any }) => {
    const contact = item.invited_email || item.invited_phone || "—";
    const isPending = item.status === "pending";
    return (
      <Card padding="$3" bordered>
        <XStack alignItems="center" gap="$3">
          <YStack flex={1} gap="$1">
            <Text fontWeight="600" fontSize="$4">
              {contact}
            </Text>
            <Text fontSize="$2" color="$colorMuted">
              {`${ROLE_LABELS[item.role] || item.role} • ${item.status}${item.expires_at ? ` • expires ${new Date(item.expires_at).toLocaleDateString()}` : ""}`}
            </Text>
          </YStack>
          {isPending && canManageMembers && (
            <XStack gap="$2">
              <Button
                size="$2"
                variant="outline"
                loading={resendingId === item.id}
                disabled={resendingId === item.id}
                onPress={() => handleResend(item)}
              >
                Resend
              </Button>
              <Button
                size="$2"
                variant="danger"
                loading={revokeInvite.isPending}
                disabled={revokeInvite.isPending}
                onPress={() => setRevokeTarget(item)}
              >
                Revoke
              </Button>
            </XStack>
          )}
          {!isPending && item.status !== "accepted" && canManageMembers && (
            <Button
              size="$2"
              variant="dangerOutline"
              loading={deleteInvite.isPending}
              disabled={deleteInvite.isPending}
              onPress={() => setDeleteTarget(item)}
            >
              Delete
            </Button>
          )}
        </XStack>
      </Card>
    );
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top} {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center", width: "100%" } : {})}>
      {/* Header */}
      <XStack
        padding="$4"
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">
            Members
          </Text>
        </YStack>
        {canManageMembers && (
          <Button
            icon={<UserPlus size={18} />}
            variant="primary"
            onPress={() => setInviteSheetOpen(true)}
          >
            Invite
          </Button>
        )}
      </XStack>

      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isLoading}
            onRefresh={() => {
              refetch();
              void sentInvitesQuery.refetch();
            }}
          />
        }
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <>
            {!capsLoading && !canManageMembers && (
              <Card padding="$3" bordered marginBottom="$2" backgroundColor="$yellow2">
                <Text fontSize="$3" color="$yellow10">
                  Only business managers can invite, remove, or manage invitations for this business.
                </Text>
              </Card>
            )}
            {sentInvites.length === 0 ? null : (
              <YStack gap="$2" marginBottom="$2">
                <Text fontSize="$5" fontWeight="700">
                  {`Sent invitations (${sentInvites.length})`}
                </Text>
                {sentInvites.map((invite) => (
                  <YStack key={invite.id}>
                    {renderSentInvite({ item: invite })}
                  </YStack>
                ))}
              </YStack>
            )}
          </>
        }
        ListEmptyComponent={
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$8"
            gap="$3"
          >
            <UserPlus size={48} color="$gray5" />
            <Text color="$colorMuted" fontSize="$5">
              No members yet
            </Text>
            <Text color="$colorMuted" textAlign="center">
              Invite staff to help manage your business
            </Text>
          </YStack>
        }
        renderItem={({ item }) => (
          <Card padding="$4" bordered>
            <XStack alignItems="center" gap="$3">
              <Avatar circular size="$5">
                <Avatar.Fallback
                  backgroundColor={ROLE_COLORS[item.role] || "$gray9"}
                />
              </Avatar>
              <YStack flex={1}>
                <Text fontWeight="bold">
                  {item.user?.full_name || "Pending"}
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  {item.user?.email || "Invitation sent"}
                </Text>
              </YStack>
              <YStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                backgroundColor={ROLE_COLORS[item.role] || "$gray9"}
              >
                <Text fontSize="$2" color="white" fontWeight="600">
                  {ROLE_LABELS[item.role] || item.role}
                </Text>
              </YStack>
              {item.role !== "chief" && canManageMembers && (
                <Button
                  size="$3"
                  icon={({ color, size }) => <X size={size} color={color} />}
                  variant="danger"
                  onPress={() => {
                    setRemovingMember(item);
                    setRemoveDialogOpen(true);
                  }}
                />
              )}
            </XStack>
          </Card>
        )}
      />

      {/* Invite Sheet */}
      <Sheet
        modal
        open={inviteSheetOpen}
        onOpenChange={setInviteSheetOpen}
        snapPoints={[75]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <Sheet.ScrollView>
            <YStack padding="$6" gap="$4">
              <Text fontSize="$6" fontWeight="bold">
                Invite Member
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                Enter the member's email or phone number
              </Text>

              <Input
                placeholder="Email or phone number"
                value={inviteIdentifier}
                onChangeText={setInviteIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <YStack gap="$3">
                <Text fontSize="$3" fontWeight="600" color="$colorMuted">
                  Select a Role
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {Object.entries(roles).map(([key, role]: [string, any]) => {
                    const selected = inviteRole === key;
                    const roleColor = ROLE_COLORS[key] || "$primary";
                    const capCount = (role.capabilities ?? []).length;
                    return (
                      <Card
                        key={key}
                        bordered
                        flex={1}
                        minWidth={100}
                        backgroundColor={selected ? roleColor : "$background"}
                        borderColor={selected ? roleColor : "$borderColor"}
                        borderWidth={selected ? 2 : 1}
                        borderRadius="$4"
                        pressStyle={{ opacity: 0.85 }}
                        onPress={() => {
                          setInviteRole(key);
                          setShowAllCaps(false);
                        }}
                        cursor="pointer"
                      >
                        <YStack alignItems="center" gap="$1" padding="$2.5">
                          <Text
                            fontSize="$4"
                            fontWeight={selected ? "bold" : "500"}
                            textAlign="center"
                          >
                            {role.label}
                          </Text>
                          <Text
                            fontSize="$2"
                            color={selected ? "$color" : "$colorMuted"}
                            opacity={selected ? 0.8 : 1}
                          >
                            {capCount} {capCount === 1 ? "cap" : "caps"}
                          </Text>
                        </YStack>
                      </Card>
                    );
                  })}
                </XStack>
              </YStack>

              {inviteRole && roles[inviteRole] && (
                <Card
                  bordered
                  borderRadius="$4"
                  padding="$4"
                  backgroundColor="$backgroundSoft"
                >
                  <YStack gap="$3">
                    <XStack alignItems="center" gap="$2">
                      <YStack
                        width={3}
                        height={20}
                        borderRadius="$2"
                        backgroundColor={ROLE_COLORS[inviteRole] || "$gray9"}
                      />
                      <Text fontSize="$4" fontWeight="bold">
                        {roles[inviteRole].label} Capabilities
                      </Text>
                    </XStack>
                    <Separator />
                    <YStack gap="$1">
                      {(roles[inviteRole].capabilities ?? [])
                        .slice(0, showAllCaps ? undefined : 4)
                        .map((cap: { key: string; label: string }) => {
                          const IconComponent =
                            {
                              business_members_manage: Users,
                              orders_create: ClipboardList,
                              orders_accept: CheckCheck,
                              orders_read: Eye,
                              orders_reject: Ban,
                              orders_start_preparing: CookingPot,
                              orders_mark_ready: ClipboardCheck,
                              payments_process: CreditCard,
                              deliveries_assign: Truck,
                              deliveries_all: Truck,
                              finance_read: BarChart3,
                              finance_billing_manage: Receipt,
                              finance_withdraw: ArrowUpRight,
                              menu_manage: Menu,
                              promos_manage: Tag,
                              riders_manage: Bike,
                              tax_rules_manage: Calculator,
                            }[cap.key] || Check;
                          return (
                            <XStack
                              key={cap.key}
                              gap="$3"
                              alignItems="center"
                              paddingVertical="$2.5"
                            >
                              <YStack
                                width={32}
                                height={32}
                                borderRadius="$3"
                                backgroundColor="$gray3"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <IconComponent size={16} color="$color" />
                              </YStack>
                              <YStack flex={1}>
                                <Text fontSize="$3" fontWeight="500">
                                  {cap.label}
                                </Text>
                              </YStack>
                            </XStack>
                          );
                        })}
                      {(roles[inviteRole].capabilities ?? []).length > 4 && (
                        <XStack
                          gap="$2"
                          alignItems="center"
                          justifyContent="center"
                          paddingVertical="$3"
                          cursor="pointer"
                          pressStyle={{ opacity: 0.7 }}
                          onPress={() => setShowAllCaps(!showAllCaps)}
                        >
                          <Text fontSize="$3" fontWeight="600" color="$primary">
                            {showAllCaps
                              ? "Show less"
                              : `Show all ${(roles[inviteRole].capabilities ?? []).length} capabilities`}
                          </Text>
                          {showAllCaps ? (
                            <ChevronUp size={16} color="$primary" />
                          ) : (
                            <ChevronDown size={16} color="$primary" />
                          )}
                        </XStack>
                      )}
                    </YStack>
                  </YStack>
                </Card>
              )}

              <Button
                variant="primary"
                onPress={handleInvite}
                disabled={!inviteIdentifier.trim() || inviteMember.isPending}
              >
                {inviteMember.isPending ? "Sending..." : "Send Invitation"}
              </Button>
              <Button
                variant="outline"
                onPress={() => setInviteSheetOpen(false)}
              >
                Cancel
              </Button>
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>

      {/* Remove Confirmation */}
      <AppAlertDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Member"
        description={`Are you sure you want to remove ${removingMember?.user?.full_name || "this member"}?`}
        confirmText="Remove"
        isDestructive
        onConfirm={handleRemove}
      />

      {/* Revoke Confirmation */}
      <AppAlertDialog
        open={revokeTarget !== null}
        onOpenChange={() => setRevokeTarget(null)}
        title="Revoke invitation"
        description={`Cancel the pending invitation to ${revokeTarget?.invited_email || revokeTarget?.invited_phone || "this person"}?`}
        confirmText="Revoke"
        isDestructive
        onConfirm={handleConfirmRevoke}
      />

      {/* Delete Confirmation */}
      <AppAlertDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete invitation"
        description="Remove this invitation record? This cannot be undone."
        confirmText="Delete"
        isDestructive
        onConfirm={handleConfirmDelete}
      />
    </YStack>
  );
}
