// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import {
  useFonts,
  Sen_400Regular,
  Sen_500Medium,
  Sen_600SemiBold,
  Sen_700Bold,
  Sen_800ExtraBold,
} from '@expo-google-fonts/sen';

import tamaguiConfig from '../tamagui.config';
import { QueryProvider } from '../src/providers/QueryProvider';
import { ThemeProvider, useAppTheme } from '../src/providers/ThemeProvider';
import { useAuthStore } from '../src/stores/auth.store';
import { useLocationStore } from '../src/stores/location.store';
import { useOnboardingStore } from '../src/stores/onboarding.store';
import { useSecurityStore } from '../src/stores/security.store';
import { BiometricLockOverlay } from '../src/components/security/BiometricLockOverlay';

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

function AppShell() {
  const [fontsLoaded, fontError] = useFonts({
    Sen_400Regular,
    Sen_500Medium,
    Sen_600SemiBold,
    Sen_700Bold,
    Sen_800ExtraBold,
  });

  const { isBiometricEnabled } = useSecurityStore();
  const { resolvedTheme } = useAppTheme();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [splashReady, setSplashReady] = useState(false);
  const appState = useRef(AppState.currentState);
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const onboardingHydrated = useOnboardingStore((state) => state.isHydrated);
  const locationHydrated = useLocationStore((state) => state.isHydrated);
  const hasLocation = useLocationStore((state) => state.hasLocation());

  const isReady = authHydrated && onboardingHydrated && locationHydrated;
  const isAuthenticated = Boolean(user && accessToken);

  // Hide native splash screen only after fonts are loaded AND stores are hydrated
  // This ensures a smooth transition to our custom splash screen
  useEffect(() => {
    if ((fontsLoaded || fontError) && isReady) {
      // Small delay to ensure the custom splash screen is mounted
      const timer = setTimeout(() => {
        setSplashReady(true);
        SplashScreen.hideAsync();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError, isReady]);

  useEffect(() => {
    // Biometric lock logic for AppState changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // Only re-lock if the app was strictly in the background
      // This avoids loops caused by the system authentication overlay (which is 'inactive')
      if (
        appState.current === 'background' &&
        nextAppState === 'active' &&
        isBiometricEnabled
      ) {
        setIsUnlocked(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isBiometricEnabled]);

  if (!fontsLoaded && !fontError) {
    return null;
  }
  if (!isReady || !splashReady) {
    return null;
  }

  const showLock = isBiometricEnabled && !isUnlocked;

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <YStack flex={1}>
          <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="+not-found" />

            <Stack.Screen name="(auth)" />

            <Stack.Protected guard={hasLocation}>
              <Stack.Screen name="(buyer)" />
              <Stack.Screen name="search/index" />
              <Stack.Screen name="results/index" />
              <Stack.Screen name="restaurant/[id]" />
            </Stack.Protected>

            <Stack.Protected guard={isAuthenticated && hasLocation}>
              <Stack.Screen name="cart" />
              <Stack.Screen name="saved/index" />
              <Stack.Screen name="track/[id]" />
              <Stack.Screen name="profile/add-address" />
              <Stack.Screen name="profile/add-payment" />
              <Stack.Screen name="profile/addresses" />
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="profile/help" />
              <Stack.Screen name="profile/notifications" />
              <Stack.Screen name="profile/payments" />
              <Stack.Screen name="profile/security" />
              <Stack.Screen name="profile/theme" />
              <Stack.Screen name="(communication)" />
            </Stack.Protected>
          </Stack>

          {showLock && (
            <BiometricLockOverlay onUnlock={() => setIsUnlocked(true)} />
          )}
        </YStack>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
