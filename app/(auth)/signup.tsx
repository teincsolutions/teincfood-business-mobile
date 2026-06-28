// @ts-nocheck
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { YStack, Text, ScrollView } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button, FormInput } from "@/components/ui";
import { validation } from "@/utils/validation";
import { normalizePhoneForCountry } from "@/utils/phone";
import { useSignupMutation } from "@/services/auth.service";
import { useRoleStore } from "@/stores/role.store";
import { useLocationStore } from "@/stores/location.store";

const FIELD_MAP: Record<string, string> = {
  full_name: "fullName",
  email: "email",
  phone: "phone",
  password: "password",
};

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const storedRole = useRoleStore((s) => s.role);
  const countryCode = useLocationStore((s) => s.currentLocation?.countryCode);
  const selectedRole = (() => {
    const r = storedRole || role;
    return r === "seller" || r === "rider" || r === "fleet_manager"
      ? r
      : "seller";
  })();
  const signupMutation = useSignupMutation();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignup = async () => {
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!validation.isNotEmpty(form.fullName)) {
      newErrors.fullName = "Full name is required";
    }

    if (!validation.isValid(form.email, validation.email)) {
      newErrors.email = validation.email.message;
    }

    if (form.phone && !validation.isValid(form.phone, validation.phone)) {
      newErrors.phone = validation.phone.message;
    }

    if (!validation.isValid(form.password, validation.password)) {
      newErrors.password = validation.password.message;
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload: Record<string, any> = {
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };
      if (form.phone.trim()) {
        const normalized = normalizePhoneForCountry(
          form.phone.trim(),
          countryCode,
        );
        payload.phone = normalized || form.phone.trim();
      }

      await signupMutation.mutateAsync(payload);

      router.replace({
        pathname: "/(auth)/verification",
        params: {
          contactInfo: form.email.trim().toLowerCase(),
          type: "email_verification",
          role: selectedRole,
        },
      });
    } catch (err: any) {
      const apiErrors = err?.response?.data?.error?.details;
      if (apiErrors && typeof apiErrors === "object") {
        const mapped: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(apiErrors)) {
          const frontendField = FIELD_MAP[field] || field;
          const msgsArr = Array.isArray(msgs) ? msgs : [msgs];
          mapped[frontendField] = msgsArr[0];
        }
        setErrors(mapped);
      } else {
        setErrors({
          fullName: err?.message || "Failed to create account. Please try again.",
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <YStack
        paddingTop={Math.max(insets.top, 24)}
        paddingBottom={Math.max(insets.bottom + 20, 24)}
        flex={1}
        bg="$background"
        items="center"
      >
        <YStack mb="$4" paddingHorizontal="$8" width="100%">
          {router.canDismiss() && <BackButton />}
        </YStack>

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          width="100%"
          maxW={"$media.sm"}
          paddingHorizontal={"$8"}
        >
          <YStack mb="$7" gap="$3">
            <Text
              fontSize={30}
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Create Account
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              lineHeight={22}
            >
              Sign up with email and password.
            </Text>
          </YStack>

          <YStack gap="$4">
            <FormInput
              label="Full Name"
              placeholder="John Doe"
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
              error={errors.fullName}
              required
            />
            <FormInput
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              error={errors.email}
              required
            />
            <FormInput
              label="Phone Number"
              placeholder="+233 24 000 0000"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(value) => updateField("phone", value)}
              error={errors.phone}
              required
            />
            <FormInput
              label="Password"
              placeholder="Create password"
              value={form.password}
              onChangeText={(value) => updateField("password", value)}
              isPassword
              error={errors.password}
              required
            />
            <FormInput
              label="Confirm Password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              isPassword
              error={errors.confirmPassword}
              required
            />
          </YStack>

          <YStack mt="$7" gap="$4">
            <Button
              variant="primary"
              width="100%"
              loading={signupMutation.isPending}
              onPress={handleSignup}
            >
              CREATE ACCOUNT
            </Button>

            <Text ta="center" color="$colorSecondary" fontFamily="$body">
              Already have an account?
            </Text>
            <Button
              variant="outline"
              width="100%"
              onPress={() =>
                router.push({
                  pathname: "/(auth)/login",
                  params: { role: selectedRole },
                })
              }
            >
              LOG IN
            </Button>
            <Button
              variant="ghost"
              height={40}
              onPress={() => router.push({ pathname: "/(auth)/role" })}
            >
              <Text
                fontSize="$3"
                color="$primary"
                fontWeight="600"
                fontFamily="$body"
              >
                Signing up as{" "}
                {selectedRole === "seller"
                  ? "Seller"
                  : selectedRole === "rider"
                    ? "Rider"
                    : "Fleet Manager"}{" "}
                · Switch Role
              </Text>
            </Button>
          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
