import type { EventEnvelope } from './backend-contracts.types';

/**
 * Delivery interfaces only.
 * Actual APNs/FCM delivery is intentionally not mocked in-app.
 */

export interface AndroidLiveUpdatePayload {
  type: 'order.live_update';
  orderId: string;
  status: string;
  progressPercent: number;
  etaEpoch: number;
  actions?: Array<{
    id: string;
    label: string;
    deeplink: string;
  }>;
}

export interface IOSLiveActivityPayload {
  orderId: string;
  statusText: string;
  progressPercent: number;
  etaEpoch: number;
  staleDateEpoch?: number;
  relevanceScore?: number;
  timestampEpoch: number;
}

export const pushDeliveryService = {
  async sendAndroidLiveUpdate(_payload: AndroidLiveUpdatePayload): Promise<never> {
    throw new Error('Not implemented in app mock: Android FCM delivery must be handled by backend messaging service.');
  },

  async sendIOSLiveActivityUpdate(_payload: IOSLiveActivityPayload): Promise<never> {
    throw new Error('Not implemented in app mock: iOS Live Activity APNs delivery must be handled by backend APNs service.');
  },

  async sendStandardNotification(_event: EventEnvelope): Promise<never> {
    throw new Error('Not implemented in app mock: standard push delivery must be handled by backend messaging service.');
  },
};
