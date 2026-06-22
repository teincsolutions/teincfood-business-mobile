import { api } from './api';
import type {
  FleetRider,
  FleetRidersResponse,
  FleetVehicle,
  FleetVehiclesResponse,
  FleetDashboardResponse,
} from '@/types/api';

// ─── Riders ───

export async function fetchFleetRiders(businessId?: string): Promise<FleetRidersResponse> {
  return api.get<FleetRidersResponse>('/business/riders', {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function inviteRider(data: Record<string, unknown>, businessId?: string): Promise<{ data: Record<string, unknown> }> {
  return api.post('/business/riders/invite', { ...data, ...(businessId ? { business_id: businessId } : {}) });
}

export async function approveRider(riderId: string, businessId?: string): Promise<{ data: FleetRider }> {
  return api.post(`/business/riders/${riderId}/approve`, undefined, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function suspendRider(riderId: string, businessId?: string): Promise<{ data: FleetRider }> {
  return api.post(`/business/riders/${riderId}/suspend`, undefined, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function activateRider(riderId: string, businessId?: string): Promise<{ data: FleetRider }> {
  return api.post(`/business/riders/${riderId}/activate`, undefined, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function fetchRiderKyc(riderId: string, businessId?: string): Promise<{ data: Record<string, unknown> }> {
  return api.get(`/business/riders/${riderId}/kyc`, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function fetchJoinRequests(businessId?: string): Promise<{ data: Record<string, unknown>[] }> {
  return api.get('/business/riders/join-requests', {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function approveJoinRequest(requestId: string, businessId?: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/riders/join-requests/${requestId}/approve`, undefined, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function rejectJoinRequest(requestId: string, businessId?: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/riders/join-requests/${requestId}/reject`, undefined, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function fetchInvitations(businessId?: string): Promise<{ data: Record<string, unknown>[] }> {
  return api.get('/business/riders/invitations', {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function revokeInvitation(invitationId: string, businessId?: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/riders/invitations/${invitationId}/revoke`, undefined, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

// ─── Vehicles ───

export async function fetchFleetVehicles(businessId?: string): Promise<FleetVehiclesResponse> {
  return api.get<FleetVehiclesResponse>('/business/vehicles', {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

export async function addVehicle(data: Record<string, unknown>, businessId?: string): Promise<{ data: FleetVehicle }> {
  return api.post('/business/vehicles', { ...data, ...(businessId ? { business_id: businessId } : {}) });
}

export async function removeVehicle(vehicleId: string, businessId?: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/vehicles/${vehicleId}/remove`, undefined, {
    params: businessId ? { business_id: businessId } : undefined,
  });
}

// ─── Fleet Invitation ───

export async function acceptFleetInvitation(data: Record<string, unknown>): Promise<{ data: Record<string, unknown> }> {
  return api.post('/fleet/accept-invitation', data);
}

// ─── Dashboard ───

export async function fetchFleetDashboard(businessId?: string): Promise<FleetDashboardResponse> {
  return api.get<FleetDashboardResponse>('/business/riders/dashboard', {
    params: businessId ? { business_id: businessId } : undefined,
  });
}
