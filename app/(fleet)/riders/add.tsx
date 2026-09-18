// @ts-nocheck
import { useState } from "react";
import { KeyboardAvoidingView, Platform, FlatList, Alert } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { BackButton, Button, FormInput } from "@/components/ui";
import { Mail, Phone, Clock, XCircle } from "@tamagui/lucide-icons";
import {
  useInviteRiderMutation,
  useFleetInvitationsQuery,
  useRevokeInvitationMutation,
  extractApiErrorMessage,
} from "@teincfood/core";
import { toast } from "sonner-native";

/**
 * Invite Rider — POST /business/riders/invite {email, phone}.
 * The rider receives a 6-digit code to redeem in Invitations.
 * Pending invites below can be revoked.
 */
export default function AddRiderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const inviteRider = useInviteRiderMutation();
  const { data: invitationsData, refetch } = useFleetInvitationsQuery();
  const revokeInvitation = useRevokeInvitationMutation();

  const invitations = invitationsData?.data ?? invitationsData ?? [];
  const pending = (Array.isArray(invitations) ? invitations : []).filter(
    (inv) => inv.status === "pending",
  );

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/(fleet)/riders");
    }
  };

  const handleInvite = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    inviteRider.mutate(
      {
        email: email.trim().toLowerCase(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Invitation sent to rider");
          setEmail("");
          setPhone("");
          refetch();
          goBack();
        },
        onError: (error: unknown) => {
          console.debug("[InviteRider] invite error", error);
          toast.error(extractApiErrorMessage(error as Error));
        },
      },
    );
  };

  const handleRevoke = (invitation) => {
    Alert.alert(
      "Revoke Invitation",
      `Revoke the invitation sent to ${invitation.invited_email ?? invitation.phone ?? "this rider"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () =>
            revokeInvitation.mutate(invitation.id, {
              onSuccess: () => {
                toast.success("Invitation revoked");
                refetch();
              },
              onError: (error: unknown) => {
                console.debug("[InviteRider] revoke error", error);
                toast.error(extractApiErrorMessage(error as Error));
              },
            }),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingBottom={Math.max(insets.bottom + 20, 24)}
        paddingTop={Math.max(insets.top + 8, 24)}
      >
        <XStack paddingHorizontal="$4" mb="$4" alignItems="center">
          <BackButton />
        </XStack>

        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListHeaderComponent={
            <YStack gap="$4" marginBottom="$5">
              <YStack gap="$2">
                <Text
                  fontSize="$8"
                  fontWeight="bold"
                  fontFamily="$heading"
                  color="$color"
                >
                  Invite Rider
                </Text>
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  The rider gets a 6-digit code to join your fleet. They can
                  also request to join with your fleet business number.
                </Text>
              </YStack>

              <FormInput
                label="Email"
                placeholder="rider@example.com"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setErrors((p) => {
                    const n = { ...p };
                    delete n.email;
                    return n;
                  });
                }}
                icon={<Mail size={20} color="$colorMuted" />}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />

              <FormInput
                label="Phone Number (Optional)"
                placeholder="+233 24 000 0000"
                value={phone}
                onChangeText={setPhone}
                icon={<Phone size={20} color="$colorMuted" />}
                keyboardType="phone-pad"
              />

              <Button
                size="$5"
                variant="primary"
                width="100%"
                onPress={handleInvite}
                loading={inviteRider.isPending}
              >
                Send Invitation
              </Button>

              {pending.length > 0 ? (
                <Text
                  fontSize="$3"
                  fontWeight="700"
                  color="$colorSecondary"
                  fontFamily="$heading"
                  marginTop="$2"
                >
                  PENDING INVITATIONS
                </Text>
              ) : null}
            </YStack>
          }
          renderItem={({ item }) => (
            <Card bordered marginBottom="$3" padding="$4">
              <XStack alignItems="center" justifyContent="space-between">
                <YStack flex={1} gap="$1" paddingRight="$3">
                  <XStack gap="$2" alignItems="center">
                    <Clock size={14} color="$orange" />
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$heading"
                      flexShrink={1}
                    >
                      {item.invited_email ?? item.phone ?? "Rider"}
                    </Text>
                  </XStack>
                  <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                    {item.code ? `Code: ${item.code}` : "Code sent"}
                  </Text>
                </YStack>
                <Button
                  variant="outline"
                  size="$3"
                  icon={<XCircle size={16} />}
                  loading={
                    revokeInvitation.isPending &&
                    revokeInvitation.variables === item.id
                  }
                  onPress={() => handleRevoke(item)}
                >
                  Revoke
                </Button>
              </XStack>
            </Card>
          )}
          ListEmptyComponent={
            <Card padding="$5" bordered>
              <YStack alignItems="center" gap="$2">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  No pending invitations
                </Text>
              </YStack>
            </Card>
          }
        />
      </YStack>
    </KeyboardAvoidingView>
  );
}
