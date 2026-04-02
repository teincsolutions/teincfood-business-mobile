export type VehicleType = 'motorcycle' | 'car' | 'bicycle' | 'van' | 'truck';

export type FleetStatus = 'active' | 'suspended' | 'pending_verification';

export type RiderFleetStatus = 'active' | 'inactive' | 'on_leave' | 'suspended';

export interface FleetManager {
  id: string;
  code: string;                  // "FLEET-SD-001"
  userId: string;                // Links to User.id
  companyName: string;           // "Speedy Deliveries Ltd"
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  licenseNumber?: string;
  logoUrl?: string;
  description?: string;
  totalVehicles: number;
  activeRiders: number;
  status: FleetStatus;
  commissionRate: number;        // Percentage (e.g., 15 = 15%)
  createdAt: string;
  updatedAt: string;
}

export interface FleetVehicle {
  id: string;
  fleetId: string;
  vehicleType: VehicleType;
  plateNumber: string;
  model?: string;
  brand?: string;
  color?: string;
  year?: number;
  isActive: boolean;
  assignedRiderId?: string;
  assignedRiderName?: string;
  insuranceExpiryDate?: string;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FleetRider {
  id: string;
  fleetId: string;
  riderId: string;               // Links to User.id
  riderName: string;
  riderEmail: string;
  riderPhone: string;
  riderAvatarUrl?: string;
  vehicleId?: string;
  vehiclePlateNumber?: string;
  vehicleType?: VehicleType;
  status: RiderFleetStatus;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
  joinedAt: string;
  lastActiveAt?: string;
}

export interface FleetEarnings {
  fleetId: string;
  period: 'today' | 'week' | 'month' | 'custom';
  startDate: string;
  endDate: string;
  totalEarnings: number;
  totalDeliveries: number;
  fleetCommission: number;
  riderPayouts: number;
  averagePerDelivery: number;
  topRiders: {
    riderId: string;
    riderName: string;
    deliveries: number;
    earnings: number;
  }[];
}

export interface CreateFleetRequest {
  companyName: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  password: string;
  licenseNumber?: string;
  description?: string;
}

export interface UpdateFleetRequest {
  companyName?: string;
  contactPersonName?: string;
  contactEmail?: string;
  contactPhone?: string;
  licenseNumber?: string;
  logoUrl?: string;
  description?: string;
  commissionRate?: number;
}

export interface AddVehicleRequest {
  vehicleType: VehicleType;
  plateNumber: string;
  model?: string;
  brand?: string;
  color?: string;
  year?: number;
  insuranceExpiryDate?: string;
}

export interface UpdateVehicleRequest {
  vehicleType?: VehicleType;
  plateNumber?: string;
  model?: string;
  brand?: string;
  color?: string;
  year?: number;
  isActive?: boolean;
  insuranceExpiryDate?: string;
  lastMaintenanceDate?: string;
}

export interface InviteRiderRequest {
  email: string;
  phone: string;
  fullName: string;
  vehicleId?: string;
}

export interface FleetDashboard {
  fleetId: string;
  companyName: string;
  code: string;
  totalRiders: number;
  onlineRiders: number;
  offlineRiders: number;
  totalVehicles: number;
  assignedVehicles: number;
  availableVehicles: number;
  todayDeliveries: number;
  todayEarnings: number;
  weekDeliveries: number;
  weekEarnings: number;
  monthDeliveries: number;
  monthEarnings: number;
  activeDeliveries: number;
}