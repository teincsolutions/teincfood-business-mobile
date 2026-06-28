// @ts-nocheck
import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { YStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Button, FormInput } from "@/components/ui";
import { OTPInput } from "@/components/ui/OTPInput";
import {
  useRequestPhoneChangeMutation,
  useVerifyPhoneChangeMutation,
} from "@/hooks/useProfile";

type Step = "input" | "otp";
type Props = { onClose?: () => void };

export default function ChangePhoneScreen({ onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const requestPhoneChangeMutation = useRequestPhoneChangeMutation();
  const verifyPhoneChangeMutation = useVerifyPhoneChangeMutation();

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else router.back();
  }, [onClose, router]);

  const [step, setStep] = useState<Step>("input");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setIsSending(true);
    try {
      await requestPhoneChangeMutation.mutateAsync(phone);
      setStep("otp");
      toast.success(`Verification code sent to ${phone}`);
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (code.length !== 4 || verifyPhoneChangeMutation.isPending) return;
    try {
      await verifyPhoneChangeMutation.mutateAsync(code);
      toast.success("Phone updated successfully");
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
              label="New Phone"
              placeholder="New Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <YStack gap="$3" marginTop="$4">
              <Button variant="primary" onPress={handleSendOTP} loading={isSending}>
                Send Verification Code
              </Button>
            </YStack>
          </>
        ) : (
          <>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" ta="center">
              Enter the 4-digit code sent to {phone}
            </Text>
            <OTPInput length={4} value={code} onChange={setCode} onComplete={handleVerifyOTP} />
            <YStack gap="$3" marginTop="$4">
              <Button variant="primary" onPress={handleVerifyOTP} loading={verifyPhoneChangeMutation.isPending}>
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
