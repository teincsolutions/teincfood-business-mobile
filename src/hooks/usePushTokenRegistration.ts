import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { devicesService } from '@/services/devices.service';
import { accountStorage, getActiveAccountId, mmkvStorage } from '@/utils/storage';
import { registerBackgroundPushHandler, registerForegroundPushHandler } from '@/services/background-push-handler.service';
import { trackEvent } from '@/utils/observability';

let currentToken: string | null = null;
let refreshUnsubscribe: (() => void) | undefined;

const REGISTERED_TOKEN_KEY = 'push_token_registered';
const REGISTERED_TOKEN_ID_KEY = 'push_token_id';
/** Device-level queue of token ids whose logout unregister failed offline. */
const PENDING_UNREGISTER_KEY = 'push_pending_unregister_ids';

function readPendingUnregisters(): string[] {
  try {
    const raw = mmkvStorage.getString(PENDING_UNREGISTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function writePendingUnregisters(ids: string[]): void {
  try {
    if (ids.length === 0) mmkvStorage.delete(PENDING_UNREGISTER_KEY);
    else mmkvStorage.set(PENDING_UNREGISTER_KEY, JSON.stringify(ids));
  } catch {}
}

function queuePendingUnregister(tokenId: string): void {
  const ids = readPendingUnregisters();
  if (!ids.includes(tokenId)) writePendingUnregisters([...ids, tokenId]);
}

/**
 * A logout while offline cannot reach the backend, leaving the previous
 * account's token active. Retry those deletes before the next account
 * registers the same physical device token.
 */
async function flushPendingUnregisters(): Promise<void> {
  const ids = readPendingUnregisters();
  if (ids.length === 0) return;
  const remaining: string[] = [];
  for (const id of ids) {
    try {
      await devicesService.unregisterPushToken(id);
    } catch {
      remaining.push(id);
    }
  }
  writePendingUnregisters(remaining);
}

function getStoredTokenHash(): string | null {
  return accountStorage.getString(REGISTERED_TOKEN_KEY) || null;
}

function setStoredTokenHash(token: string): void {
  accountStorage.set(REGISTERED_TOKEN_KEY, token);
}

export function getStoredTokenId(): string | null {
  return accountStorage.getString(REGISTERED_TOKEN_ID_KEY) || null;
}

function clearStoredTokenId(): void {
  accountStorage.delete(REGISTERED_TOKEN_ID_KEY);
}

async function registerToken(token: string): Promise<void> {
  // Never write a push registration without an account scope. Compare against
  // this account's stored token, not just the module variable: the same FCM
  // token is reused after logout, and it must be re-registered for the new
  // account so notification ownership moves to that user.
  if (!getActiveAccountId()) return;
  if (token === currentToken && getStoredTokenHash() === token) return;
  try {
    const response = await devicesService.registerPushToken(token);
    console.log('[PushToken] Backend registration response:', JSON.stringify(response));
    currentToken = token;
    setStoredTokenHash(token);
    trackEvent('device.push_token.registered');
    if (response?.data?.id) {
      accountStorage.set(REGISTERED_TOKEN_ID_KEY, response.data.id);
    }
    console.log('[PushToken] Token stored locally');
  } catch (error) {
    console.warn('[PushToken] Registration failed:', error);
  }
}

export async function register(): Promise<void> {
  console.log('[PushToken] Starting push token registration...');
  // A previous account's refresh listener must not survive a login switch.
  cleanup();

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
    await flushPendingUnregisters();
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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('FIS_AUTH_ERROR')) {
      console.warn('[PushToken] FIS_AUTH_ERROR — Firebase not configured for this device/emulator. Push notifications unavailable.');
    } else {
      console.error('[PushToken] Failed:', error);
    }
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
      // Keep the id device-level so the next online login can retry it even
      // though this account's scoped keys are about to be cleared.
      queuePendingUnregister(tokenId);
    }
  }
  clearStoredTokenId();
  accountStorage.delete(REGISTERED_TOKEN_KEY);
  currentToken = null;
}
