/**
 * iOS Live Activities Service
 * Uses expo-live-activity library for Lock Screen and Dynamic Island Live Activities
 */

import { Platform } from 'react-native';
import {
  startActivity,
  stopActivity,
  updateActivity,
  type LiveActivityState,
  type LiveActivityConfig as ExpoLiveActivityConfig,
} from 'expo-live-activity';

export interface LiveActivityConfig {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  total: string;
  status: string;
  progressPercent: number;
  etaText: string;
  driverName?: string;
}

// Map order status to emoji
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'confirmed': return '✅';
    case 'preparing': return '👨‍🍳';
    case 'on_the_way': return '🚗';
    case 'delivered': return '🎉';
    default: return '📦';
  }
}

function getStatusTitle(status: string): string {
  switch (status) {
    case 'confirmed': return 'Order Confirmed';
    case 'preparing': return 'Preparing Your Order';
    case 'on_the_way': return 'On The Way';
    case 'delivered': return 'Delivered';
    default: return 'Order Update';
  }
}

/**
 * Check if Live Activities are supported
 */
export async function isLiveActivitySupported(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  // expo-live-activity requires iOS 16.2+
  return true;
}

/**
 * Start a new Live Activity for an order
 * Returns the activity ID
 */
export async function startLiveActivity(config: LiveActivityConfig): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;

  const state: LiveActivityState = {
    title: `${getStatusEmoji(config.status)} ${getStatusTitle(config.status)}`,
    subtitle: `${config.orderNumber} • ${config.etaText}`,
    progressBar: {
      progress: config.progressPercent / 100,
    },
  };

  const options: ExpoLiveActivityConfig = {
    backgroundColor: '#FFFFFF',
    titleColor: '#1A1A1A',
    subtitleColor: '#666666',
    progressViewTint: '#FF7622',
    progressViewLabelColor: '#1A1A1A',
  };

  try {
    const activityId = startActivity(state, options);
    console.log('[iOS Live Activity] Started:', activityId);
    return activityId ?? null;
  } catch (error) {
    console.error('[iOS Live Activity] Failed to start:', error);
    return null;
  }
}

/**
 * Update an existing Live Activity with new order status
 */
export async function updateLiveActivity(
  activityId: string,
  config: LiveActivityConfig
): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  const state: LiveActivityState = {
    title: `${getStatusEmoji(config.status)} ${getStatusTitle(config.status)}`,
    subtitle: `${config.orderNumber} • ${config.etaText}`,
    progressBar: {
      progress: config.progressPercent / 100,
    },
  };

  try {
    updateActivity(activityId, state);
    console.log('[iOS Live Activity] Updated:', activityId, config.status, config.progressPercent + '%');
    return true;
  } catch (error) {
    console.error('[iOS Live Activity] Failed to update:', error);
    return false;
  }
}

/**
 * End a Live Activity
 */
export async function endLiveActivity(
  activityId: string,
  config: LiveActivityConfig
): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  const state: LiveActivityState = {
    title: `${getStatusEmoji(config.status)} ${getStatusTitle(config.status)}`,
    subtitle: `${config.orderNumber} • Delivered!`,
    progressBar: {
      progress: 1,
    },
  };

  try {
    stopActivity(activityId, state);
    console.log('[iOS Live Activity] Ended:', activityId);
    return true;
  } catch (error) {
    console.error('[iOS Live Activity] Failed to end:', error);
    return false;
  }
}
