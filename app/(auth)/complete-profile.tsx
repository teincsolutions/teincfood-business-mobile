// @ts-nocheck
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { YStack, Text } from "tamagui";
import { Button, FormInput } from "@/components/ui";
import { FormActions, FormScreen } from "@/components/layout";
import { validateEmail } from "@teincfood/core";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleStore } from "@/stores/role.store";
import { useUpdateProfileMutation } from "@/hooks/useProfile";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const storedRole = useRoleStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const selectedRole = (() => {
    const r = storedRole || role;
    return r === "seller" || r === "rider" || r === "fleet_manager" ? r : "seller";
  })();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateMutation = useUpdateProfileMutation();

  const handleSubmit = async () => {
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const r = validateEmail(email);
      if (!r.valid) newErrors.email = r.errors[0];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
      });

      updateUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      });

      router.replace(
        selectedRole === "seller"
          ? "/(seller)/"
          : selectedRole === "rider"
            ? "/(auth)/join-fleet"
            : "/(fleet)/",
      );
    } catch (err: any) {
      const details = err?.response?.data?.error?.details;
      if (details && typeof details === "object") {
        const mapped: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(details)) {
          const arr = Array.isArray(msgs) ? msgs : [msgs];
          mapped[field === "full_name" ? "fullName" : field] = arr[0];
        }
        setErrors(mapped);
      } else {
        setErrors({ fullName: "Failed to update profile. Try again." });
      }
    }
  };

  const handleSkip = () => {
    router.replace(
      selectedRole === "seller"
        ? "/(seller)/"
        : selectedRole === "rider"
          ? "/(auth)/join-fleet"
          : "/(fleet)/",
    );
  };

  return (
    <FormScreen>
      <YStack mb="$7" gap="$3">
        <Text fontSize={30} fontWeight="800" fontFamily="$heading" color="$color">Complete Profile</Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" lineHeight={22}>
          Add your name and email to continue.
        </Text>
      </YStack>

      <YStack gap="$4">
        <FormInput
          label="Full Name"
          placeholder="John Doe"
          value={fullName}
          onChangeText={(v) => { setFullName(v); setErrors((p) => { const n = { ...p }; delete n.fullName; return n; }); }}
          error={errors.fullName}
          required
        />
        <FormInput
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
          error={errors.email}
          required
        />
      </YStack>

      <FormActions marginTop="$7">
        <Button variant="primary" loading={updateMutation.isPending} onPress={handleSubmit}>
          CONTINUE
        </Button>
        <Button variant="outline" onPress={handleSkip}>
          SKIP FOR NOW
        </Button>
      </FormActions>
    </FormScreen>
  );
}
