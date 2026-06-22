import { api } from './api';
import type {
  RiderProfileResponse,
  RiderKycResponse,
  RiderDeliveriesResponse,
  RiderDelivery,
  RiderDeliveryDetailResponse,
  RiderEarningsResponse,
  RiderVehicleResponse,
  AvailableOrdersResponse,
  RiderDashboardResponse,
  PaginationMeta,
} from '@/types/api';

// ─── Rider Profile ───

export async function fetchRiderProfile(): Promise<RiderProfileResponse> {
  return api.get<RiderProfileResponse>('/riders/profile');
}

export async function createRiderProfile(data: Record<string, unknown>): Promise<RiderProfileResponse> {
  return api.post<RiderProfileResponse>('/riders/profile', data);
}

export async function updateRiderProfile(data: Record<string, unknown>): Promise<RiderProfileResponse> {
  return api.patch<RiderProfileResponse>('/riders/profile', data);
}

export async function deactivateRider(): Promise<{ data: Record<string, unknown> }> {
  return api.post('/riders/deactivate');
}

export async function updateOnlineStatus(isOnline: boolean): Promise<RiderProfileResponse> {
  return api.patch<RiderProfileResponse>('/riders/profile', { status: isOnline ? 'available' : 'offline' });
}

// ─── Rider KYC ───

export async function fetchRiderKycStatus(): Promise<RiderKycResponse> {
  return api.get<RiderKycResponse>('/riders/kyc');
}

export async function submitRiderKyc(data: Record<string, unknown>): Promise<{ data: Record<string, unknown> }> {
  return api.post('/riders/kyc', data);
}

// ─── Rider Join ───

export async function submitRiderJoinRequest(data: Record<string, unknown>): Promise<{ data: Record<string, unknown> }> {
  return api.post('/riders/join', data);
}

// ─── Rider Location ───

export async function updateRiderLocation(latitude: number, longitude: number): Promise<void> {
  return api.post('/riders/location', { latitude, longitude });
}

// ─── Available Orders (ready for claim) ───

export async function fetchAvailableOrders(): Promise<AvailableOrdersResponse> {
  return api.get<AvailableOrdersResponse>('/riders/available-orders');
}

// ─── Deliveries ───

export async function fetchRiderDeliveries(
  page = 1,
  pageSize = 20,
  filters?: { q?: string; status?: string; order_number?: string; date_from?: string; date_to?: string }
): Promise<RiderDeliveriesResponse> {
  return api.get<RiderDeliveriesResponse>('/riders/deliveries', { params: { page, page_size: pageSize, ...filters } });
}

export async function fetchActiveDelivery(): Promise<RiderDeliveriesResponse> {
  return api.get<RiderDeliveriesResponse>('/riders/deliveries', { params: { page: 1, page_size: 1 } });
}

export async function fetchDeliveryDetail(deliveryId: string): Promise<RiderDeliveryDetailResponse> {
  return api.get<RiderDeliveryDetailResponse>(`/deliveries/${deliveryId}`);
}

export async function acceptDelivery(orderId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post('/deliveries/claim', { order_id: orderId });
}

export async function markDeliveryInTransit(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${deliveryId}/in-transit`);
}

export async function markDeliveryArrived(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${deliveryId}/arrived`);
}

export async function markDeliveryDelivered(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${deliveryId}/delivered`);
}

export async function markDeliveryFailed(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${deliveryId}/failed`);
}

export async function markDeliveryReturned(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${deliveryId}/return`);
}

export async function confirmDeliveryPickup(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  console.log('[rider.service] confirmDeliveryPickup called:', { deliveryId, url: `/deliveries/${deliveryId}/confirm-pickup` });
  return api.post(`/deliveries/${deliveryId}/confirm-pickup`);
}

export async function confirmDeliveryHandover(deliveryId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/deliveries/${deliveryId}/confirm-handover`);
}

// ─── Earnings ───

export async function fetchRiderEarnings(): Promise<RiderEarningsResponse> {
  return api.get<RiderEarningsResponse>('/riders/earnings');
}

export async function fetchEarningsBreakdown(): Promise<RiderEarningsResponse> {
  return api.get<RiderEarningsResponse>('/riders/earnings');
}

export async function fetchRiderEarningsSummary(period: 'today' | 'this_week' | 'this_month'): Promise<{
  data: {
    total_earnings_minor: number;
    total_deliveries: number;
    currency: string;
    period: string;
  };
}> {
  return api.get('/riders/earnings/summary', { params: { period } });
}

// ─── Wallet ───

export async function fetchWalletBalance(): Promise<{ data: { balance_minor: number; currency: string } }> {
  return api.get('/wallet/balance');
}

export async function fetchWalletHistory(page = 1, pageSize = 20): Promise<{ data: { entries: Record<string, unknown>[] }; pagination: PaginationMeta }> {
  return api.get('/wallet/history', { params: { page, page_size: pageSize, type: 'rider' } });
}

// ─── Vehicle ───

export async function fetchVehicleInfo(): Promise<RiderVehicleResponse> {
  return api.get<RiderVehicleResponse>('/riders/vehicle');
}

export async function createVehicle(data: Record<string, unknown>): Promise<RiderVehicleResponse> {
  return api.post<RiderVehicleResponse>('/riders/vehicles', data);
}

// ─── Metrics (from profile) ───

export async function fetchRiderMetrics(): Promise<RiderProfileResponse> {
  return api.get<RiderProfileResponse>('/riders/profile');
}

export async function fetchRiderDashboard(): Promise<RiderDashboardResponse> {
  return api.get<RiderDashboardResponse>('/riders/dashboard');
}

export async function fetchRiderStatistics(): Promise<RiderProfileResponse> {
  return api.get<RiderProfileResponse>('/riders/profile');
}

// ─── Placeholder stubs (no backend endpoint yet) ───

export async function fetchDeliveryZones(): Promise<never> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function updateDeliveryZones(_zones: unknown): Promise<never> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function toggleDeliveryZone(_zoneId: string, _enabled: boolean): Promise<never> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function fetchNavigationSettings(): Promise<never> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function updateNavigationSettings(_settings: unknown): Promise<never> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function fetchNavigationApps(): Promise<never> {
  return Promise.reject(new Error('Not implemented on backend'));
}

export async function fetchVehicleTypes(): Promise<never> {
  return Promise.reject(new Error('Not implemented on backend'));
}
