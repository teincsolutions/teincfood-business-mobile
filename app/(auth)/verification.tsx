// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { YStack, XStack, Text } from "tamagui";
import { Button, BackButton } from "@/components/ui";
import { FormActions, FormScreen } from "@/components/layout";
import { OTPInput } from "@/components/ui/OTPInput";
import {
  useVerifyOtpMutation,
  useRequestOtpMutation,
  useVerifyEmailOtpByEmailMutation,
  useResendEmailOtpMutation,
} from "@/hooks/useAuthVerification";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleStore } from "@/stores/role.store";
import { extractApiErrorMessage } from "@teincfood/core";

const OTP_LENGTH = 4;
const RESEND_DELAY_SEC = 60;

export default function VerificationScreen() {
  const router = useRouter();
  const {
    contactInfo = "",
    type,
    role,
  } = useLocalSearchParams<{
    contactInfo: string;
    type: string;
    role?: string;
  }>();
  const storedRole = useRoleStore((s) => s.role);
  const selectedRole = (() => {
    const r = storedRole || role;
    return r === "seller" || r === "rider" || r === "fleet_manager"
      ? r
      : "seller";
  })();
  const setAuth = useAuthStore((state) => state.setAuth);

  const isEmailVerification = type === "email_verification";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(RESEND_DELAY_SEC);
  const isVerifying = useRef(false);
  const lastSubmittedCodeRef = useRef("");

  const verifyOtpMutation = useVerifyOtpMutation();
  const requestOtpMutation = useRequestOtpMutation();
  const verifyEmailMutation = useVerifyEmailOtpByEmailMutation();
  const resendEmailMutation = useResendEmailOtpMutation();

  const formattedContactInfo = (() => {
    if (isEmailVerification) return contactInfo;
    const raw = String(contactInfo || "").trim();
    if (!raw.startsWith("+")) return raw;
    const digits = raw.slice(1);
    if (digits.length <= 3) return raw;
    return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
  })();

  useEffect(() => {
    if (timeLeft === 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const routeToRole = () => {
    // Phone registration — user needs to complete profile first
    if (type === "register") {
      router.replace("/(auth)/complete-profile");
      return;
    }
    // Go through splash so stores propagate and Stack.Protected guards
    // re-evaluate before navigating to role-grouped routes.
    router.replace("/(auth)/splash");
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp;
    if (otpCode.length < OTP_LENGTH) {
      setError("Please enter the full verification code");
      return;
    }

    const isPending = isEmailVerification
      ? verifyEmailMutation.isPending
      : verifyOtpMutation.isPending;
    if (isVerifying.current || isPending) return;
    if (lastSubmittedCodeRef.current === otpCode) return;

    isVerifying.current = true;
    lastSubmittedCodeRef.current = otpCode;
    setError("");

    try {
      const resp = isEmailVerification
        ? await verifyEmailMutation.mutateAsync({
            email: contactInfo,
            code: otpCode,
          })
        : await verifyOtpMutation.mutateAsync({
            phone: contactInfo,
            code: otpCode,
            type: type === "register" ? "register" : "login",
          });

      setAuth(
        {
          ...resp.user,
          fullName: resp.user.full_name || resp.user.fullName,
          role: selectedRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        resp.access_token,
        resp.refresh_token,
      );
      routeToRole();
    } catch (err: any) {
      setError(extractApiErrorMessage(err));
      setOtp("");
      lastSubmittedCodeRef.current = "";
    } finally {
      isVerifying.current = false;
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError("");
    try {
      if (isEmailVerification) {
        await resendEmailMutation.mutateAsync(contactInfo);
      } else {
        await requestOtpMutation.mutateAsync({
          phone: contactInfo,
          purpose: type === "register" ? "register" : "login",
        });
      }
      setTimeLeft(RESEND_DELAY_SEC);
    } catch (err: any) {
      setError("Failed to resend. Try later.");
    }
  };

  return (
    <FormScreen>
      <YStack>
        <BackButton />
      </YStack>

      <YStack mb="$8" ai="center">
        <Text
          fontSize={30}
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
          ta="center"
        >
          Verification
        </Text>
        <Text
          fontSize="$4"
          color="$colorSecondary"
          fontFamily="$body"
          mt="$2"
          lineHeight={22}
          ta="center"
        >
          We have sent a code to your{" "}
          {isEmailVerification ? "email" : "phone"}
        </Text>
        <Text
          fontSize="$4"
          fontWeight="600"
          color="$color"
          fontFamily="$body"
          mt="$3"
        >
          {formattedContactInfo}
        </Text>
      </YStack>

      <OTPInput
        length={OTP_LENGTH}
        value={otp}
        onChange={setOtp}
        onComplete={handleVerify}
      />

      {error ? (
        <YStack mt="$5" items="center">
          <Text color="$error" fontSize="$3">
            {error}
          </Text>
        </YStack>
      ) : null}

      <FormActions marginTop="$10">
        <Button
          variant="primary"
          loading={
            verifyEmailMutation.isPending ||
            verifyOtpMutation.isPending ||
            requestOtpMutation.isPending
          }
          onPress={() => handleVerify()}
        >
          VERIFY
        </Button>
      </FormActions>

      <XStack jc="center" mt="$6" gap="$2">
        <Text color="$colorSecondary" fontFamily="$body">
          Didn&apos;t receive code?
        </Text>
        {timeLeft > 0 ? (
          <Text color="$colorSecondary" fontWeight="600" fontFamily="$body">
            Resend in {timeLeft}s
          </Text>
        ) : (
          <Text
            color="$primary"
            fontWeight="800"
            fontFamily="$body"
            onPress={handleResend}
          >
            Resend
          </Text>
        )}
      </XStack>
    </FormScreen>
  );
}
