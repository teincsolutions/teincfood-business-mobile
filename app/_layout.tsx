// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
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
import { Toaster } from 'sonner-native';
import { QueryProvider } from '../src/providers/QueryProvider';
import { ThemeProvider, useAppTheme } from '../src/providers/ThemeProvider';
import { useAuthStore } from '../src/stores/auth.store';
import { useLocationStore } from '../src/stores/location.store';
import { useOnboardingStore } from '../src/stores/onboarding.store';
import { useRoleStore } from '../src/stores/role.store';
import { useSecurityStore } from '../src/stores/security.store';
import { BiometricLockOverlay } from '../src/components/security/BiometricLockOverlay';
import { LocationGuard } from '../src/components/LocationGuard';
import { useBusinessesQuery } from '../src/hooks/useBusinessesQuery';
import { useEventsConnection } from '../src/hooks/useEventsConnection';

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
  const splashWasReady = useRef(false);
  const appState = useRef(AppState.currentState);
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const onboardingHydrated = useOnboardingStore((state) => state.isHydrated);
  const locationHydrated = useLocationStore((state) => state.isHydrated);
  const roleHydrated = useRoleStore((state) => state.isHydrated);
  const hasLocation = useLocationStore((state) => state.hasLocation());

  // Connect global events channel for real-time updates (all authenticated roles)
  useEventsConnection();

  const isReady = authHydrated && onboardingHydrated && locationHydrated && roleHydrated;
  const isAuthenticated = Boolean(user && accessToken);
  const isSeller = user?.role === 'seller';
  const isRider = user?.role === 'rider';

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
  if ((!isReady || !splashReady) && !splashWasReady.current) {
    return null;
  }
  splashWasReady.current = true;

  const showLock = isBiometricEnabled && !isUnlocked;

  return (
    <SafeAreaProvider>
      <Toaster position="top-center" />
      <BusinessesSync />
      <LocationGuard>
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

              {/* Auth routes - accessible to all */}
              <Stack.Screen name="(auth)" />

              {/* Seller routes - protected for sellers only */}
              <Stack.Protected guard={isAuthenticated && isSeller}>
                <Stack.Screen name="(seller)" />
              </Stack.Protected>

              {/* Rider routes - protected for riders only */}
              <Stack.Protected guard={isAuthenticated && isRider}>
                <Stack.Screen name="(rider)" />
              </Stack.Protected>

              {/* Fleet Manager routes - protected for fleet managers only */}
              <Stack.Protected guard={isAuthenticated && user?.role === 'fleet_manager'}>
                <Stack.Screen name="(fleet)" />
              </Stack.Protected>

              {/* Shared routes - protected for authenticated users */}
              <Stack.Protected guard={isAuthenticated}>
                <Stack.Screen name="(shared)" />
                <Stack.Screen name="(communication)" />
              </Stack.Protected>
            </Stack>

            {showLock && (
              <BiometricLockOverlay onUnlock={() => setIsUnlocked(true)} />
            )}
          </YStack>
        </LocationGuard>
    </SafeAreaProvider>
  );
}

/** Mounted at root to sync React Query business data into Zustand store */
function BusinessesSync() {
  useBusinessesQuery();
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <AppShell />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}