import { api } from "./api";

export interface RiderDeliveryZoneAddress {
  address_line: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
}

export interface RiderDeliveryZone {
  id: string;
  name: string;
  business_number: string;
  type: string;
  status: string;
  logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  address: RiderDeliveryZoneAddress | null;
  delivery_enabled: boolean;
  max_delivery_radius_km: number;
  radius_is_default: boolean;
  base_delivery_fee_minor: number | null;
  min_order_minor: number | null;
}

export async function fetchRiderDeliveryZones(): Promise<RiderDeliveryZone[]> {
  const response = await api.get<{ data: RiderDeliveryZone[] }>(
    "/riders/delivery-zones",
  );
  return response.data ?? [];
}
