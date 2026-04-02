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

const SIMULATED_DELAY = 800;

// Mock fleet data
const MOCK_FLEET: FleetManager = {
  id: 'fleet-1',
  code: 'FLEET-SD-001',
  userId: 'user-fleet-1',
  companyName: 'Speedy Deliveries Ltd',
  contactPersonName: 'Kwame Asante',
  contactEmail: 'kwame@speedydeliveries.com',
  contactPhone: '+233 20 987 6543',
  licenseNumber: 'LIC-2025-001',
  description: 'Fast and reliable delivery services across Accra',
  totalVehicles: 5,
  activeRiders: 3,
  status: 'active',
  commissionRate: 15,
  createdAt: '2025-06-01T10:00:00Z',
  updatedAt: '2026-03-15T14:30:00Z',
};

const MOCK_VEHICLES: FleetVehicle[] = [
  {
    id: 'vehicle-1',
    fleetId: 'fleet-1',
    vehicleType: 'motorcycle',
    plateNumber: 'GR-1234-20',
    model: 'Honda CB125F',
    brand: 'Honda',
    color: 'Red',
    year: 2023,
    isActive: true,
    assignedRiderId: 'rider-fleet-1',
    assignedRiderName: 'John Mensah',
    insuranceExpiryDate: '2026-12-31',
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'vehicle-2',
    fleetId: 'fleet-1',
    vehicleType: 'motorcycle',
    plateNumber: 'GR-5678-21',
    model: 'Yamaha YBR125',
    brand: 'Yamaha',
    color: 'Blue',
    year: 2024,
    isActive: true,
    assignedRiderId: 'rider-fleet-2',
    assignedRiderName: 'Sarah Owusu',
    insuranceExpiryDate: '2026-06-30',
    createdAt: '2025-07-15T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'vehicle-3',
    fleetId: 'fleet-1',
    vehicleType: 'bicycle',
    plateNumber: '',
    model: 'Giant Escape 3',
    brand: 'Giant',
    color: 'Black',
    year: 2025,
    isActive: true,
    insuranceExpiryDate: undefined,
    createdAt: '2025-08-01T10:00:00Z',
    updatedAt: '2025-08-01T10:00:00Z',
  },
  {
    id: 'vehicle-4',
    fleetId: 'fleet-1',
    vehicleType: 'motorcycle',
    plateNumber: 'GR-9012-22',
    model: 'Bajaj CT100',
    brand: 'Bajaj',
    color: 'Green',
    year: 2022,
    isActive: false,
    insuranceExpiryDate: '2025-12-31',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
  },
];

const MOCK_RIDERS: FleetRider[] = [
  {
    id: 'fleet-rider-1',
    fleetId: 'fleet-1',
    riderId: 'rider-fleet-1',
    riderName: 'John Mensah',
    riderEmail: 'john@fleet.com',
    riderPhone: '+233 20 111 2222',
    riderAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    vehicleId: 'vehicle-1',
    vehiclePlateNumber: 'GR-1234-20',
    vehicleType: 'motorcycle',
    status: 'active',
    totalDeliveries: 245,
    totalEarnings: 3675.00,
    rating: 4.8,
    joinedAt: '2025-06-15T10:00:00Z',
    lastActiveAt: '2026-04-02T14:30:00Z',
  },
  {
    id: 'fleet-rider-2',
    fleetId: 'fleet-1',
    riderId: 'rider-fleet-2',
    riderName: 'Sarah Owusu',
    riderEmail: 'sarah@fleet.com',
    riderPhone: '+233 20 333 4444',
    riderAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    vehicleId: 'vehicle-2',
    vehiclePlateNumber: 'GR-5678-21',
    vehicleType: 'motorcycle',
    status: 'active',
    totalDeliveries: 189,
    totalEarnings: 2835.00,
    rating: 4.6,
    joinedAt: '2025-08-01T10:00:00Z',
    lastActiveAt: '2026-04-02T13:15:00Z',
  },
  {
    id: 'fleet-rider-3',
    fleetId: 'fleet-1',
    riderId: 'rider-fleet-3',
    riderName: 'Kofi Adom',
    riderEmail: 'kofi@fleet.com',
    riderPhone: '+233 20 555 6666',
    status: 'inactive',
    totalDeliveries: 56,
    totalEarnings: 840.00,
    rating: 4.2,
    joinedAt: '2025-10-01T10:00:00Z',
    lastActiveAt: '2026-02-15T10:00:00Z',
  },
];

const MOCK_DASHBOARD: FleetDashboard = {
  fleetId: 'fleet-1',
  companyName: 'Speedy Deliveries Ltd',
  code: 'FLEET-SD-001',
  totalRiders: 3,
  onlineRiders: 2,
  offlineRiders: 1,
  totalVehicles: 4,
  assignedVehicles: 2,
  availableVehicles: 1,
  todayDeliveries: 18,
  todayEarnings: 270.00,
  weekDeliveries: 124,
  weekEarnings: 1860.00,
  monthDeliveries: 456,
  monthEarnings: 6840.00,
  activeDeliveries: 3,
};

const MOCK_EARNINGS: FleetEarnings = {
  fleetId: 'fleet-1',
  period: 'week',
  startDate: '2026-03-27',
  endDate: '2026-04-02',
  totalEarnings: 1860.00,
  totalDeliveries: 124,
  fleetCommission: 279.00,
  riderPayouts: 1581.00,
  averagePerDelivery: 15.00,
  topRiders: [
    { riderId: 'rider-fleet-1', riderName: 'John Mensah', deliveries: 68, earnings: 1020.00 },
    { riderId: 'rider-fleet-2', riderName: 'Sarah Owusu', deliveries: 56, earnings: 840.00 },
  ],
};

// Generate fleet code
export function generateFleetCode(companyName: string): string {
  const words = companyName.split(' ');
  const initials = words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `FLEET-${initials}-${sequence.toString().padStart(3, '0')}`;
}

export const fleetService = {
  // Get fleet profile
  async getFleet(): Promise<FleetManager> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_FLEET);
      }, SIMULATED_DELAY);
    });
  },

  // Update fleet profile
  async updateFleet(data: UpdateFleetRequest): Promise<FleetManager> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...MOCK_FLEET,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }, SIMULATED_DELAY);
    });
  },

  // Get fleet dashboard
  async getDashboard(): Promise<FleetDashboard> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_DASHBOARD);
      }, SIMULATED_DELAY);
    });
  },

  // Get fleet earnings
  async getEarnings(period: 'today' | 'week' | 'month' = 'week'): Promise<FleetEarnings> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...MOCK_EARNINGS,
          period,
        });
      }, SIMULATED_DELAY);
    });
  },

  // Get all vehicles
  async getVehicles(): Promise<FleetVehicle[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_VEHICLES);
      }, SIMULATED_DELAY);
    });
  },

  // Get vehicle by ID
  async getVehicle(id: string): Promise<FleetVehicle> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const vehicle = MOCK_VEHICLES.find(v => v.id === id);
        if (vehicle) {
          resolve(vehicle);
        } else {
          reject({ status: 404, message: 'Vehicle not found' });
        }
      }, SIMULATED_DELAY);
    });
  },

  // Add new vehicle
  async addVehicle(data: AddVehicleRequest): Promise<FleetVehicle> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newVehicle: FleetVehicle = {
          id: `vehicle-${Date.now()}`,
          fleetId: 'fleet-1',
          ...data,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(newVehicle);
      }, SIMULATED_DELAY);
    });
  },

  // Update vehicle
  async updateVehicle(id: string, data: UpdateVehicleRequest): Promise<FleetVehicle> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const vehicle = MOCK_VEHICLES.find(v => v.id === id)!;
        resolve({
          ...vehicle,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }, SIMULATED_DELAY);
    });
  },

  // Assign rider to vehicle
  async assignRiderToVehicle(vehicleId: string, riderId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, SIMULATED_DELAY);
    });
  },

  // Get all riders
  async getRiders(): Promise<FleetRider[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_RIDERS);
      }, SIMULATED_DELAY);
    });
  },

  // Get rider by ID
  async getRider(id: string): Promise<FleetRider> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rider = MOCK_RIDERS.find(r => r.id === id);
        if (rider) {
          resolve(rider);
        } else {
          reject({ status: 404, message: 'Rider not found' });
        }
      }, SIMULATED_DELAY);
    });
  },

  // Invite rider
  async inviteRider(data: InviteRiderRequest): Promise<FleetRider> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRider: FleetRider = {
          id: `fleet-rider-${Date.now()}`,
          fleetId: 'fleet-1',
          riderId: `rider-${Date.now()}`,
          riderName: data.fullName,
          riderEmail: data.email,
          riderPhone: data.phone,
          vehicleId: data.vehicleId,
          status: 'active',
          totalDeliveries: 0,
          totalEarnings: 0,
          rating: 0,
          joinedAt: new Date().toISOString(),
        };
        resolve(newRider);
      }, SIMULATED_DELAY);
    });
  },

  // Update rider status
  async updateRiderStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, SIMULATED_DELAY);
    });
  },
};

// React Query hooks
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