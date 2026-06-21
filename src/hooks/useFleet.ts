import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FleetRider, FleetVehicle, FleetDashboard } from '@/types/fleet.model';
import * as fleetService from '@/services/fleet.service';

const FLEET_KEYS = {
  all: ['fleet'] as const,
  riders: () => [...FLEET_KEYS.all, 'riders'] as const,
  riderDetail: (id: string) => [...FLEET_KEYS.all, 'rider', id] as const,
  vehicles: () => [...FLEET_KEYS.all, 'vehicles'] as const,
  vehicleDetail: (id: string) => [...FLEET_KEYS.all, 'vehicle', id] as const,
  dashboard: () => [...FLEET_KEYS.all, 'dashboard'] as const,
  earnings: () => [...FLEET_KEYS.all, 'earnings'] as const,
  joinRequests: () => [...FLEET_KEYS.all, 'join-requests'] as const,
  invitations: () => [...FLEET_KEYS.all, 'invitations'] as const,
};

// ─── Riders ───

export function useFleetRidersQuery(enabled = true) {
  return useQuery({
    queryKey: FLEET_KEYS.riders(),
    queryFn: () => fleetService.fetchFleetRiders(),
    enabled,
  });
}

export function useInviteRiderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetService.inviteRider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders() });
    },
  });
}

export function useApproveRiderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riderId: string) => fleetService.approveRider(riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders() });
    },
  });
}

export function useSuspendRiderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riderId: string) => fleetService.suspendRider(riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders() });
    },
  });
}

export function useActivateRiderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (riderId: string) => fleetService.activateRider(riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders() });
    },
  });
}

export function useJoinRequestsQuery(enabled = true) {
  return useQuery({
    queryKey: FLEET_KEYS.joinRequests(),
    queryFn: () => fleetService.fetchJoinRequests(),
    enabled,
  });
}

export function useApproveJoinRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => fleetService.approveJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.joinRequests() });
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders() });
    },
  });
}

export function useRejectJoinRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => fleetService.rejectJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.joinRequests() });
    },
  });
}

export function useFleetInvitationsQuery(enabled = true) {
  return useQuery({
    queryKey: FLEET_KEYS.invitations(),
    queryFn: () => fleetService.fetchInvitations(),
    enabled,
  });
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => fleetService.revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.invitations() });
    },
  });
}

// ─── Vehicles ───

export function useFleetVehiclesQuery(enabled = true) {
  return useQuery({
    queryKey: FLEET_KEYS.vehicles(),
    queryFn: () => fleetService.fetchFleetVehicles(),
    enabled,
  });
}

export function useAddVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FleetVehicle>) => fleetService.addVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.vehicles() });
    },
  });
}

export function useRemoveVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => fleetService.removeVehicle(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.vehicles() });
    },
  });
}

// ─── Fleet Invitation ───

export function useAcceptFleetInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fleetService.acceptFleetInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.riders() });
    },
  });
}

// ─── Dashboard ───

export function useFleetDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: FLEET_KEYS.dashboard(),
    queryFn: () => fleetService.fetchFleetDashboard(),
    enabled,
  });
}

export { FLEET_KEYS };
