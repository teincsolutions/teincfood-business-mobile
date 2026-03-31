/**
 * Android Notifee Notification Channels
 * Sets up required notification channels for Android 8+ (API 26+)
 * Each channel groups notifications by purpose with unique settings
 */

import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

// Channel IDs
export const CHANNELS = {
  ORDER_UPDATES: 'order-updates',
  LIVE_TIMERS: 'live-timers',
  ACTION_NOTIFICATIONS: 'action-notifications',
} as const;

let channelsCreated = false;

/**
 * Creates all required notification channels for Android.
 * Safe to call multiple times — channels are only created once.
 */
export async function ensureNotificationChannels(): Promise<void> {
  if (channelsCreated) return;

  // Order updates channel — for progress bar notifications
  await notifee.createChannel({
    id: CHANNELS.ORDER_UPDATES,
    name: 'Order Updates',
    description: 'Live order tracking with progress updates',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
  });

  // Live timers channel — for chronometer / countdown notifications
  await notifee.createChannel({
    id: CHANNELS.LIVE_TIMERS,
    name: 'Live Timers',
    description: 'Countdown timers for delivery estimates',
    importance: AndroidImportance.DEFAULT,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: false,
  });

  // Action notifications channel — for accept/decline style notifications
  await notifee.createChannel({
    id: CHANNELS.ACTION_NOTIFICATIONS,
    name: 'Action Required',
    description: 'Notifications requiring user action (accept, decline, etc.)',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
  });

  channelsCreated = true;
  console.log('[NotifeeChannels] All notification channels created');
}