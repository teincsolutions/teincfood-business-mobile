import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { devicesService } from '@/services/devices.service';
import { useAuthStore } from '@/stores/auth.store';
import { mmkvStorage } from '@/utils/storage';
import {
  registerBackgroundPushHandler,
  registerForegroundPushHandler,
} from '@/services/background-push-handler.service';

let currentToken: string | null = null;

const REGISTERED_TOKEN_KEY = 'push_token_registered';
const REGISTERED_TOKEN_ID_KEY = 'push_token_id';

function getStoredTokenHash(): string | null {
  return mmkvStorage.getString(REGISTERED_TOKEN_KEY) || null;
}

function setStoredTokenHash(token: string): void {
  mmkvStorage.set(REGISTERED_TOKEN_KEY, token);
}

export function getStoredTokenId(): string | null {
  return mmkvStorage.getString(REGISTERED_TOKEN_ID_KEY) || null;
}

function clearStoredTokenId(): void {
  mmkvStorage.delete(REGISTERED_TOKEN_ID_KEY);
}

async function registerToken(token: string): Promise<void> {
  if (token === currentToken) return;
  const storedHash = getStoredTokenHash();
  if (storedHash === token) {
    currentToken = token;
    return;
  }
  try {
    const response = await devicesService.registerPushToken(token);
    console.log('[PushToken] Backend registration response:', JSON.stringify(response));
    currentToken = token;
    setStoredTokenHash(token);
    if (response?.id) {
      mmkvStorage.set(REGISTERED_TOKEN_ID_KEY, response.id);
    }
    console.log('[PushToken] Token stored locally and dedup hash set');
  } catch (error) {
    console.warn('[PushToken] Registration failed:', error);
  }
}

export async function unregisterPushTokenOnLogout(): Promise<void> {
  const tokenId = getStoredTokenId();
  if (!tokenId) return;
  try {
    await devicesService.unregisterPushToken(tokenId);
    console.log('[PushToken] Token unregistered on logout');
  } catch (error) {
    console.warn('[PushToken] Logout unregister failed:', error);
  } finally {
    clearStoredTokenId();
    mmkvStorage.delete(REGISTERED_TOKEN_KEY);
    currentToken = null;
  }
}

export function usePushTokenRegistration(enabled = true): void {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user && state.accessToken));
  const userId = useAuthStore((state) => state.user?.id);
  const ranOnce = useRef(false);
  const prevUserId = useRef(userId);

  // Reset on logout — allows new user on same device to re-register their token
  useEffect(() => {
    if (!isAuthenticated) {
      unregisterPushTokenOnLogout();
      ranOnce.current = false;
      currentToken = null;
    }
  }, [isAuthenticated]);

  // Reset when user changes (user-switch without intermediate logout)
  useEffect(() => {
    if (userId && userId !== prevUserId.current) {
      ranOnce.current = false;
      currentToken = null;
      prevUserId.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || ranOnce.current) return;

    let unsubscribeRefresh: (() => void) | undefined;

    async function init() {
      console.log('[PushToken] Starting push token registration...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const result = await Notifications.requestPermissionsAsync();
        finalStatus = result.status;
        console.log('[PushToken] Permission requested, result:', result);
      }

      console.log('[PushToken] Permission status:', finalStatus);
      if (finalStatus !== 'granted') {
        console.warn('[PushToken] Permission not granted');
        return;
      }

      try {
        // Register push notification handlers for background/foreground display
        registerBackgroundPushHandler();
        registerForegroundPushHandler();

        console.log('[PushToken] Getting FCM token...');
        const fcmToken = await messaging().getToken();
        console.log('[PushToken] FCM token obtained successfully:', fcmToken);

        await registerToken(fcmToken);
        console.log('[PushToken] Token registered with backend successfully');

        unsubscribeRefresh = messaging().onTokenRefresh(async (newToken) => {
          console.log('[PushToken] FCM token refreshed:', newToken);
          await registerToken(newToken);
        });

        ranOnce.current = true;
      } catch (error) {
        console.warn('[PushToken] Failed:', error);
      }
    }

    init();

    return () => {
      unsubscribeRefresh?.();
    };
  }, [enabled, isAuthenticated, userId]);
}
