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
  rider_id: string | null;
  plate_number: string;
  type: string;
  ownership: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
  rider_number?: string;
  rider_name?: string;
  inserted_at: string;
}

export interface FleetRider {
  id: string;
  rider_number: string;
  status: string;
  is_online: boolean;
  is_active: boolean;
  phone: string;
  license_number: string;
  kyc_status: string;
  user: { id: string; full_name: string; phone?: string } | null;
  inserted_at: string;
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
  currency: string;
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