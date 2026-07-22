// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl, TextInput } from "react-native";
import { YStack, XStack, Text, Card, Avatar, Sheet, Separator, Button, Input, ScrollView } from "tamagui";
import { UserPlus, X, ChevronRight, Mail, Phone, Check } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import {
  useBusinessMembersQuery,
  useInviteMemberMutation,
  useRemoveMemberMutation,
} from "@/hooks/useBusinessMembers";
import { useBusinessRolesQuery } from "@/hooks/useRoles";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";

const ROLE_LABELS: Record<string, string> = {
  chief: "Chef",
  sales: "Sales",
  manager: "Manager",
};

const ROLE_COLORS = {
  chief: "$orange9",
  sales: "$blue9",
  manager: "$green9",
};

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { data: response, isLoading, refetch, isRefetching } = useBusinessMembersQuery();
  const { data: rolesData } = useBusinessRolesQuery();
  const inviteMember = useInviteMemberMutation();
  const removeMember = useRemoveMemberMutation();

  const members = response?.data ?? [];
  const roles = rolesData?.data ?? {};
  const canManageMembers = useHasCapability('business_members_manage');
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  const handleInvite = () => {
    const identifier = inviteIdentifier.trim();
    if (!identifier) return;
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
      },
    });
  };

  const handleRemove = () => {
    if (removingMember) {
      removeMember.mutate(removingMember.user_id);
      setRemoveDialogOpen(false);
      setRemovingMember(null);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      {/* Header */}
      <XStack padding="$4" alignItems="center" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">Members</Text>
        </YStack>
        {canManageMembers && (
          <Button icon={<UserPlus size={18} />} backgroundColor="$primary" onPress={() => setInviteSheetOpen(true)}>
            Invite
          </Button>
        )}
      </XStack>

      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        refreshControl={<RefreshControl refreshing={isRefetching || isLoading} onRefresh={refetch} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$8" gap="$3">
            <UserPlus size={48} color="$gray5" />
            <Text color="$colorMuted" fontSize="$5">No members yet</Text>
            <Text color="$colorMuted" textAlign="center">Invite staff to help manage your business</Text>
          </YStack>
        }
        renderItem={({ item }) => (
          <Card padding="$4" bordered>
            <XStack alignItems="center" gap="$3">
              <Avatar circular size="$5">
                <Avatar.Fallback backgroundColor={ROLE_COLORS[item.role] || "$gray9"} />
              </Avatar>
              <YStack flex={1}>
                <Text fontWeight="bold">{item.user?.full_name || "Pending"}</Text>
                <Text fontSize="$3" color="$colorMuted">{item.user?.email || "Invitation sent"}</Text>
              </YStack>
              <YStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2" backgroundColor={ROLE_COLORS[item.role] || "$gray9"}>
                <Text fontSize="$2" color="white" fontWeight="600">{ROLE_LABELS[item.role] || item.role}</Text>
              </YStack>
              {item.role !== "chief" && canManageMembers && (
                <Button
                  size="$3"
                  icon={<X size={14} />}
                  backgroundColor="$red10"
                  onPress={() => { setRemovingMember(item); setRemoveDialogOpen(true); }}
                />
              )}
            </XStack>
          </Card>
        )}
      />

      {/* Invite Sheet */}
      <Sheet modal open={inviteSheetOpen} onOpenChange={setInviteSheetOpen} snapPoints={[75]} dismissOnSnapToBottom zIndex={200_000}>
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <ScrollView>
            <YStack padding="$6" gap="$4">
              <Text fontSize="$6" fontWeight="bold">Invite Member</Text>
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

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">Select a Role</Text>
                <YStack gap="$2">
                  {Object.entries(roles).map(([key, role]: [string, any]) => {
                    const selected = inviteRole === key;
                    const color = ROLE_COLORS[key];
                    const caps = role.capabilities ?? [];
                    return (
                      <XStack
                        key={key}
                        backgroundColor={selected ? "$backgroundSoft" : "$background"}
                        borderColor={selected ? color : "$borderColor"}
                        borderWidth={selected ? 2 : 1}
                        borderRadius="$4"
                        overflow="hidden"
                        pressStyle={{ opacity: 0.8, backgroundColor: "$backgroundHover" }}
                        onPress={() => setInviteRole(key)}
                        cursor="pointer"
                      >
                        <YStack width={selected ? 4 : 0} backgroundColor={color} />
                        <YStack flex={1} padding="$3.5" gap="$1.5">
                          <Text fontWeight={selected ? "bold" : "500"} fontSize="$4">
                            {role.label}
                          </Text>
                          {caps.slice(0, 4).map((cap: { key: string; label: string }) => (
                            <XStack key={cap.key} gap="$1.5" alignItems="center">
                              <Check size={11} color="$green10" />
                              <Text fontSize="$2" color="$colorMuted">{cap.label}</Text>
                            </XStack>
                          ))}
                          {caps.length > 4 && (
                            <Text fontSize="$2" color="$colorMuted" fontStyle="italic">
                              +{caps.length - 4} more...
                            </Text>
                          )}
                        </YStack>
                      </XStack>
                    );
                  })}
                </YStack>
              </YStack>

              <Button backgroundColor="$primary" onPress={handleInvite} disabled={!inviteIdentifier.trim()}>
                {inviteMember.isPending ? "Sending..." : "Send Invitation"}
              </Button>
              <Button variant="outline" onPress={() => setInviteSheetOpen(false)}>Cancel</Button>
            </YStack>
          </ScrollView>
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
    </YStack>
  );
}
