// @ts-nocheck
import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { YStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Button, FormInput } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { extractApiErrorCode, extractApiErrorMessage } from "@teincfood/core";

type Props = { onClose?: () => void };

/**
 * Password verification step for account deletion. Shown only when the
 * account has a password set (social-only accounts delete straight from
 * the warning dialog). Mirrors change-password.tsx conventions.
 */
export default function DeleteAccountScreen({ onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deleteAccount, isDeletingAccount } = useAuth();
  const submitInFlightRef = useRef(false);
  const [password, setPassword] = useState("");

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else router.back();
  }, [onClose, router]);

  const handleSubmit = async () => {
    if (isDeletingAccount || submitInFlightRef.current) return;

    if (!password) {
      toast.error("Enter your current password to delete your account");
      return;
    }

    submitInFlightRef.current = true;
    try {
      // Success tears down the session and routes to login (see useAuth).
      await deleteAccount(password);
      toast.success("Your account has been permanently deleted");
    } catch (error) {
      if (extractApiErrorCode(error) === "INVALID_PASSWORD") {
        toast.error("Current password is incorrect. Use Forgot Password if needed.");
      } else {
        toast.error(extractApiErrorMessage(error) || "Could not delete your account. Please try again.");
      }
      handleClose();
    } finally {
      submitInFlightRef.current = false;
    }
  };

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <YStack gap="$4" padding="$5" paddingBottom={insets.bottom + 24}>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          For your security, confirm your current password to permanently delete your account. This cannot be undone.
        </Text>

        <FormInput
          label="Current Password"
          placeholder="Current Password"
          value={password}
          onChangeText={setPassword}
          isPassword
        />

        <YStack gap="$3" marginTop="$4">
          <Button
            variant="danger"
            onPress={handleSubmit}
            loading={isDeletingAccount}
            disabled={isDeletingAccount}
          >
            Delete My Account
          </Button>

          <Button variant="outline" onPress={handleClose}>
            Keep My Account
          </Button>
        </YStack>
      </YStack>
    </BottomSheetScrollView>
  );
}
