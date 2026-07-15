import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { devicesService } from '@/services/devices.service';
import { mmkvStorage } from '@/utils/storage';
import { registerBackgroundPushHandler, registerForegroundPushHandler } from '@/services/background-push-handler.service';

let currentToken: string | null = null;
let refreshUnsubscribe: (() => void) | undefined;

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
  try {
    const response = await devicesService.registerPushToken(token);
    console.log('[PushToken] Backend registration response:', JSON.stringify(response));
    currentToken = token;
    setStoredTokenHash(token);
    if (response?.data?.id) {
      mmkvStorage.set(REGISTERED_TOKEN_ID_KEY, response.data.id);
    }
    console.log('[PushToken] Token stored locally');
  } catch (error) {
    console.warn('[PushToken] Registration failed:', error);
  }
}

export async function register(): Promise<void> {
  console.log('[PushToken] Starting push token registration...');

  if (!messaging) {
    console.error('[PushToken] Firebase messaging not available — skipping registration');
    return;
  }

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
    console.log('[PushToken] Registering background push handler...');
    registerBackgroundPushHandler();
    registerForegroundPushHandler();
    console.log('[PushToken] Push handlers registered');

    const fcmToken = await messaging().getToken();
    console.log('[PushToken] FCM token obtained successfully');

    await registerToken(fcmToken);
    console.log('[PushToken] Token registered with backend successfully');

    refreshUnsubscribe = messaging().onTokenRefresh(async (newToken) => {
      console.log('[PushToken] FCM token refreshed:', newToken);
      await registerToken(newToken);
    });
  } catch (error) {
    console.error('[PushToken] Failed:', error);
  }
}

export function cleanup(): void {
  refreshUnsubscribe?.();
  refreshUnsubscribe = undefined;
}

export async function unregister(): Promise<void> {
  const tokenId = getStoredTokenId();
  if (tokenId) {
    try {
      await devicesService.unregisterPushToken(tokenId);
      console.log('[PushToken] Token unregistered on logout');
    } catch (error) {
      console.warn('[PushToken] Logout unregister failed:', error);
    }
  }
  clearStoredTokenId();
  mmkvStorage.delete(REGISTERED_TOKEN_KEY);
  currentToken = null;
}
