/**
 * Android Live Notification Demo Service
 * Uses @notifee/react-native to demonstrate rich Android notifications:
 *  - Progress bar (order tracking)
 *  - Chronometer (countdown timer)
 *  - Action buttons (accept / decline)
 */

import { Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
  Event,
} from '@notifee/react-native';
import { ensureNotificationChannels, CHANNELS } from './android-notifee-channels.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProgressNotificationConfig {
  orderId: string;
  orderNumber: string;
  status: string;
  progressPercent: number;
}

export interface ChronometerNotificationConfig {
  orderId: string;
  orderNumber: string;
  etaSeconds: number; // countdown from this many seconds
}

export interface ActionNotificationConfig {
  orderId: string;
  orderNumber: string;
  customerName: string;
  restaurantName: string;
  total: string;
}

type ActionCallback = (actionId: string, orderId: string) => void;

// ─── State ───────────────────────────────────────────────────────────────────

const activeNotifications = new Map<string, string>(); // key -> notificationId
let actionCallback: ActionCallback | null = null;
let foregroundListenerAttached = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusTitle(status: string): string {
  switch (status) {
    case 'confirmed': return 'Order Confirmed ✅';
    case 'preparing': return 'Preparing Your Order 👨‍🍳';
    case 'on_the_way': return 'On The Way 🚗';
    case 'delivered': return 'Delivered 🎉';
    default: return 'Order Update';
  }
}

function statusBody(status: string): string {
  switch (status) {
    case 'confirmed': return 'Your order has been confirmed and will be prepared soon.';
    case 'preparing': return 'The restaurant is preparing your delicious meal.';
    case 'on_the_way': return 'Your rider is on the way with your order!';
    case 'delivered': return 'Your order has been delivered. Enjoy your meal!';
    default: return 'Your order status has been updated.';
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ─── Foreground Event Listener ───────────────────────────────────────────────

function ensureForegroundListener(): void {
  if (foregroundListenerAttached) return;
  foregroundListenerAttached = true;

  notifee.onForegroundEvent(({ type, detail }: Event) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id && detail.notification?.data) {
      const actionId = detail.pressAction.id;
      const orderId = (detail.notification.data.orderId as string) || '';
      console.log(`[LiveNotificationDemo] Action pressed: ${actionId} for order ${orderId}`);

      if (actionCallback) {
        actionCallback(actionId, orderId);
      }
    }
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Set a callback that fires when the user taps an action button.
 */
export function onActionPress(callback: ActionCallback): void {
  ensureForegroundListener();
  actionCallback = callback;
}

/**
 * Remove the action callback.
 */
export function offActionPress(): void {
  actionCallback = null;
}

// ─── Progress Bar Notification ───────────────────────────────────────────────

/**
 * Shows or updates a progress bar notification for an order.
 */
export async function showProgressNotification(
  config: ProgressNotificationConfig
): Promise<string | null> {
  if (Platform.OS !== 'android') {
    console.log('[LiveNotificationDemo] Progress notification (mock):', config);
    return null;
  }

  await ensureNotificationChannels();

  const notificationId = await notifee.displayNotification({
    title: `Order #${config.orderNumber}`,
    body: `${statusTitle(config.status)} — ${config.progressPercent}%`,
    data: { orderId: config.orderId, type: 'progress' },
    android: {
      channelId: CHANNELS.ORDER_UPDATES,
      smallIcon: 'ic_launcher', // uses default app icon
      color: '#FF7622', // brand orange
      style: {
        type: AndroidStyle.BIGTEXT,
        text: statusBody(config.status),
        title: statusTitle(config.status),
        summary: `Order #${config.orderNumber}`,
      },
      progress: {
        max: 100,
        current: config.progressPercent,
        indeterminate: false,
      },
      pressAction: { id: 'view_order' },
      ongoing: config.progressPercent < 100,
      autoCancel: config.progressPercent >= 100,
    },
  });

  activeNotifications.set(`progress_${config.orderId}`, notificationId);
  console.log(`[LiveNotificationDemo] Progress notification displayed: ${notificationId}`);
  return notificationId;
}

/**
 * Dismisses the progress notification for an order.
 */
export async function dismissProgressNotification(orderId: string): Promise<void> {
  const key = `progress_${orderId}`;
  const notificationId = activeNotifications.get(key);
  if (notificationId) {
    await notifee.cancelNotification(notificationId);
    activeNotifications.delete(key);
  }
}

// ─── Chronometer (Countdown) Notification ────────────────────────────────────

/**
 * Shows a chronometer notification that counts DOWN from etaSeconds.
 * The timestamp is set to now + etaSeconds so Notifee counts down automatically.
 */
export async function showChronometerNotification(
  config: ChronometerNotificationConfig
): Promise<string | null> {
  if (Platform.OS !== 'android') {
    console.log('[LiveNotificationDemo] Chronometer notification (mock):', config);
    return null;
  }

  await ensureNotificationChannels();

  // Notifee counts DOWN when timestamp is in the future
  const targetTimestamp = Date.now() + config.etaSeconds * 1000;

  const notificationId = await notifee.displayNotification({
    title: `Order #${config.orderNumber} — ETA`,
    body: 'Estimated time remaining:',
    data: { orderId: config.orderId, type: 'chronometer' },
    android: {
      channelId: CHANNELS.LIVE_TIMERS,
      smallIcon: 'ic_launcher',
      color: '#FF7622',
      style: {
        type: AndroidStyle.BIGTEXT,
        text: `Your order is on the way! Estimated delivery in ${formatTime(config.etaSeconds)}.`,
        title: 'Delivery Timer',
        summary: `Order #${config.orderNumber}`,
      },
      timestamp: targetTimestamp,
      chronometerDirection: 'down',
      pressAction: { id: 'view_order' },
      ongoing: true,
      autoCancel: false,
    },
  });

  activeNotifications.set(`chrono_${config.orderId}`, notificationId);
  console.log(`[LiveNotificationDemo] Chronometer notification displayed: ${notificationId}`);
  return notificationId;
}

/**
 * Dismisses the chronometer notification for an order.
 */
export async function dismissChronometerNotification(orderId: string): Promise<void> {
  const key = `chrono_${orderId}`;
  const notificationId = activeNotifications.get(key);
  if (notificationId) {
    await notifee.cancelNotification(notificationId);
    activeNotifications.delete(key);
  }
}

// ─── Action Button Notification ──────────────────────────────────────────────

/**
 * Shows a notification with Accept / Decline action buttons.
 * Simulates a scenario like "A driver wants to accept your order".
 */
export async function showActionNotification(
  config: ActionNotificationConfig
): Promise<string | null> {
  if (Platform.OS !== 'android') {
    console.log('[LiveNotificationDemo] Action notification (mock):', config);
    return null;
  }

  await ensureNotificationChannels();
  ensureForegroundListener();

  const notificationId = await notifee.displayNotification({
    title: `New Order #${config.orderNumber}`,
    body: `${config.customerName} — ${config.total} from ${config.restaurantName}`,
    data: { orderId: config.orderId, type: 'action' },
    android: {
      channelId: CHANNELS.ACTION_NOTIFICATIONS,
      smallIcon: 'ic_launcher',
      color: '#FF7622',
      style: {
        type: AndroidStyle.BIGTEXT,
        text: `Customer: ${config.customerName}\nRestaurant: ${config.restaurantName}\nTotal: ${config.total}`,
        title: `Order #${config.orderNumber}`,
        summary: 'Action Required',
      },
      actions: [
        {
          title: '✅ Accept Order',
          pressAction: { id: 'accept_order' },
        },
        {
          title: '❌ Decline',
          pressAction: { id: 'decline_order' },
        },
      ],
      pressAction: { id: 'view_order' },
      autoCancel: false,
    },
  });

  activeNotifications.set(`action_${config.orderId}`, notificationId);
  console.log(`[LiveNotificationDemo] Action notification displayed: ${notificationId}`);
  return notificationId;
}

/**
 * Dismisses the action notification for an order.
 */
export async function dismissActionNotification(orderId: string): Promise<void> {
  const key = `action_${orderId}`;
  const notificationId = activeNotifications.get(key);
  if (notificationId) {
    await notifee.cancelNotification(notificationId);
    activeNotifications.delete(key);
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Dismisses all demo notifications.
 */
export async function dismissAllDemoNotifications(): Promise<void> {
  for (const [, notificationId] of activeNotifications) {
    await notifee.cancelNotification(notificationId);
  }
  activeNotifications.clear();
  console.log('[LiveNotificationDemo] All demo notifications dismissed');
}