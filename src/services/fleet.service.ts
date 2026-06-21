import { api } from './api';

// ─── Riders ───

export async function fetchFleetRiders(): Promise<any> {
  return api.get('/business/riders');
}

export async function inviteRider(data: any): Promise<any> {
  return api.post('/business/riders/invite', data);
}

export async function approveRider(riderId: string): Promise<any> {
  return api.post(`/business/riders/${riderId}/approve`);
}

export async function suspendRider(riderId: string): Promise<any> {
  return api.post(`/business/riders/${riderId}/suspend`);
}

export async function activateRider(riderId: string): Promise<any> {
  return api.post(`/business/riders/${riderId}/activate`);
}

export async function fetchRiderKyc(riderId: string): Promise<any> {
  return api.get(`/business/riders/${riderId}/kyc`);
}

export async function fetchJoinRequests(): Promise<any> {
  return api.get('/business/riders/join-requests');
}

export async function approveJoinRequest(requestId: string): Promise<any> {
  return api.post(`/business/riders/join-requests/${requestId}/approve`);
}

export async function rejectJoinRequest(requestId: string): Promise<any> {
  return api.post(`/business/riders/join-requests/${requestId}/reject`);
}

export async function fetchInvitations(): Promise<any> {
  return api.get('/business/riders/invitations');
}

export async function revokeInvitation(invitationId: string): Promise<any> {
  return api.post(`/business/riders/invitations/${invitationId}/revoke`);
}

// ─── Vehicles ───

export async function fetchFleetVehicles(): Promise<any> {
  return api.get('/business/vehicles');
}

export async function addVehicle(data: any): Promise<any> {
  return api.post('/business/vehicles', data);
}

export async function removeVehicle(vehicleId: string): Promise<any> {
  return api.post(`/business/vehicles/${vehicleId}/remove`);
}

// ─── Fleet Invitation ───

export async function acceptFleetInvitation(data: any): Promise<any> {
  return api.post('/fleet/accept-invitation', data);
}

// ─── Dashboard ───

export async function fetchFleetDashboard(): Promise<any> {
  return api.get('/business/riders');
}
