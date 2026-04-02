// @ts-nocheck
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { YStack, Text, ScrollView } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button, FormInput } from "@/components/ui";
import { validation } from "@/utils/validation";
import { useSignupMutation } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { role } = useLocalSearchParams<{ role?: string }>();
  const selectedRole = role === "seller" || role === "rider" ? role : "seller";
  const signupMutation = useSignupMutation();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignup = async () => {
    setError("");

    if (!validation.isNotEmpty(form.fullName)) {
      setError("Full name is required");
      return;
    }

    if (!validation.isNotEmpty(form.username)) {
      setError("Username is required");
      return;
    }

    if (!validation.isValid(form.email, validation.email)) {
      setError(validation.email.message);
      return;
    }

    if (!validation.isValid(form.phone, validation.phone)) {
      setError(validation.phone.message);
      return;
    }

    if (!validation.isValid(form.password, validation.password)) {
      setError(validation.password.message);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await signupMutation.mutateAsync({
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role: selectedRole,
      });

      setAuth(
        {
          id: response.user.id,
          fullName: response.user.fullName,
          email: response.user.email,
          phone: response.user.phone,
          username: response.user.username,
          role: selectedRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        response.accessToken,
        response.refreshToken,
      );

      if (selectedRole === "seller") {
        router.replace("/(seller)/");
      } else {
        router.replace("/(rider)/");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <YStack flex={1} bg="$background" items="center">
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          paddingHorizontal="$4"
          width="100%"
          maxW={"$media.sm"}
          paddingHorizontal={"$8"}
          paddingTop={Math.max(insets.top, 24)}
          paddingBottom={Math.max(insets.bottom + 20, 24)}
        >
          <YStack mb="$4">
            <BackButton />
          </YStack>

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
              placeholder="Eric Mensah"
              value={form.fullName}
              onChangeText={(value) => updateField("fullName", value)}
              required
            />
            <FormInput
              label="Username"
              placeholder="ericm"
              autoCapitalize="none"
              value={form.username}
              onChangeText={(value) => updateField("username", value)}
              required
            />
            <FormInput
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              required
            />
            <FormInput
              label="Phone Number"
              placeholder="+233 24 000 0000"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(value) => updateField("phone", value)}
              required
            />
            <FormInput
              label="Password"
              placeholder="Create password"
              value={form.password}
              onChangeText={(value) => updateField("password", value)}
              isPassword
              required
            />
            <FormInput
              label="Confirm Password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              isPassword
              error={error}
              required
            />
          </YStack>

          <YStack mt="$7" gap="$4">
            <Button loading={signupMutation.isPending} onPress={handleSignup}>
              CREATE ACCOUNT
            </Button>

            <Text ta="center" color="$colorSecondary" fontFamily="$body">
              Already have an account?
            </Text>
            <Button
              variant="outlined"
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
                Signing up as {selectedRole === "seller" ? "Seller" : "Rider"} ·
                Switch Role
              </Text>
            </Button>
          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
