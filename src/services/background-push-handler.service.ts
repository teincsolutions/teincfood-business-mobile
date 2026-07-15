import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidAction, AndroidStyle } from '@notifee/react-native';
import { ensureNotificationChannels } from './android-notifee-channels.service';
import { getNotificationSound } from './notification-sounds';

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
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  const route = data.route || '';
  const orderId = data.order_id || '';
  const orderNumber = data.order_number || '';
  const status = data.status || '';
  const actionType = data.action_type;
  const avatarUrl = data.avatar_url;

  try {
    await ensureNotificationChannels();
    const sound = getNotificationSound(data.sound);
    const actions = buildActions(actionType);

    await notifee.displayNotification({
      title,
      body,
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
        largeIcon: avatarUrl || undefined,
        color: '#FF7622',
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body,
          title,
          summary: orderNumber ? `Order #${orderNumber}` : undefined,
        },
        actions,
        pressAction: { id: route ? 'navigate' : 'view_order' },
        ongoing: status !== 'delivered' && status !== 'cancelled' && status !== '',
        autoCancel: status === 'delivered' || status === 'cancelled',
      },
    });
  } catch (error) {
    console.error('[PushHandler] Failed to display notification:', error);
  }
}

async function handleRemoteMessage(
  title: string,
  body: string,
  data: Record<string, string> | undefined,
): Promise<void> {
  if (!data) return;
  await displayPushNotification(title, body, data);
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
