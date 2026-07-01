/**
 * Notification Sound Mapping
 *
 * Maps the backend's `sound` field from push notification data payloads
 * to the local sound filename. The backend sends the filename without
 * extension (e.g. "order_new") — Notifee resolves this to the .wav file
 * bundled in res/raw/ on Android and the app bundle on iOS.
 *
 * To add a new sound:
 *   1. Add the .wav file to src/sounds/
 *   2. Register it in app.config.js → expo-notifications → sounds[]
 *   3. If needed, add a mapping here
 */

/** Sound filenames without extension, as sent by the backend */
export const NOTIFICATION_SOUNDS = {
  ORDER_NEW: 'order_new',
  ORDER_STATUS: 'order_status',
  ORDER_ALERT: 'order_alert',
  ORDER_COMPLETE: 'order_complete',
  ORDER_CANCELLED: 'order_cancelled',
  RIDER_PICKUP: 'rider_pickup',
  RIDER_OPPORTUNITY: 'rider_opportunity',
  TIMER_ALERT: 'timer_alert',
  NOTIFICATION_DEFAULT: 'notification_default',
} as const;

export type NotificationSoundName =
  (typeof NOTIFICATION_SOUNDS)[keyof typeof NOTIFICATION_SOUNDS];

/**
 * Returns the sound filename to use for a notification.
 * Uses the backend-provided sound from the data payload,
 * falling back to 'default' if none is provided or the
 * requested sound is not recognized.
 */
export function getNotificationSound(
  backendSound?: string,
): NotificationSoundName {
  if (!backendSound) return NOTIFICATION_SOUNDS.NOTIFICATION_DEFAULT;

  // Check if the backend-provided sound name matches one of our known sounds
  const match = Object.values(NOTIFICATION_SOUNDS).find(
    (s) => s === backendSound,
  );
  return match ?? NOTIFICATION_SOUNDS.NOTIFICATION_DEFAULT;
}
