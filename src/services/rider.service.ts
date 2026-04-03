import { api } from './api';
import type {
  RiderMetrics,
  RiderDelivery,
  RiderDeliveryDetail,
  RiderEarnings,
  RiderTransaction,
  EarningsBreakdown,
  RiderStatistics,
  VehicleInfo,
  DeliveryZone,
  NavigationSettings,
  NavigationApp,
} from '@/models/rider.model';
import {
  MOCK_RIDER_METRICS,
  MOCK_ACTIVE_DELIVERY,
  MOCK_RIDER_DELIVERIES,
  MOCK_RECENT_DELIVERIES,
  MOCK_DELIVERY_DETAIL,
  MOCK_RIDER_EARNINGS,
  MOCK_EARNINGS_BREAKDOWN,
  MOCK_RECENT_TRANSACTIONS,
  MOCK_RIDER_STATISTICS,
  MOCK_VEHICLE_INFO,
  MOCK_DELIVERY_ZONES,
  MOCK_NAVIGATION_SETTINGS,
} from '@/mocks/rider.mock';

// Simulated API delay
const SIMULATED_DELAY = 500;

/**
 * Rider Service - API calls only
 * All TanStack Query logic is in hooks/rider.hooks.ts
 */

// ─── Metrics & Dashboard ───

export async function fetchRiderMetrics(): Promise<RiderMetrics> {
  // TODO: Replace with actual API call
  // return api.get<RiderMetrics>('/v1/rider/metrics');
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_RIDER_METRICS }), SIMULATED_DELAY);
  });
}

export async function fetchActiveDelivery(): Promise<RiderDelivery | null> {
  // TODO: Replace with actual API call
  // return api.get<RiderDelivery | null>('/v1/rider/active-delivery');
  return new Promise((resolve) => {
    // Convert RiderActiveDelivery to RiderDelivery format
    const activeDelivery: RiderDelivery = {
      id: MOCK_ACTIVE_DELIVERY.id,
      orderId: MOCK_ACTIVE_DELIVERY.orderId,
      pickup: MOCK_ACTIVE_DELIVERY.pickup,
      dropoff: MOCK_ACTIVE_DELIVERY.dropoff,
      status: MOCK_ACTIVE_DELIVERY.status,
      earnings: 12.50, // Default earnings
      currency: MOCK_RIDER_EARNINGS.currency || 'GHS',
    };
    setTimeout(() => resolve(activeDelivery), SIMULATED_DELAY);
  });
}

// ─── Deliveries ───

export async function fetchRiderDeliveries(): Promise<RiderDelivery[]> {
  // TODO: Replace with actual API call
  // return api.get<RiderDelivery[]>('/v1/rider/deliveries');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_RIDER_DELIVERIES]), SIMULATED_DELAY);
  });
}

export async function fetchDeliveryDetail(deliveryId: string): Promise<RiderDeliveryDetail> {
  // TODO: Replace with actual API call
  // return api.get<RiderDeliveryDetail>(`/v1/rider/deliveries/${deliveryId}`);
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_DELIVERY_DETAIL, id: deliveryId }), SIMULATED_DELAY);
  });
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: RiderDeliveryDetail['status']
): Promise<RiderDeliveryDetail> {
  // TODO: Replace with actual API call
  // return api.patch<RiderDeliveryDetail>(`/v1/rider/deliveries/${deliveryId}/status`, { status });
  return new Promise((resolve) => {
    const updated = { ...MOCK_DELIVERY_DETAIL, id: deliveryId, status };
    if (status === 'delivered') {
      updated.deliveredAt = new Date().toISOString();
    } else if (status === 'picked_up') {
      updated.pickedUpAt = new Date().toISOString();
    }
    setTimeout(() => resolve(updated), SIMULATED_DELAY);
  });
}

export async function acceptDelivery(deliveryId: string): Promise<RiderDelivery> {
  // TODO: Replace with actual API call
  // return api.post<RiderDelivery>(`/v1/rider/deliveries/${deliveryId}/accept`);
  return new Promise((resolve) => {
    const delivery = MOCK_RIDER_DELIVERIES.find((d) => d.id === deliveryId) || MOCK_RIDER_DELIVERIES[0];
    setTimeout(() => resolve({ ...delivery, status: 'assigned' }), SIMULATED_DELAY);
  });
}

// ─── Earnings ───

export async function fetchRiderEarnings(): Promise<RiderEarnings> {
  // TODO: Replace with actual API call
  // return api.get<RiderEarnings>('/v1/rider/earnings');
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_RIDER_EARNINGS }), SIMULATED_DELAY);
  });
}

export async function fetchEarningsBreakdown(): Promise<EarningsBreakdown> {
  // TODO: Replace with actual API call
  // return api.get<EarningsBreakdown>('/v1/rider/earnings/breakdown');
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_EARNINGS_BREAKDOWN }), SIMULATED_DELAY);
  });
}

export async function fetchRecentTransactions(): Promise<RiderTransaction[]> {
  // TODO: Replace with actual API call
  // return api.get<RiderTransaction[]>('/v1/rider/transactions');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_RECENT_TRANSACTIONS]), SIMULATED_DELAY);
  });
}

export async function requestPayout(amount: number): Promise<{ success: boolean; message: string }> {
  // TODO: Replace with actual API call
  // return api.post<{ success: boolean; message: string }>('/v1/rider/payout', { amount });
  return new Promise((resolve) => {
    const { formatPrice, DEFAULT_CURRENCY } = require('@/utils/currency');
    setTimeout(
      () =>
        resolve({
          success: true,
          message: `Payout of ${formatPrice(amount, MOCK_RIDER_EARNINGS.currency || DEFAULT_CURRENCY)} requested successfully`,
        }),
      SIMULATED_DELAY
    );
  });
}

// ─── Statistics ───

export async function fetchRiderStatistics(): Promise<RiderStatistics> {
  // TODO: Replace with actual API call
  // return api.get<RiderStatistics>('/v1/rider/statistics');
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_RIDER_STATISTICS }), SIMULATED_DELAY);
  });
}

// ─── Vehicle Info ───

export async function fetchVehicleInfo(): Promise<VehicleInfo> {
  // TODO: Replace with actual API call
  // return api.get<VehicleInfo>('/v1/rider/vehicle');
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_VEHICLE_INFO }), SIMULATED_DELAY);
  });
}

export async function updateVehicleInfo(
  vehicleInfo: Partial<VehicleInfo>
): Promise<VehicleInfo> {
  // TODO: Replace with actual API call
  // return api.patch<VehicleInfo>('/v1/rider/vehicle', vehicleInfo);
  return new Promise((resolve) => {
    setTimeout(
      () => resolve({ ...MOCK_VEHICLE_INFO, ...vehicleInfo }),
      SIMULATED_DELAY
    );
  });
}

// ─── Delivery Zones ───

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  // TODO: Replace with actual API call
  // return api.get<DeliveryZone[]>('/v1/rider/zones');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_DELIVERY_ZONES]), SIMULATED_DELAY);
  });
}

export async function updateDeliveryZones(
  zones: DeliveryZone[]
): Promise<DeliveryZone[]> {
  // TODO: Replace with actual API call
  // return api.put<DeliveryZone[]>('/v1/rider/zones', { zones });
  return new Promise((resolve) => {
    setTimeout(() => resolve(zones), SIMULATED_DELAY);
  });
}

export async function toggleDeliveryZone(
  zoneId: string,
  enabled: boolean
): Promise<DeliveryZone> {
  // TODO: Replace with actual API call
  // return api.patch<DeliveryZone>(`/v1/rider/zones/${zoneId}`, { enabled });
  const zone = MOCK_DELIVERY_ZONES.find((z) => z.id === zoneId) || MOCK_DELIVERY_ZONES[0];
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...zone, enabled }), SIMULATED_DELAY);
  });
}

// ─── Navigation Settings ───

export async function fetchNavigationSettings(): Promise<NavigationSettings> {
  // TODO: Replace with actual API call
  // return api.get<NavigationSettings>('/v1/rider/navigation-settings');
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...MOCK_NAVIGATION_SETTINGS }), SIMULATED_DELAY);
  });
}

export async function updateNavigationSettings(
  settings: Partial<NavigationSettings>
): Promise<NavigationSettings> {
  // TODO: Replace with actual API call
  // return api.patch<NavigationSettings>('/v1/rider/navigation-settings', settings);
  return new Promise((resolve) => {
    setTimeout(
      () => resolve({ ...MOCK_NAVIGATION_SETTINGS, ...settings }),
      SIMULATED_DELAY
    );
  });
}

// ─── Online Status ───

export async function updateOnlineStatus(isOnline: boolean): Promise<{ success: boolean }> {
  // TODO: Replace with actual API call
  // return api.post<{ success: boolean }>('/v1/rider/online-status', { isOnline });
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), SIMULATED_DELAY);
  });
}

// ─── Navigation Apps ───

const MOCK_NAVIGATION_APPS: NavigationApp[] = [
  {
    id: 'google_maps',
    name: 'Google Maps',
    description: 'Most popular navigation app',
    icon: '🗺️',
    installed: true,
  },
  {
    id: 'apple_maps',
    name: 'Apple Maps',
    description: 'Built-in iOS navigation',
    icon: '🍎',
    installed: true,
  },
  {
    id: 'waze',
    name: 'Waze',
    description: 'Community-based traffic alerts',
    icon: '🚗',
    installed: false,
  },
];

export async function fetchNavigationApps(): Promise<NavigationApp[]> {
  // TODO: Replace with actual API call
  // return api.get<NavigationApp[]>('/v1/rider/navigation-apps');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_NAVIGATION_APPS]), SIMULATED_DELAY);
  });
}

// ─── Vehicle Types ───

export interface VehicleTypeOption {
  value: string;
  label: string;
}

const MOCK_VEHICLE_TYPES: VehicleTypeOption[] = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'car', label: 'Car' },
];

export async function fetchVehicleTypes(): Promise<VehicleTypeOption[]> {
  // TODO: Replace with actual API call
  // return api.get<VehicleTypeOption[]>('/v1/rider/vehicle-types');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_VEHICLE_TYPES]), SIMULATED_DELAY);
  });
}
