// @ts-nocheck
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Animated, Dimensions } from 'react-native';
import { YStack, Text, XStack } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useSecurityStore } from '@/stores/security.store';
import { useLocationStore } from '@/stores/location.store';

const SPLASH_MIN_DURATION = 3000;

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mountedTime] = useState(Date.now());
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const hasShownFailureAlertRef = useRef(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const authHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const onboardingHydrated = useOnboardingStore((state) => state.isHydrated);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const locationHydrated = useLocationStore((state) => state.isHydrated);
  const hasLocation = useLocationStore((state) => state.hasLocation());
  const isBiometricEnabled = useSecurityStore((state) => state.isBiometricEnabled);
  const setBiometricEnabled = useSecurityStore((state) => state.setBiometricEnabled);

  const showAlert = ({
    title,
    description,
    confirmText = 'OK',
    cancelText,
    onConfirm,
    onCancel,
    isDestructive = false,
  }: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    isDestructive?: boolean;
  }) => {
    const buttons: any[] = [];

    if (cancelText) {
      buttons.push({
        text: cancelText,
        onPress: onCancel,
        style: 'cancel',
      });
    }

    buttons.push({
      text: confirmText,
      onPress: onConfirm,
      style: isDestructive ? 'destructive' : 'default',
    });

    Alert.alert(title, description, buttons);
  };

  // Start entrance animations
  useEffect(() => {
    const animationSequence = Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text entrance
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Loader
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();

    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const prepareSession = async () => {
      if (!authHydrated || !onboardingHydrated || !locationHydrated) {
        setStatusMessage('Preparing your account...');
        return;
      }

      if (!user) {
        setAuthCheckComplete(true);
        setStatusMessage('Ready');
        return;
      }

      if (!isBiometricEnabled) {
        setAuthCheckComplete(true);
        setStatusMessage('Ready');
        return;
      }

      setStatusMessage('Verifying identity...');

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!isMounted) return;

      if (!hasHardware) {
        setBiometricEnabled(false);
        setAuthCheckComplete(true);
        setStatusMessage('Biometrics unavailable');
        showAlert({
          title: 'Biometrics Unavailable',
          description: 'Biometric login was turned off because this device does not support it.',
        });
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isMounted) return;

      if (!isEnrolled) {
        setBiometricEnabled(false);
        setAuthCheckComplete(true);
        setStatusMessage('Biometrics not set up');
        showAlert({
          title: 'Biometrics Not Set Up',
          description: 'Biometric login was turned off because no Face ID, Touch ID, or fingerprint is enrolled on this device.',
        });
        return;
      }

      setStatusMessage('Confirming identity...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock TeincFoods',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
      });

      if (!isMounted) return;

      if (result.success) {
        hasShownFailureAlertRef.current = false;
        setAuthCheckComplete(true);
        setStatusMessage('Welcome back!');
        return;
      }

      setAuthCheckComplete(false);
      setStatusMessage('Authentication required');

      if (!hasShownFailureAlertRef.current) {
        hasShownFailureAlertRef.current = true;
        showAlert({
          title: 'Authentication Required',
          description: 'We could not verify your identity. Retry biometric login or return to the login screen.',
          confirmText: 'LOG OUT',
          isDestructive: true,
          onConfirm: () => {
            clearAuth();
            hasShownFailureAlertRef.current = false;
            router.replace('/(auth)/login');
          },
          cancelText: 'RETRY',
          onCancel: () => {
            hasShownFailureAlertRef.current = false;
            setRetryCount((count) => count + 1);
          },
        });
      }
    };

    prepareSession();

    return () => {
      isMounted = false;
    };
  }, [
    authHydrated,
    onboardingHydrated,
    locationHydrated,
    user,
    isBiometricEnabled,
    setBiometricEnabled,
    clearAuth,
    router,
    retryCount,
  ]);

  useEffect(() => {
    if (authHydrated && onboardingHydrated && locationHydrated && authCheckComplete) {
      const elapsed = Date.now() - mountedTime;
      const remainingTime = Math.max(0, SPLASH_MIN_DURATION - elapsed);

      const timeout = setTimeout(() => {
        if (user) {
          // Route based on user role
          if (user.role === 'seller') {
            router.replace('/(seller)/');
          } else if (user.role === 'rider') {
            router.replace('/(rider)/');
          } else {
            // Invalid or old role - send to login to re-authenticate
            clearAuth();
            router.replace('/(auth)/login');
          }
        } else if (!hasSeenOnboarding) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(auth)/login');
        }
      }, remainingTime);

      return () => clearTimeout(timeout);
    }
  }, [authHydrated, onboardingHydrated, locationHydrated, authCheckComplete, user, hasSeenOnboarding, hasLocation, mountedTime, router, clearAuth]);

  return (
    <YStack
      flex={1}
      items="center"
      jc="center"
      bg="$primary"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      {/* Background gradient effect */}
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        style={{
          background: `radial-gradient(circle at 50% 30%, $white 0%, transparent 60%)`,
        }}
      />

      {/* Decorative circles */}
      <YStack
        position="absolute"
        top={-50}
        right={-50}
        width={200}
        height={200}
        borderRadius={100}
        bg="$white"
        opacity={0.1}
      />
      <YStack
        position="absolute"
        bottom={insets.bottom + 100}
        left={-80}
        width={160}
        height={160}
        borderRadius={80}
        bg="$white"
        opacity={0.08}
      />

      {/* Main content */}
      <YStack flex={1} items="center" jc="center" gap="$6" padding="$6">
        {/* Logo */}
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          <YStack
            width={120}
            height={120}
            borderRadius={30}
            bg="$white"
            items="center"
            jc="center"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 8 }}
            shadowOpacity={0.3}
            shadowRadius={16}
            elevation={10}
          >
            <Image
              source={require('../../assets/icon.png')}
              style={{
                width: 80,
                height: 80,
                resizeMode: 'contain',
              }}
            />
          </YStack>
        </Animated.View>

        {/* App name */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }}
        >
          <YStack items="center" gap="$2">
            <Text
              fontSize={42}
              fontWeight="800"
              color="$white"
              fontFamily="$heading"
              letterSpacing={-1}
            >
              Teinc
            </Text>
            <XStack items="center" gap="$2">
              <YStack
                width={24}
                height={2}
                bg="$white"
                opacity={0.6}
                borderRadius={1}
              />
              <Text
                fontSize={14}
                color="$white"
                opacity={0.9}
                fontFamily="$body"
                letterSpacing={4}
                textTransform="uppercase"
                fontWeight="600"
              >
                Foods
              </Text>
              <YStack
                width={24}
                height={2}
                bg="$white"
                opacity={0.6}
                borderRadius={1}
              />
            </XStack>
          </YStack>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: subtitleOpacity }}>
            <Text
              fontSize={15}
              color="$white"
              opacity={0.85}
              fontFamily="$body"
              textAlign="center"
              letterSpacing={0.5}
              marginTop="$2"
            >
              Your food business companion
            </Text>
        </Animated.View>
      </YStack>

      {/* Bottom section with loader */}
      <YStack
        paddingBottom={insets.bottom + 40}
        items="center"
        gap="$3"
      >
        <Animated.View
          style={{
            opacity: loaderOpacity,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <YStack items="center" gap="$3">
            {/* Loading dots */}
            <XStack gap="$2">
              {[0, 1, 2].map((index) => (
                <LoadingDot key={index} delay={index * 200} />
              ))}
            </XStack>

            {/* Status message */}
            <Text
              fontSize={13}
              color="$white"
              opacity={0.75}
              fontFamily="$body"
              textAlign="center"
            >
              {statusMessage}
            </Text>
          </YStack>
        </Animated.View>
      </YStack>

      {/* Version info (subtle) */}
      <YStack
        position="absolute"
        bottom={insets.bottom + 12}
        right={20}
      >
        <Text
          fontSize={10}
          color="$white"
          opacity={0.4}
          fontFamily="$body"
        >
          v1.0.0
        </Text>
      </YStack>
    </YStack>
  );
}

// Loading dot component with animation
function LoadingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        opacity,
      }}
    />
  );
}