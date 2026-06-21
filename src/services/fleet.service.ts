import { api } from './api';
import type {
  FleetRider,
  FleetRidersResponse,
  FleetVehicle,
  FleetVehiclesResponse,
} from '@/types/api';

// ─── Riders ───

export async function fetchFleetRiders(): Promise<FleetRidersResponse> {
  return api.get<FleetRidersResponse>('/business/riders');
}

export async function inviteRider(data: Record<string, unknown>): Promise<{ data: Record<string, unknown> }> {
  return api.post('/business/riders/invite', data);
}

export async function approveRider(riderId: string): Promise<{ data: FleetRider }> {
  return api.post(`/business/riders/${riderId}/approve`);
}

export async function suspendRider(riderId: string): Promise<{ data: FleetRider }> {
  return api.post(`/business/riders/${riderId}/suspend`);
}

export async function activateRider(riderId: string): Promise<{ data: FleetRider }> {
  return api.post(`/business/riders/${riderId}/activate`);
}

export async function fetchRiderKyc(riderId: string): Promise<{ data: Record<string, unknown> }> {
  return api.get(`/business/riders/${riderId}/kyc`);
}

export async function fetchJoinRequests(): Promise<{ data: Record<string, unknown>[] }> {
  return api.get('/business/riders/join-requests');
}

export async function approveJoinRequest(requestId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/riders/join-requests/${requestId}/approve`);
}

export async function rejectJoinRequest(requestId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/riders/join-requests/${requestId}/reject`);
}

export async function fetchInvitations(): Promise<{ data: Record<string, unknown>[] }> {
  return api.get('/business/riders/invitations');
}

export async function revokeInvitation(invitationId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/riders/invitations/${invitationId}/revoke`);
}

// ─── Vehicles ───

export async function fetchFleetVehicles(): Promise<FleetVehiclesResponse> {
  return api.get<FleetVehiclesResponse>('/business/vehicles');
}

export async function addVehicle(data: Record<string, unknown>): Promise<{ data: FleetVehicle }> {
  return api.post('/business/vehicles', data);
}

export async function removeVehicle(vehicleId: string): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/business/vehicles/${vehicleId}/remove`);
}

// ─── Fleet Invitation ───

export async function acceptFleetInvitation(data: Record<string, unknown>): Promise<{ data: Record<string, unknown> }> {
  return api.post('/fleet/accept-invitation', data);
}

// ─── Dashboard ───

export async function fetchFleetDashboard(): Promise<FleetRidersResponse> {
  return api.get<FleetRidersResponse>('/business/riders');
}
