// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, BackButton } from '@/components/ui';
import { OTPInput } from '@/components/ui/OTPInput';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { KeyboardAvoidingView } from 'react-native';

const OTP_LENGTH = 4;
const RESEND_DELAY_SEC = 60;

export default function VerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contactInfo = '', type, role } = useLocalSearchParams<{ contactInfo: string; type: string; role?: string }>();
  const selectedRole = role === 'seller' || role === 'rider' || role === 'fleet_manager' ? role : 'seller';
  const setAuth = useAuthStore((state) => state.setAuth);

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(RESEND_DELAY_SEC);
  const isVerifying = useRef(false);
  const lastSubmittedCodeRef = useRef('');

  const formattedContactInfo = (() => {
    const raw = String(contactInfo || '').trim();
    if (!raw.startsWith('+')) return raw;
    const digits = raw.slice(1);
    if (digits.length <= 3) return raw;
    return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
  })();

  useEffect(() => {
    if (timeLeft === 0) return;
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const routeToRole = () => {
    if (selectedRole === 'seller') {
      router.replace('/(seller)/');
    } else if (selectedRole === 'rider') {
      router.replace('/(rider)/');
    } else if (selectedRole === 'fleet_manager') {
      router.replace('/(fleet)/');
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp;
    if (otpCode.length < OTP_LENGTH) {
      setError('Please enter the full verification code');
      return;
    }
    if (isVerifying.current || isLoading) return;
    if (lastSubmittedCodeRef.current === otpCode) return;

    isVerifying.current = true;
    lastSubmittedCodeRef.current = otpCode;
    setError('');

    setIsLoading(true);
    try {
      const resp = await authService.verifyOtp({
        phone: contactInfo,
        code: otpCode,
        type: type === 'register' ? 'register' : 'login',
      });

      setAuth(
        {
          ...resp.user,
          role: selectedRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        resp.accessToken,
        resp.refreshToken,
      );
      routeToRole();
    } catch (err: any) {
      setError(err.message || 'Invalid code. Try again.');
      setOtp('');
      lastSubmittedCodeRef.current = '';
    } finally {
      setIsLoading(false);
      isVerifying.current = false;
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError('');
    try {
      await authService.requestOtp(contactInfo, type === 'register' ? 'register' : 'login');
      setTimeLeft(RESEND_DELAY_SEC);
    } catch (err: any) {
      setError('Failed to resend. Try later.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <YStack
        flex={1}
        bg="$background"
        items="center"
        paddingHorizontal="$5"
        paddingTop={Math.max(insets.top, 24)}
        paddingBottom={Math.max(insets.bottom + 12, 20)}
      >
        <YStack width="100%" maxWidth={640} flex={1}>
          <YStack mb="$4">
            <BackButton />
          </YStack>

          <YStack mb="$8" ai="center">
            <Text fontSize={30} fontWeight="800" fontFamily="$heading" color="$color" ta="center">
              Verification
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" mt="$2" lineHeight={22} ta="center">
              We have sent a code to your phone
            </Text>
            <Text fontSize="$4" fontWeight="600" color="$color" fontFamily="$body" mt="$3">
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
              <Text color="$error" fontSize="$3">{error}</Text>
            </YStack>
          ) : null}

          <YStack mt="$10">
            <Button variant="primary" loading={isLoading} onPress={() => handleVerify()}>
              VERIFY
            </Button>
          </YStack>

          <XStack jc="center" mt="$6" gap="$2">
            <Text color="$colorSecondary" fontFamily="$body">
              Didn't receive code?
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
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
