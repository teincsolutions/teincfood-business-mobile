// @ts-nocheck
import { useState } from "react";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Input } from "tamagui";
import { Mail, ArrowLeft } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button, FormInput } from "@/components/ui";
import { useForgotPasswordMutation } from "@/hooks/usePasswordRecovery";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const forgotPasswordMutation = useForgotPasswordMutation();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setError("");

    try {
      await forgotPasswordMutation.mutateAsync(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link. Please try again.");
    }
  };

  if (success) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        items="center"
        paddingHorizontal="$6"
        paddingTop={Math.max(insets.top + 20, 50)}
        paddingBottom="$6"
      >
        <YStack flex={1} items="center" width="100%" gap="$6">
          <YStack
            width={80}
            height={80}
            items="center"
            justify="center"
            borderRadius="$full"
            backgroundColor="$green"
          >
            <Mail size={40} color="white" />
          </YStack>

          <YStack alignItems="center" gap="$3">
            <Text
              fontSize="$7"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
              textAlign="center"
            >
              Check Your Email
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              textAlign="center"
              paddingHorizontal="$4"
            >
              We've sent a password reset link to {email}
            </Text>
          </YStack>

          <Button
            variant="primary"
            height={56}
            width="100%"
            onPress={() => router.back()}
          >
            Back to Login
          </Button>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingHorizontal="$8"
      paddingTop={Math.max(insets.top, 50)}
      paddingBottom="$6"
    >
      <YStack width="100%" maxW={"$media.sm"} gap="$6">
        <YStack marginBottom="$6">
          <BackButton />
        </YStack>

        <YStack gap="$6">
          <YStack gap="$3">
            <Text
              fontSize="$8"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Forgot Password?
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Enter your email address and we'll send you a link to reset your
              password.
            </Text>
          </YStack>

          <YStack gap="$4">
            <FormInput
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
              required
            />

            <Button
              variant="primary"
              onPress={handleResetPassword}
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </YStack>

          <YStack
            justifyContent="flex-end"
            alignItems="center"
            paddingBottom="$6"
          >
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Remember your password?
              </Text>
              <Button variant="ghost" onPress={() => router.back()}>
                <Text
                  fontSize="$4"
                  color="$primary"
                  fontWeight="600"
                  fontFamily="$body"
                >
                  Sign In
                </Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
