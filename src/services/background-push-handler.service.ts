import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle } from '@notifee/react-native';
import { ensureNotificationChannels } from './android-notifee-channels.service';
import { getNotificationSound } from './notification-sounds';

async function displayPushNotification(
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  const orderId = data.order_id;
  const orderNumber = data.order_number || '';
  const status = data.status;

  if (!orderId || !status) return;

  try {
    await ensureNotificationChannels();
    const sound = getNotificationSound(data.sound);

    await notifee.displayNotification({
      title,
      body,
      data: {
        orderId,
        orderNumber,
        restaurantName: data.restaurant_name || '',
        status,
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
      if (!ndata) return;
      await displayPushNotification(title, body, ndata);
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
      if (!ndata) return;
      await displayPushNotification(title, body, ndata);
    });
    fgRegistered = true;
    console.log('[PushHandler] Foreground push handler registered');
  } catch (error) {
    console.warn('[PushHandler] Failed to register foreground handler:', error);
  }
}
