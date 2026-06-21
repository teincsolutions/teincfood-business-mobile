import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FleetRider, FleetVehicle, FleetDashboard } from '@/types/fleet.model';
import * as fleetService from '@/services/fleet.service';
import { useBusinessStore } from '@/stores/business.store';

const FLEET_KEYS = {
  all: ['fleet'] as const,
  riders: (businessId?: string) => [...FLEET_KEYS.all, 'riders', businessId] as const,
  riderDetail: (id: string) => [...FLEET_KEYS.all, 'rider', id] as const,
  vehicles: (businessId?: string) => [...FLEET_KEYS.all, 'vehicles', businessId] as const,
  vehicleDetail: (id: string) => [...FLEET_KEYS.all, 'vehicle', id] as const,
  dashboard: (businessId?: string) => [...FLEET_KEYS.all, 'dashboard', businessId] as const,
  earnings: () => [...FLEET_KEYS.all, 'earnings'] as const,
  joinRequests: (businessId?: string) => [...FLEET_KEYS.all, 'join-requests', businessId] as const,
  invitations: (businessId?: string) => [...FLEET_KEYS.all, 'invitations', businessId] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

// ─── Riders ───

export function useFleetRidersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: FLEET_KEYS.riders(businessId),
    queryFn: () => fleetService.fetchFleetRiders(businessId),
    enabled,
  });
}

export function useInviteRiderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetService.inviteRider(data, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders(businessId) });
    },
  });
}

export function useApproveRiderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riderId: string) => fleetService.approveRider(riderId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders(businessId) });
    },
  });
}

export function useSuspendRiderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riderId: string) => fleetService.suspendRider(riderId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders(businessId) });
    },
  });
}

export function useActivateRiderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riderId: string) => fleetService.activateRider(riderId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders(businessId) });
    },
  });
}

export function useJoinRequestsQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: FLEET_KEYS.joinRequests(businessId),
    queryFn: () => fleetService.fetchJoinRequests(businessId),
    enabled,
  });
}

export function useApproveJoinRequestMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => fleetService.approveJoinRequest(requestId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.joinRequests(businessId) });
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders(businessId) });
    },
  });
}

export function useRejectJoinRequestMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => fleetService.rejectJoinRequest(requestId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.joinRequests(businessId) });
    },
  });
}

export function useFleetInvitationsQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: FLEET_KEYS.invitations(businessId),
    queryFn: () => fleetService.fetchInvitations(businessId),
    enabled,
  });
}

export function useRevokeInvitationMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => fleetService.revokeInvitation(invitationId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.invitations(businessId) });
    },
  });
}

// ─── Vehicles ───

export function useFleetVehiclesQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: FLEET_KEYS.vehicles(businessId),
    queryFn: () => fleetService.fetchFleetVehicles(businessId),
    enabled,
  });
}

export function useAddVehicleMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FleetVehicle>) => fleetService.addVehicle(data, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.vehicles(businessId) });
    },
  });
}

export function useRemoveVehicleMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => fleetService.removeVehicle(vehicleId, businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.vehicles(businessId) });
    },
  });
}

// ─── Fleet Invitation ───

export function useAcceptFleetInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fleetService.acceptFleetInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.all });
    },
  });
}

// ─── Dashboard ───

export function useFleetDashboardQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: FLEET_KEYS.dashboard(businessId),
    queryFn: () => fleetService.fetchFleetDashboard(businessId),
    enabled,
  });
}

export { FLEET_KEYS };
