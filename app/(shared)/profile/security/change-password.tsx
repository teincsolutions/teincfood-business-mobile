// @ts-nocheck
import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { YStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Button, FormInput } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useChangePasswordMutation, useSetPasswordMutation, useProfileQuery } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";

type Props = { onClose?: () => void };

export default function PasswordScreen({ onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { data: profileData } = useProfileQuery();

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else router.back();
  }, [onClose, router]);

  const user = profileData ?? storeUser;
  const hasPassword = user?.has_password === true;
  const isSetPassword = !hasPassword;

  const changePasswordMutation = useChangePasswordMutation();
  const setPasswordMutation = useSetPasswordMutation();
  const submitInFlightRef = useRef(false);

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback((field: string) => (text: string) => {
    setForm((p) => ({ ...p, [field]: text }));
  }, []);

  const handleSubmit = async () => {
    if (isSaving || submitInFlightRef.current) return;

    if (!isSetPassword && !form.current_password) {
      toast.error("Current password is required");
      return;
    }
    if (!form.new_password || form.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    submitInFlightRef.current = true;
    setIsSaving(true);
    try {
      if (isSetPassword) {
        await setPasswordMutation.mutateAsync({
          password: form.new_password,
          passwordConfirmation: form.confirm_password,
        });
        toast.success("Password set successfully");
      } else {
        await changePasswordMutation.mutateAsync({
          currentPassword: form.current_password,
          newPassword: form.new_password,
        });
        toast.success("Password changed successfully");
      }
      if (storeUser) {
        setUser({ ...storeUser, has_password: true });
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      handleClose();
    } catch {
      toast.error("Failed to update password. Check your current password.");
    } finally {
      submitInFlightRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <YStack padding="$5" gap="$4" paddingBottom={insets.bottom + 24}>
        {!isSetPassword && (
          <FormInput
            label="Current Password"
            placeholder="Current Password"
            value={form.current_password}
            onChangeText={handleChange("current_password")}
            isPassword
          />
        )}
        <FormInput
          label="New Password"
          placeholder="New Password (min 8 chars)"
          value={form.new_password}
          onChangeText={handleChange("new_password")}
          isPassword
        />
        <FormInput
          label="Confirm New Password"
          placeholder="Confirm New Password"
          value={form.confirm_password}
          onChangeText={handleChange("confirm_password")}
          isPassword
        />

        <YStack gap="$3" marginTop="$4">
          <Button variant="primary" onPress={handleSubmit} loading={isSaving}>
            {isSetPassword ? "Set Password" : "Change Password"}
          </Button>
          {hasPassword && (
            <Button variant="outline" onPress={() => { handleClose(); router.push("/(auth)/forgot-password"); }}>
              Forgot Password
            </Button>
          )}
        </YStack>
      </YStack>
    </BottomSheetScrollView>
  );
}
