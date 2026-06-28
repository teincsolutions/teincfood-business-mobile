// @ts-nocheck
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { YStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Button, FormInput } from "@/components/ui";
import { OTPInput } from "@/components/ui/OTPInput";
import {
  useRequestEmailChangeMutation,
  useVerifyEmailChangeMutation,
} from "@/hooks/useProfile";

type Step = "input" | "otp";
type Props = { onClose?: () => void };

export default function ChangeEmailScreen({ onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const requestEmailChangeMutation = useRequestEmailChangeMutation();
  const verifyEmailChangeMutation = useVerifyEmailChangeMutation();

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else router.back();
  }, [onClose, router]);

  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsSending(true);
    try {
      await requestEmailChangeMutation.mutateAsync(email);
      setStep("otp");
      toast.success(`Verification code sent to ${email}`);
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    if (code.length !== 4 || verifyEmailChangeMutation.isPending) return;
    try {
      await verifyEmailChangeMutation.mutateAsync(code);
      toast.success("Email updated successfully");
      handleClose();
    } catch {
      toast.error("Invalid verification code");
      setCode("");
    }
  };

  return (
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <YStack padding="$5" gap="$4" paddingBottom={insets.bottom + 24}>
        {step === "input" ? (
          <>
            <FormInput
              label="New Email"
              placeholder="New Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <YStack gap="$3" marginTop="$4">
              <Button variant="primary" onPress={handleSendOTP} loading={isSending}>
                Send Verification Code
              </Button>
            </YStack>
          </>
        ) : (
          <>
            <Text fontSize="$5" color="$colorSecondary" fontFamily="$body" textAlign="center">
              Enter the 4-digit code sent to {email}
            </Text>
            <OTPInput length={4} value={code} onChange={setCode} onComplete={handleVerifyOTP} />
            <YStack gap="$3" marginTop="$4">
              <Button variant="primary" onPress={() => handleVerifyOTP(code)} loading={verifyEmailChangeMutation.isPending}>
                Verify
              </Button>
              <Button variant="outline" onPress={() => setStep("input")}>
                Back
              </Button>
            </YStack>
          </>
        )}
      </YStack>
    </BottomSheetScrollView>
  );
}
