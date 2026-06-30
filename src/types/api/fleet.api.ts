// ─── Fleet Rider ───

export interface FleetRiderUser {
  id: string;
  full_name: string;
  phone?: string;
}

export interface FleetRider {
  id: string;
  rider_number: string;
  status: string;
  is_online: boolean;
  is_fleet_managed: boolean;
  is_active: boolean;
  phone: string;
  license_number: string;
  kyc_status: string;
  user: FleetRiderUser | null;
  inserted_at: string;
}

// ─── Fleet Vehicle ───

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

// ─── Responses ───

export interface FleetRidersResponse {
  data: FleetRider[];
}

export interface FleetVehiclesResponse {
  data: FleetVehicle[];
}

export interface JoinRequest {
  id: string;
  user_id: string;
  rider_number: string;
  status: string;
  inserted_at: string;
}

export interface FleetInvitation {
  id: string;
  business_id: string;
  status: string;
  inserted_at: string;
}

// ─── Fleet Dashboard ───

export interface FleetDashboard {
  total_riders: number;
  active_riders: number;
  online_riders: number;
  offline_riders: number;
  total_vehicles: number;
  today_deliveries: number;
  today_earnings_minor: number;
  pending_join_requests: number;
}

export interface FleetDashboardResponse {
  data: FleetDashboard;
}
