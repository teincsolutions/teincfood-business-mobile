import { api } from './api';

// ─── Rider Profile ───

export async function fetchRiderProfile(): Promise<any> {
  return api.get('/riders/profile');
}

export async function createRiderProfile(data: any): Promise<any> {
  return api.post('/riders/profile', data);
}

export async function updateRiderProfile(data: any): Promise<any> {
  return api.patch('/riders/profile', data);
}

export async function deactivateRider(): Promise<any> {
  return api.post('/riders/deactivate');
}

export async function updateOnlineStatus(isOnline: boolean): Promise<any> {
  return api.patch('/riders/profile', { is_online: isOnline });
}

// ─── Rider KYC ───

export async function fetchRiderKycStatus(): Promise<any> {
  return api.get('/riders/kyc');
}

export async function submitRiderKyc(data: any): Promise<any> {
  return api.post('/riders/kyc', data);
}

// ─── Rider Join ───

export async function submitRiderJoinRequest(data: any): Promise<any> {
  return api.post('/riders/join', data);
}

// ─── Rider Location ───

export async function updateRiderLocation(latitude: number, longitude: number): Promise<any> {
  return api.post('/riders/location', { latitude, longitude });
}

// ─── Deliveries ───

export async function fetchRiderDeliveries(): Promise<any> {
  return api.get('/riders/deliveries');
}

export async function fetchActiveDelivery(): Promise<any | null> {
  return api.get('/riders/deliveries');
}

export async function fetchDeliveryDetail(deliveryId: string): Promise<any> {
  return api.get(`/deliveries/${deliveryId}`);
}

export async function acceptDelivery(deliveryId: string): Promise<any> {
  return api.post('/deliveries/claim', { delivery_id: deliveryId });
}

export async function markDeliveryInTransit(deliveryId: string): Promise<any> {
  return api.post(`/deliveries/${deliveryId}/in-transit`);
}

export async function markDeliveryArrived(deliveryId: string): Promise<any> {
  return api.post(`/deliveries/${deliveryId}/arrived`);
}

export async function markDeliveryDelivered(deliveryId: string): Promise<any> {
  return api.post(`/deliveries/${deliveryId}/delivered`);
}

export async function markDeliveryFailed(deliveryId: string): Promise<any> {
  return api.post(`/deliveries/${deliveryId}/failed`);
}

export async function markDeliveryReturned(deliveryId: string): Promise<any> {
  return api.post(`/deliveries/${deliveryId}/return`);
}

export async function confirmDeliveryPickup(deliveryId: string): Promise<any> {
  return api.post(`/deliveries/${deliveryId}/confirm-pickup`);
}

export async function confirmDeliveryHandover(deliveryId: string): Promise<any> {
  return api.post(`/deliveries/${deliveryId}/confirm-handover`);
}

// ─── Earnings ───

export async function fetchRiderEarnings(): Promise<any> {
  return api.get('/riders/earnings');
}

export async function fetchEarningsBreakdown(): Promise<any> {
  return api.get('/riders/earnings');
}

// ─── Wallet ───

export async function fetchWalletBalance(): Promise<any> {
  return api.get('/wallet/balance');
}

export async function fetchWalletHistory(): Promise<any> {
  return api.get('/wallet/history');
}

// ─── Vehicle ───

export async function fetchVehicleInfo(): Promise<any> {
  return api.get('/riders/vehicle');
}

export async function createVehicle(data: any): Promise<any> {
  return api.post('/riders/vehicles', data);
}

// ─── Metrics (from profile) ───

export async function fetchRiderMetrics(): Promise<any> {
  return api.get('/riders/profile');
}

export async function fetchRiderStatistics(): Promise<any> {
  return api.get('/riders/profile');
}

// ─── Placeholder stubs (no backend endpoint yet) ───

export async function fetchDeliveryZones(): Promise<any> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function updateDeliveryZones(zones: any): Promise<any> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function toggleDeliveryZone(zoneId: string, enabled: boolean): Promise<any> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function fetchNavigationSettings(): Promise<any> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function updateNavigationSettings(settings: any): Promise<any> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function fetchNavigationApps(): Promise<any> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function fetchVehicleTypes(): Promise<any> {
  return Promise.reject(new Error('Not implemented on backend'));
}
