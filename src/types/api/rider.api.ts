import type { PaginationMeta, PaginatedResponse } from './pagination';

// ─── Rider Profile ───

export interface RiderProfile {
  id: string;
  rider_number: string;
  user_id: string;
  status: string;
  is_online: boolean;
  is_fleet_managed: boolean;
  is_active: boolean;
  current_lat: number | null;
  current_lng: number | null;
  business_id: string | null;
  phone: string;
  license_number: string;
  kyc_status: string;
  inserted_at: string;
  updated_at: string;
}

export interface RiderProfileResponse {
  data: RiderProfile;
}

// ─── Rider KYC ───

export interface RiderKycResponse {
  data: {
    kyc_status: string;
    documents?: string[];
  };
}

// ─── Rider Delivery ───

export interface RiderDelivery {
  id: string;
  order_id: string;
  order_number: string | null;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  eta_minutes: number;
  inserted_at: string;
  updated_at: string;
}

export type RiderDeliveriesResponse = PaginatedResponse<RiderDelivery>;

// ─── Rider Earnings ───

export interface RiderEarningsResponse {
  data: Record<string, unknown>[];
  pagination: PaginationMeta;
  total_earned_minor: number;
  currency: string;
}

// ─── Rider Vehicle ───

export interface RiderVehicle {
  id: string;
  rider_id: string;
  plate_number: string;
  type: string;
  ownership: string;
  inserted_at: string;
}

export interface RiderVehicleResponse {
  data: RiderVehicle | null;
}

// ─── Available Orders (ready for claim) ───

export interface AvailableOrder {
  order_id: string;
  order_number: string;
  total_minor: number;
  currency: string;
  payment_mode: string;
  business_name: string;
  business_address: string | null;
  business_lat: number | null;
  business_lng: number | null;
  delivery_address: Record<string, unknown> | string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  inserted_at: string;
}

export interface AvailableOrdersResponse {
  data: AvailableOrder[];
}
