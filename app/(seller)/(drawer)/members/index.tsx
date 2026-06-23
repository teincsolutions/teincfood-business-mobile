// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl, TextInput } from "react-native";
import { YStack, XStack, Text, Card, Avatar, Sheet, Separator, Button, Input } from "tamagui";
import { UserPlus, X, ChevronRight, Mail, Phone } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import {
  useBusinessMembersQuery,
  useInviteMemberMutation,
  useRemoveMemberMutation,
} from "@/hooks/useBusinessMembers";

const ROLE_LABELS = {
  chief: "Owner",
  sales: "Admin",
  manager: "Staff",
};

const ROLE_COLORS = {
  chief: "$yellow9",
  sales: "$blue9",
  manager: "$gray9",
};

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { data: response, isLoading, refetch, isRefetching } = useBusinessMembersQuery();
  const inviteMember = useInviteMemberMutation();
  const removeMember = useRemoveMemberMutation();

  const members = response?.data ?? [];
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);

  const handleInvite = () => {
    const data = {};
    if (inviteEmail.trim()) data.email = inviteEmail.trim();
    if (invitePhone.trim()) data.phone = invitePhone.trim();
    if (!data.email && !data.phone) return;
    data.role = inviteRole;
    inviteMember.mutate(data, {
      onSuccess: () => {
        setInviteSheetOpen(false);
        setInviteEmail("");
        setInvitePhone("");
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
        <Button icon={<UserPlus size={18} />} backgroundColor="$primary" onPress={() => setInviteSheetOpen(true)}>
          Invite
        </Button>
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
              {item.role !== "chief" && (
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
      <Sheet modal open={inviteSheetOpen} onOpenChange={setInviteSheetOpen} snapPoints={[60]} dismissOnSnapToBottom zIndex={200_000}>
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">Invite Member</Text>
            <YStack gap="$1">
              <XStack gap="$2" alignItems="center"><Mail size={16} color="$colorMuted" /><Text fontSize="$3" color="$colorMuted">Email</Text></XStack>
              <Input
                placeholder="member@example.com"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </YStack>
            <YStack gap="$1">
              <XStack gap="$2" alignItems="center"><Phone size={16} color="$colorMuted" /><Text fontSize="$3" color="$colorMuted">Phone (optional)</Text></XStack>
              <Input
                placeholder="+233XXXXXXXXX"
                value={invitePhone}
                onChangeText={setInvitePhone}
                keyboardType="phone-pad"
              />
            </YStack>
            <YStack gap="$1">
              <Text fontSize="$3" color="$colorMuted">Role</Text>
              <XStack gap="$2" flexWrap="wrap">
                {[
                  { value: "sales", label: "Admin" },
                  { value: "manager", label: "Staff" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    flex={1}
                    backgroundColor={inviteRole === option.value ? "$primary" : "$gray3"}
                    color={inviteRole === option.value ? "white" : "$color"}
                    onPress={() => setInviteRole(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </XStack>
            </YStack>
            <Button backgroundColor="$primary" onPress={handleInvite} disabled={!inviteEmail.trim() && !invitePhone.trim()}>
              {inviteMember.isPending ? "Sending..." : "Send Invitation"}
            </Button>
            <Button variant="outline" onPress={() => setInviteSheetOpen(false)}>Cancel</Button>
          </YStack>
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
