// @ts-nocheck
import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useConnectivityStore } from '../src/stores/connectivity.store';
import { openSyncDatabase, drainPending, syncReferenceDataOnReconnect, useSyncReconciliation, phoenixSocket } from '@teincfood/core';
import { localNodeService } from '../src/local-node/service';

// Global handler for unhandled errors — prevents the app from freezing
// when a non-fatal async error slips through.
const defaultHandler = global.ErrorUtils?.getGlobalHandler?.();
if (global.ErrorUtils?.setGlobalHandler) {
  global.ErrorUtils.setGlobalHandler((error: unknown, isFatal: boolean) => {
    if (!isFatal) console.warn('[GlobalError] Non-fatal:', error);
    else defaultHandler?.(error, isFatal);
  });
}
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { setupNotifications } from '@teincfood/rn-notifications';
import type { PushNotificationData, NotificationAction } from '@teincfood/rn-notifications';

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
import { connectChatClient, disconnectChatClient } from '../src/utils/chat-service';
import { subscribeAuthCleanup } from '../src/services/auth-cleanup.service';
import * as sellerService from '../src/services/seller.service';
import * as fleetService from '../src/services/fleet.service';
import { api } from '../src/services/api';
import { AlertProvider } from '../src/contexts/AlertContext';
import { AlertContainer } from '../src/contexts/AlertContainer';
import { useOTAUpdate } from '../src/hooks/useOTAUpdate';

// Subscribe to auth changes to disconnect WebSocket on logout
subscribeAuthCleanup();

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

function AppShell() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
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
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const onboardingHydrated = useOnboardingStore((state) => state.isHydrated);
  const locationHydrated = useLocationStore((state) => state.isHydrated);
  const roleHydrated = useRoleStore((state) => state.isHydrated);
  const hasLocation = useLocationStore((state) => state.hasLocation());

  // Connect global events channel for real-time updates (all authenticated roles)
  useEventsConnection();

  // Bridge sync-engine reconciliation events to TanStack Query
  useSyncReconciliation();

  // OTA update check (production builds only) — prompts user when a new version is available
  useOTAUpdate();

  // Initialize offline-first SQLite database
  useEffect(() => {
    openSyncDatabase().catch((error) => {
      console.error('[SQLite] Failed to open sync database:', error);
    });
  }, []);

  // Initialize connectivity monitoring
  useEffect(() => {
    const unsubscribe = useConnectivityStore.getState().initialize();
    return unsubscribe;
  }, []);

  // Initialize Local Node / LAN service
  useEffect(() => {
    localNodeService.initialize().catch((error) => {
      console.error('[LocalNode] Failed to initialize:', error);
    });
  }, []);

  // Drain pending sync jobs when cloud connectivity returns (single source:
  // SQLite orders + sync_jobs FIFO). Legacy command-queue replay is retired.
  useEffect(() => {
    const unsubscribe = useConnectivityStore.subscribe((state, prevState) => {
      const becameReachable =
        state.isCloudReachable === 'reachable' &&
        prevState.isCloudReachable !== 'reachable';
      const cameOnline =
        state.isOnline && !prevState.isOnline;

      if (becameReachable || cameOnline) {
        try {
          const { useBusinessStore } = require('../src/stores/business.store') as typeof import('../src/stores/business.store');
          const bid = useBusinessStore.getState().activeBusiness?.id;
          if (bid) {
            drainPending(bid).catch((error) => {
              console.error('[SyncJobs] Drain failed:', error);
            });
          }
        } catch (error) {
          console.error('[SyncJobs] Drain failed:', error);
        }
        // Reference data changes missed while offline (e.g. menu edits made on
        // another device) are caught up on reconnect. This is the design-level
        // safety net for devices that receive no LAN event.
        syncReferenceDataOnReconnect().catch((error) => {
          console.error('[ReferenceSync] Reconnect sync failed:', error);
        });
      }
    });
    return unsubscribe;
  }, []);

  // Connect ChatClient WebSocket for real-time messaging
  useEffect(() => {
    if (isAuthenticated && user?.id && accessToken) {
      connectChatClient(user.id, accessToken, refreshToken ?? undefined).catch(console.error);
    } else {
      disconnectChatClient();
    }
  }, [isAuthenticated, user?.id, accessToken, refreshToken]);

  // Build notification action buttons based on action type
  const notificationActions = useCallback(
    (data: PushNotificationData): NotificationAction[] => {
      switch (data.action_type) {
        case 'accept_order':
          return [
            { id: 'accept_order', title: 'Accept' },
            { id: 'decline_order', title: 'Decline' },
          ];
        case 'review_join_request':
          return [
            { id: 'approve_join_request', title: 'Approve' },
            { id: 'decline_join_request', title: 'Decline' },
          ];
        case 'accept_invitation':
          return [
            { id: 'accept_invitation', title: 'Accept' },
            { id: 'decline_invitation', title: 'Decline' },
          ];
        default:
          return [];
      }
    },
    [],
  );

  // Handle Notifee notification action button press
  const handleNotifeeAction = useCallback(
    (actionId: string, data: PushNotificationData) => {
      const orderId = data.order_id || data.orderId;
      const actionType = data.action_type;
      const code = data.code;
      const route = data.route;
      const joinRequestId = data.join_request_id;

      switch (actionId) {
        case 'accept_order':
          if (orderId) {
            sellerService.acceptOrder(orderId).catch(console.error);
            router.push(`/order/${orderId}`);
          }
          return;
        case 'decline_order':
          if (orderId) sellerService.rejectOrder(orderId).catch(console.error);
          return;
        case 'approve_join_request':
          if (joinRequestId) {
            fleetService.approveJoinRequest(joinRequestId).catch(console.error);
            if (route) router.push(route);
          }
          return;
        case 'decline_join_request':
          if (joinRequestId) fleetService.rejectJoinRequest(joinRequestId).catch(console.error);
          return;
        case 'accept_invitation':
          if (code) fleetService.acceptFleetInvitation({ code }).catch(console.error);
          if (route) router.push(route);
          return;
        case 'decline_invitation':
          return;
        case 'navigate':
          if (route) { router.push(route); return; }
          break;
      }

      if (orderId) {
        router.push(`/order/${orderId}`);
      } else if (route) {
        router.push(route);
      }
    },
    [],
  );

  // Set up all notification infrastructure via shared library
  useEffect(() => {
    if (!isAuthenticated) return;

    setupNotifications({
      http: api,
      appType: 'business',
      buildActions: notificationActions,
      onActionPress: handleNotifeeAction,
      navigateToRoute: (route: string) => router.push(route),
    }).catch(console.error);
  }, [isAuthenticated]);

  const isReady = authHydrated && onboardingHydrated && locationHydrated && roleHydrated;
  const isAuthenticated = Boolean(user && accessToken);
  // Use the user's selected intent (user.role) rather than backend-assigned
  // roles (user.roles).  New users who selected "seller" only have
  // roles: ["buyer"] until they create a business.
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
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'background' && nextAppState === 'active') {
        if (isAuthenticated && !phoenixSocket.isConnected()) {
          phoenixSocket.retryConnection();
        }
        // iOS suspends the app in the background, which drops the Local Node
        // server/client sockets. Reconnect/re-bind on return to the foreground:
        // clients force a fresh connect (iOS may have dropped the socket while
        // the lib still reports it connected) and the node re-binds if it is no
        // longer listening.
        localNodeService.reconnectNow();
        if (isBiometricEnabled) {
          setIsUnlocked(false);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isBiometricEnabled]);

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
            <AlertContainer />
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
            <AlertProvider>
              <AppShell />
            </AlertProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}