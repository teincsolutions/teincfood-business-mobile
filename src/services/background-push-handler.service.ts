import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle } from '@notifee/react-native';
import { ensureNotificationChannels } from './android-notifee-channels.service';
import { getNotificationSound } from './notification-sounds';

const INVITATION_CATEGORIES = ['rider_invitation', 'business_member_invitation'];

async function displayPushNotification(
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  try {
    await ensureNotificationChannels();
    const sound = getNotificationSound(data.sound);

    await notifee.displayNotification({
      title,
      body,
      data: {
        orderId: data.order_id || '',
        orderNumber: data.order_number || '',
        restaurantName: data.restaurant_name || '',
        status: data.status || '',
      },
      android: {
        channelId: 'order-updates',
        sound,
        smallIcon: 'ic_launcher',
        color: '#FF7622',
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body,
          title,
          summary: orderNumber ? `Order #${orderNumber}` : undefined,
        },
        pressAction: { id: 'view_order' },
        ongoing: status !== 'delivered' && status !== 'cancelled',
        autoCancel: status === 'delivered' || status === 'cancelled',
      },
    });
  } catch (error) {
    console.error('[PushHandler] Failed to display notification:', error);
  }
}

async function displayInvitationNotification(
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  try {
    await ensureNotificationChannels();
    const sound = getNotificationSound(data.sound);
    const notificationCategory = data.notification_category || '';

    await notifee.displayNotification({
      title,
      body,
      data: {
        notification_category: notificationCategory,
        code: data.code || '',
        action_required: 'true',
        action_type: data.action_type || 'accept_invitation',
      },
      android: {
        channelId: 'action-notifications',
        sound,
        smallIcon: 'ic_launcher',
        color: '#FF7622',
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body,
          title,
        },
        pressAction: { id: 'open_invitation' },
        actions: [
          { title: 'Accept', pressAction: { id: 'accept_invitation' } },
          { title: 'Dismiss', pressAction: { id: 'decline_invitation' } },
        ],
      },
    });
  } catch (error) {
    console.error('[PushHandler] Failed to display invitation notification:', error);
  }
}

async function handleRemoteMessage(
  title: string,
  body: string,
  data: Record<string, string> | undefined,
): Promise<void> {
  if (!data) return;

  const notificationCategory = data.notification_category;

  if (notificationCategory && INVITATION_CATEGORIES.includes(notificationCategory)) {
    await displayInvitationNotification(title, body, data);
  } else {
    await displayPushNotification(title, body, data);
  }
}

let bgRegistered = false;
let fgRegistered = false;

export function registerBackgroundPushHandler(): void {
  if (bgRegistered) return;
  if (Platform.OS !== 'android') return;

  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      const title = remoteMessage.notification?.title || '';
      const body = remoteMessage.notification?.body || '';
      const ndata = remoteMessage.data as Record<string, string> | undefined;
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
      const title = remoteMessage.notification?.title || '';
      const body = remoteMessage.notification?.body || '';
      const ndata = remoteMessage.data as Record<string, string> | undefined;
      await handleRemoteMessage(title, body, ndata);
    });
    fgRegistered = true;
    console.log('[PushHandler] Foreground push handler registered');
  } catch (error) {
    console.warn('[PushHandler] Failed to register foreground handler:', error);
  }
}
