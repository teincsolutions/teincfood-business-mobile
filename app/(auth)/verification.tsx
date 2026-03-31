// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, BackButton } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useLocationStore } from '@/stores/location.store';
import { useOnboardingStore } from '@/stores/onboarding.store';

const OTP_LENGTH = 4;
const RESEND_DELAY_SEC = 60;

export default function VerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { contactInfo = 'your phone number', type } = useLocalSearchParams<{ contactInfo: string, type: string }>();
  const setAuth = useAuthStore((state) => state.setAuth);
  const hasLocation = useLocationStore((state) => state.hasLocation());
  const locationHydrated = useLocationStore((state) => state.isHydrated);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(RESEND_DELAY_SEC);

  const formattedContactInfo = (() => {
    const raw = String(contactInfo || '').trim();
    if (!raw.startsWith('+')) return raw;
    const digits = raw.slice(1);
    if (digits.length <= 3) return raw;
    return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
  })();

  useEffect(() => {
    if (!locationHydrated || hasLocation) return;
    router.replace(hasSeenOnboarding ? '/(auth)/onboarding?requireLocation=1' : '/(auth)/onboarding');
  }, [locationHydrated, hasLocation, hasSeenOnboarding, router]);

  useEffect(() => {
    if (timeLeft === 0) return;
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const focusNextInfo = (index: number) => {
    if (index < OTP_LENGTH - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const focusPrevInfo = (index: number) => {
    if (index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) { // User pasted exactly length or more
      const pasted = text.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== '') {
      focusNextInfo(index);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '') {
      focusPrevInfo(index);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the full verification code');
      return;
    }
    setError('');

    setIsLoading(true);
    try {
      const resp = await authService.verifyOtp({ phone: contactInfo, code, sessionId: 'mock' });
      
      // If logging in or signing up
      setAuth(resp.user, resp.accessToken, resp.refreshToken);
      if (hasLocation) {
        router.replace('/(buyer)/');
      } else {
        router.replace('/(auth)/onboarding?requireLocation=1');
      }
      
      // If this was an action from Forgot Password, you might redirect to a Reset Password screen instead.
    } catch (err: any) {
      setError(err.message || 'Invalid code. Try again.');
      // clear the inputs on error to encourage re-trying
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError('');
    try {
      await authService.requestOtp(contactInfo);
      setTimeLeft(RESEND_DELAY_SEC);
    } catch (err: any) {
      setError('Failed to resend. Try later.');
    }
  };

  return (
    <YStack
      flex={1}
      bg="$background"
      paddingHorizontal="$5"
      paddingTop={Math.max(insets.top, 24)}
      paddingBottom={Math.max(insets.bottom + 12, 20)}
    >
      {/* Header */}
      <YStack mb="$4">
        <BackButton />
      </YStack>

      <YStack mb="$8">
        <Text fontSize={30} fontWeight="800" fontFamily="$heading" color="$color">
          Verification
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" mt="$2" lineHeight={22}>
          We have sent a code to your phone
        </Text>
        <Text fontSize="$4" fontWeight="600" color="$color" fontFamily="$body">
          {formattedContactInfo}
        </Text>
      </YStack>

      {/* 4-Digit Input Array */}
      <XStack w="100%" jc="center" ai="center" mt="$5" mb="$2" alignSelf="center">
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            style={{
              width: 64,
              height: 64,
              marginHorizontal: 6,
              borderRadius: 12,
              backgroundColor: theme.backgroundSoft.val as string,
              textAlign: 'center',
              fontSize: 24,
              fontFamily: 'Sen_700Bold',
              color: theme.color.val as string,
              borderWidth: 1,
              borderColor: theme.borderColor.val as string,
            }}
          />
        ))}
      </XStack>

      {error ? (
        <YStack mt="$5" ai="center">
          <Text color="$error" fontSize="$3">{error}</Text>
        </YStack>
      ) : null}

      <YStack mt="$10">
        <Button loading={isLoading} onPress={handleVerify}>
          VERIFY
        </Button>
      </YStack>

      {/* Resend Section */}
      {/* Note: Mockups typically show "Didn't receive code? Resend (in 10s)" */}
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
  );
}
