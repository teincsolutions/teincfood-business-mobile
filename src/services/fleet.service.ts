import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  FleetManager, 
  FleetVehicle, 
  FleetRider, 
  FleetDashboard,
  FleetEarnings,
  CreateFleetRequest,
  UpdateFleetRequest,
  AddVehicleRequest,
  UpdateVehicleRequest,
  InviteRiderRequest 
} from '@/models/fleet.model';
import { api } from './api';

export function generateFleetCode(companyName: string): string {
  const words = companyName.split(' ');
  const initials = words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `FLEET-${initials}-${sequence.toString().padStart(3, '0')}`;
}

export const fleetService = {
  async getFleet(): Promise<FleetManager> {
    return api.get('/v1/fleet');
  },

  async updateFleet(data: UpdateFleetRequest): Promise<FleetManager> {
    return api.patch('/v1/fleet', data);
  },

  async getDashboard(): Promise<FleetDashboard> {
    return api.get('/v1/fleet/dashboard');
  },

  async getEarnings(period: 'today' | 'week' | 'month' = 'week'): Promise<FleetEarnings> {
    return api.get(`/v1/fleet/earnings?period=${period}`);
  },

  async getVehicles(): Promise<FleetVehicle[]> {
    return api.get('/v1/fleet/vehicles');
  },

  async getVehicle(id: string): Promise<FleetVehicle> {
    return api.get(`/v1/fleet/vehicles/${id}`);
  },

  async addVehicle(data: AddVehicleRequest): Promise<FleetVehicle> {
    return api.post('/v1/fleet/vehicles', data);
  },

  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<FleetVehicle> {
    return api.patch(`/v1/fleet/vehicles/${id}`, data);
  },

  async assignRiderToVehicle(vehicleId: string, riderId: string): Promise<void> {
    return api.post(`/v1/fleet/vehicles/${vehicleId}/assign`, { riderId });
  },

  async getRiders(): Promise<FleetRider[]> {
    return api.get('/v1/fleet/riders');
  },

  async getRider(id: string): Promise<FleetRider> {
    return api.get(`/v1/fleet/riders/${id}`);
  },

  async inviteRider(data: InviteRiderRequest): Promise<FleetRider> {
    return api.post('/v1/fleet/riders/invite', data);
  },

  async updateRiderStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    return api.patch(`/v1/fleet/riders/${id}/status`, { status });
  },
};

export function useFleetQuery() {
  return useQuery({
    queryKey: ['fleet'],
    queryFn: () => fleetService.getFleet(),
  });
}

export function useFleetDashboardQuery() {
  return useQuery({
    queryKey: ['fleet', 'dashboard'],
    queryFn: () => fleetService.getDashboard(),
  });
}

export function useFleetEarningsQuery(period: 'today' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: ['fleet', 'earnings', period],
    queryFn: () => fleetService.getEarnings(period),
  });
}

export function useFleetVehiclesQuery() {
  return useQuery({
    queryKey: ['fleet', 'vehicles'],
    queryFn: () => fleetService.getVehicles(),
  });
}

export function useFleetVehicleQuery(id: string) {
  return useQuery({
    queryKey: ['fleet', 'vehicles', id],
    queryFn: () => fleetService.getVehicle(id),
    enabled: !!id,
  });
}

export function useFleetRidersQuery() {
  return useQuery({
    queryKey: ['fleet', 'riders'],
    queryFn: () => fleetService.getRiders(),
  });
}

export function useFleetRiderQuery(id: string) {
  return useQuery({
    queryKey: ['fleet', 'riders', id],
    queryFn: () => fleetService.getRider(id),
    enabled: !!id,
  });
}

export function useUpdateFleetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFleetRequest) => fleetService.updateFleet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
    },
  });
}

export function useAddVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddVehicleRequest) => fleetService.addVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles'] });
    },
  });
}

export function useUpdateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleRequest }) =>
      fleetService.updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles', variables.id] });
    },
  });
}

export function useAssignRiderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, riderId }: { vehicleId: string; riderId: string }) =>
      fleetService.assignRiderToVehicle(vehicleId, riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet', 'riders'] });
    },
  });
}

export function useInviteRiderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteRiderRequest) => fleetService.inviteRider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'riders'] });
    },
  });
}

export function useUpdateRiderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) =>
      fleetService.updateRiderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'riders'] });
    },
  });
}
