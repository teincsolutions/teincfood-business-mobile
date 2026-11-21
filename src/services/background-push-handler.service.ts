import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidAction, AndroidStyle } from '@notifee/react-native';
import { ensureNotificationChannels } from './android-notifee-channels.service';
import { getNotificationSound } from './notification-sounds';
import { getChatClient } from '@/utils/chat-service';
import { getActiveAccountId } from '@/utils/storage';
import { useAuthStore } from '@/stores/auth.store';

function buildActions(actionType: string | undefined): AndroidAction[] {
  switch (actionType) {
    case 'accept_order':
      return [
        { title: 'Accept ✅', pressAction: { id: 'accept_order' } },
        { title: 'Decline ❌', pressAction: { id: 'decline_order' } },
      ];
    case 'review_join_request':
      return [
        { title: 'Approve ✅', pressAction: { id: 'approve_join_request' } },
        { title: 'Decline ❌', pressAction: { id: 'decline_join_request' } },
      ];
    case 'accept_invitation':
      return [
        { title: 'Accept ✅', pressAction: { id: 'accept_invitation' } },
        { title: 'Dismiss', pressAction: { id: 'decline_invitation' } },
      ];
    default:
      return [];
  }
}

async function displayPushNotification(
  title: unknown,
  body: unknown,
  data: Record<string, string>,
): Promise<void> {
  const route = data.route || '';
  const orderId = data.order_id || '';
  const orderNumber = data.order_number || '';
  const status = data.status || '';
  const actionType = data.action_type;
  const avatarUrl = data.avatar_url || data.business_logo || '';
  const businessName = data.business_name || '';
  const notifType = data.type || data.notification_category || '';

  // WhatsApp/Facebook-style: use sender/business name as title, clean message as body, avatar as icon
  // FCM can deliver non-string notification fields; Notifee's BIGTEXT style
  // rejects anything but a real string, so normalise before rendering.
  const displayTitle =
    businessName || (typeof title === "string" ? title : "") || "";
  const displayBody = typeof body === "string" ? body : "";

  try {
    await ensureNotificationChannels();
    const sound = getNotificationSound(data.sound);
    const actions = buildActions(actionType);

    await notifee.displayNotification({
      title: displayTitle,
      body: displayBody,
      data: {
        route,
        orderId,
        orderNumber,
        status,
        action_type: actionType || '',
        notification_category: data.notification_category || '',
        invitation_id: data.invitation_id || '',
        join_request_id: data.join_request_id || '',
        code: data.code || '',
        avatar_url: avatarUrl || '',
      },
      android: {
        channelId: actions.length > 0 ? 'action-notifications' : 'order-updates',
        sound,
        smallIcon: 'ic_launcher',
        ...(avatarUrl ? { largeIcon: avatarUrl } : {}),
        color: '#FF7622',
        ...(displayBody
          ? {
              style: {
                type: AndroidStyle.BIGTEXT,
                text: displayBody,
              },
            }
          : {}),
        actions,
        pressAction: { id: orderId ? 'view_order' : 'navigate' },
        ongoing: status !== 'delivered' && status !== 'cancelled' && status !== '',
        autoCancel: status === 'delivered' || status === 'cancelled',
      },
    });
  } catch (error) {
    console.error('[PushHandler] Failed to display notification:', error);
  }
}

function parseFcmPayload(data: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    try {
      result[key] = JSON.parse(value)
    } catch {
      result[key] = value
    }
  }
  return result
}

async function handleRemoteMessage(
  title: unknown,
  body: unknown,
  data: Record<string, string> | undefined,
): Promise<void> {
  if (!data) return;
  // A push token belongs to the account that registered it. After logout the
  // server unregister is best-effort, so suppress any late notification rather
  // than showing the previous account's order/invite on the login screen.
  if (!getActiveAccountId()) return;
  // Offline member sessions have no cloud session; they must not render
  // pushes that belong to whichever account last registered the device.
  if (!useAuthStore.getState().accessToken) return;
  await displayPushNotification(title, body, data);
  try {
    getChatClient().handlePushPayload(parseFcmPayload(data))
  } catch {}
}

let bgRegistered = false;
let fgRegistered = false;

export function registerBackgroundPushHandler(): void {
  if (bgRegistered) return;
  if (Platform.OS !== 'android') return;

  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      const ndata = remoteMessage.data as Record<string, string> | undefined;
      const title = remoteMessage.notification?.title || ndata?.title || '';
      const body = remoteMessage.notification?.body || ndata?.body || '';
      await handleRemoteMessage(title, body, ndata);
    });
    bgRegistered = true;
    console.log('[PushHandler] Background push handler registered');
  } catch (error) {
    console.warn('[PushHandler] Failed to register background handler:', error);
  }
}

export function registerForegroundPushHandler(): void {
  if (fgRegistered) return;

  try {
    messaging().onMessage(async (remoteMessage) => {
      const ndata = remoteMessage.data as Record<string, string> | undefined;
      const title = remoteMessage.notification?.title || ndata?.title || '';
      const body = remoteMessage.notification?.body || ndata?.body || '';
      await handleRemoteMessage(title, body, ndata);
    });
    fgRegistered = true;
    console.log('[PushHandler] Foreground push handler registered');
  } catch (error) {
    console.warn('[PushHandler] Failed to register foreground handler:', error);
  }
}
