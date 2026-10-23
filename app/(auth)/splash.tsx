// @ts-nocheck
import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Image } from "react-native";
import { YStack, Text, XStack } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "@/stores/auth.store";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useLocationStore } from "@/stores/location.store";
import { useRoleStore } from "@/stores/role.store";
import { useSecurityStore } from "@/stores/security.store";
import { useCorePrime } from "@/core/bootstrap";
import { queryClient } from "@/providers/QueryProvider";
import { BUSINESSES_QUERY_KEY } from "@/hooks/useBusinessesQuery";
import * as businessService from "@/services/business.service";
import { authService } from "@/services/auth.service";
import {
  register,
  cleanup,
  unregister,
} from "@/hooks/usePushTokenRegistration";
import { useResponsive } from "@/utils/responsive";
import { appVersion } from "@/utils/constants";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { isTablet, height: screenHeight } = useResponsive();
  const [mountedTime, setMountedTime] = useState(Date.now());
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasShownFailureAlertRef = useRef(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Store values
  const authHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const roleHydrated = useRoleStore((s) => s.isHydrated);
  const persistedRole = useRoleStore((s) => s.role);
  const isBiometricEnabled = useSecurityStore((s) => s.isBiometricEnabled);
  const setBiometricEnabled = useSecurityStore((s) => s.setBiometricEnabled);
  const locationHydrated = useLocationStore((s) => s.isHydrated);
  const hasLocation = useLocationStore((s) => s.hasLocation());
  const storesHydrated =
    authHydrated && onboardingHydrated && roleHydrated && locationHydrated;

  // Prime core bootstrap so SQLite driver is registered before any
  // @teincfood/core service (orderSnapshotsService, openSyncDatabase, etc.)
  // is used later in the app. This replaces the old src/db/connection.ts shim
  // that was deleted in the core 0.7.29 migration.
  useEffect(() => {
    useCorePrime();
  }, []);

  // Start entrance animations
  useEffect(() => {
    Animated.sequence([
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
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

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
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Session + role check → navigate after minimum duration
  useEffect(() => {
    if (!storesHydrated) return;

    const route = async () => {
      setStatusMessage("Ready");

      const elapsed = Date.now() - mountedTime;
      const minWait = Math.max(0, 3000 - elapsed);

      await new Promise((r) => setTimeout(r, minWait));

      // TEMP DEBUG: log access token for manual curl testing
      if (accessToken) console.log("[DEBUG] Access token:", accessToken);

      if (!accessToken) {
        // No session — check prerequisites in order: onboarding → location → role → login
        if (!hasSeenOnboarding) {
          setRedirectTarget("/(auth)/onboarding");
          return;
        }
        if (!hasLocation) {
          setRedirectTarget("/(auth)/location");
          return;
        }
        if (!persistedRole) {
          setRedirectTarget("/(auth)/role");
          return;
        }
        setRedirectTarget("/(auth)/login");
        return;
      }

      if (!persistedRole) {
        // Session exists but no role selected → role selection
        setRedirectTarget("/(auth)/role");
        return;
      }

      // Session + role — attempt biometric auth if enabled
      if (isBiometricEnabled) {
        setStatusMessage("Verifying identity...");

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          setBiometricEnabled(false);
          // Continue without biometrics
        } else {
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (!isEnrolled) {
            setBiometricEnabled(false);
          } else {
            setStatusMessage("Confirming identity...");
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: "Unlock Teinc Food Business",
              fallbackLabel: "Use device passcode",
              cancelLabel: "Cancel",
            });

            if (!result.success) {
              if (!hasShownFailureAlertRef.current) {
                hasShownFailureAlertRef.current = true;
                // Can't navigate from alert, so store alert config
                setAlertConfig({
                  title: "Authentication Required",
                  description: "We could not verify your identity.",
                  confirmText: "LOG OUT",
                  onConfirm: () => {
                    authService.logout().finally(() => {
                      cleanup();
                      unregister().finally(() => {
                        clearAuth();
                        hasShownFailureAlertRef.current = false;
                        setRedirectTarget("/(auth)/login");
                      });
                    });
                  },
                  cancelText: "RETRY",
                  onCancel: () => {
                    hasShownFailureAlertRef.current = false;
                    setRetryCount((c) => c + 1);
                  },
                });
                setShowAlert(true);
              }
              return;
            }
            hasShownFailureAlertRef.current = false;
          }
        }
      }

      // Refresh businesses in the background. The persisted query cache and
      // the business store already hold what the shell needs, so the splash
      // must never wait on the network — poor connectivity used to strand it
      // on "Loading your businesses...".
      setStatusMessage("Loading your businesses...");
      void queryClient
        .prefetchQuery({
          queryKey: BUSINESSES_QUERY_KEY,
          queryFn: async () => {
            const res = await businessService.fetchMyBusinesses();
            return res.data || [];
          },
          staleTime: 1000 * 60 * 5,
        })
        .catch(() => {});

      // Navigate to role's home
      register();
      if (persistedRole === "seller") setRedirectTarget("/(seller)/");
      else if (persistedRole === "rider") setRedirectTarget("/(rider)/");
      else if (persistedRole === "fleet_manager")
        setRedirectTarget("/(fleet)/");
    };

    route();
  }, [
    storesHydrated,
    accessToken,
    persistedRole,
    isBiometricEnabled,
    retryCount,
  ]);

  // Alert handler (rendered conditionally)
  useEffect(() => {
    if (!showAlert || !alertConfig) return;
    const { title, description, confirmText, onConfirm, cancelText, onCancel } =
      alertConfig;
    const buttons = [];
    if (cancelText) {
      buttons.push({ text: cancelText, onPress: onCancel, style: "cancel" });
    }
    buttons.push({
      text: confirmText || "OK",
      onPress: onConfirm,
      style: "default",
    });
    Alert.alert(title, description, buttons);
    setShowAlert(false);
    setAlertConfig(null);
  }, [showAlert, alertConfig]);

  if (redirectTarget) {
    return <Redirect href={redirectTarget} />;
  }

  const logoSize = isTablet ? 200 : 150;
  const brandFontSize = isTablet ? 56 : 42;
  const subtitleFontSize = isTablet ? 20 : 15;
  const statusFontSize = isTablet ? 20 : 14;
  const dotSize = isTablet ? 14 : 8;

  return (
    <YStack
      flex={1}
      items="center"
      bg="$white"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      {/* Background gradient overlay */}
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.05}
        style={{
          background:
            "radial-gradient(circle at 50% 30%, $primary 0%, transparent 60%)",
        }}
      />

      {/* Decorative circles */}
      <YStack
        position="absolute"
        top={-60}
        right={-60}
        width={isTablet ? 300 : 200}
        height={isTablet ? 300 : 200}
        borderRadius={isTablet ? 150 : 100}
        bg="$primary"
        opacity={0.15}
      />
      <YStack
        position="absolute"
        bottom={insets.bottom + 100}
        left={-100}
        width={isTablet ? 220 : 160}
        height={isTablet ? 220 : 160}
        borderRadius={isTablet ? 110 : 80}
        bg="$primary"
        opacity={0.1}
      />

      {/* Logo + text block */}
      <YStack
        items="center"
        jc="center"
        marginTop={screenHeight * (isTablet ? 0.3 : 0.28)}
        gap={isTablet ? "$8" : "$6"}
        paddingHorizontal="$6"
      >
        <Animated.View
          style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}
        >
          <YStack
            width={logoSize}
            height={logoSize}
            borderRadius={logoSize / 2}
            bg="transparent"
            items="center"
            jc="center"
          >
            <Image
              source={require("../../assets/icon.png")}
              style={{
                width: logoSize,
                height: logoSize,
                resizeMode: "contain",
              }}
            />
          </YStack>
        </Animated.View>

        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }}
        >
          <YStack items="center" gap={isTablet ? "$1" : "$0"}>
            <Text
              fontSize={brandFontSize}
              fontWeight="800"
              color="#2E3248"
              fontFamily="$heading"
              letterSpacing={-1}
            >
              Teinc{" "}
              <Text fontWeight="800" fontFamily="$heading" color="$primary">
                Food
              </Text>
            </Text>
            <Text
              fontSize={isTablet ? 24 : 20}
              color="#2E3248"
              opacity={0.9}
              fontFamily="$body"
              letterSpacing={4}
              textTransform="uppercase"
              fontWeight="600"
            >
              Business
            </Text>
          </YStack>
        </Animated.View>

        <Animated.View style={{ opacity: subtitleOpacity }}>
          <XStack items="center" gap="$0" jc="center">
            <Text
              fontSize={subtitleFontSize}
              color="#2E3248"
              opacity={0.7}
              fontFamily="$body"
              ta="center"
              letterSpacing={0.5}
            >
              Manage
            </Text>
            <Text fontSize={subtitleFontSize} color="$primary" fontWeight="700">
              .
            </Text>
            <Text
              fontSize={subtitleFontSize}
              color="#2E3248"
              opacity={0.7}
              fontFamily="$body"
              ta="center"
              letterSpacing={0.5}
            >
              Deliver
            </Text>
            <Text fontSize={subtitleFontSize} color="$primary" fontWeight="700">
              .
            </Text>
            <Text
              fontSize={subtitleFontSize}
              color="#2E3248"
              opacity={0.7}
              fontFamily="$body"
              ta="center"
              letterSpacing={0.5}
            >
              Grow
            </Text>
          </XStack>
        </Animated.View>
      </YStack>

      {/* Loader at bottom */}
      <YStack
        position="absolute"
        bottom={insets.bottom + 40}
        left={0}
        right={0}
        items="center"
      >
        <Animated.View
          style={{ opacity: loaderOpacity, transform: [{ scale: pulseAnim }] }}
        >
          <YStack items="center" gap="$3">
            <XStack gap={isTablet ? "$4" : "$2"}>
              {[0, 1, 2].map((idx) => (
                <LoadingDot key={idx} delay={idx * 200} size={dotSize} />
              ))}
            </XStack>
            <Text
              fontSize={statusFontSize}
              color="#2E3248"
              opacity={0.6}
              fontFamily="$body"
              ta="center"
            >
              {statusMessage}
            </Text>
          </YStack>
        </Animated.View>
      </YStack>

      <YStack position="absolute" bottom={insets.bottom + 12} right={20}>
        <Text fontSize={10} color="#2E3248" opacity={0.3} fontFamily="$body">
          v{appVersion}
        </Text>
      </YStack>
    </YStack>
  );
}

function LoadingDot({ delay, size }) {
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
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#FF7622",
        opacity,
      }}
    />
  );
}
