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

export async function fetchRiderMetrics(): Promise<RiderMetrics> {
  return api.get('/v1/rider/metrics');
}

export async function fetchActiveDelivery(): Promise<RiderDelivery | null> {
  return api.get('/v1/rider/active-delivery');
}

export async function fetchRiderDeliveries(): Promise<RiderDelivery[]> {
  return api.get('/v1/rider/deliveries');
}

export async function fetchDeliveryDetail(deliveryId: string): Promise<RiderDeliveryDetail> {
  return api.get(`/v1/rider/deliveries/${deliveryId}`);
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: RiderDeliveryDetail['status']
): Promise<RiderDeliveryDetail> {
  return api.patch(`/v1/rider/deliveries/${deliveryId}/status`, { status });
}

export async function acceptDelivery(deliveryId: string): Promise<RiderDelivery> {
  return api.post(`/v1/rider/deliveries/${deliveryId}/accept`);
}

export async function fetchRiderEarnings(): Promise<RiderEarnings> {
  return api.get('/v1/rider/earnings');
}

export async function fetchEarningsBreakdown(): Promise<EarningsBreakdown> {
  return api.get('/v1/rider/earnings/breakdown');
}

export async function fetchRecentTransactions(): Promise<RiderTransaction[]> {
  return api.get('/v1/rider/transactions');
}

export async function requestPayout(amount: number): Promise<{ success: boolean; message: string }> {
  return api.post('/v1/rider/payout', { amount });
}

export async function fetchRiderStatistics(): Promise<RiderStatistics> {
  return api.get('/v1/rider/statistics');
}

export async function fetchVehicleInfo(): Promise<VehicleInfo> {
  return api.get('/v1/rider/vehicle');
}

export async function updateVehicleInfo(vehicleInfo: Partial<VehicleInfo>): Promise<VehicleInfo> {
  return api.patch('/v1/rider/vehicle', vehicleInfo);
}

export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  return api.get('/v1/rider/zones');
}

export async function updateDeliveryZones(zones: DeliveryZone[]): Promise<DeliveryZone[]> {
  return api.put('/v1/rider/zones', { zones });
}

export async function toggleDeliveryZone(zoneId: string, enabled: boolean): Promise<DeliveryZone> {
  return api.patch(`/v1/rider/zones/${zoneId}`, { enabled });
}

export async function fetchNavigationSettings(): Promise<NavigationSettings> {
  return api.get('/v1/rider/navigation-settings');
}

export async function updateNavigationSettings(settings: Partial<NavigationSettings>): Promise<NavigationSettings> {
  return api.patch('/v1/rider/navigation-settings', settings);
}

export async function updateOnlineStatus(isOnline: boolean): Promise<{ success: boolean }> {
  return api.post('/v1/rider/online-status', { isOnline });
}

export async function fetchNavigationApps(): Promise<NavigationApp[]> {
  return api.get('/v1/rider/navigation-apps');
}

export interface VehicleTypeOption {
  value: string;
  label: string;
}

export async function fetchVehicleTypes(): Promise<VehicleTypeOption[]> {
  return api.get('/v1/rider/vehicle-types');
}
