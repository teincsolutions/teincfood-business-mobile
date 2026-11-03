import type { RiderDeliveryZone } from "@/services/rider-zones.service";

export interface RiderZoneCoordinate {
  latitude: number;
  longitude: number;
}

export function getRiderZoneCoordinate(
  zone: RiderDeliveryZone,
): RiderZoneCoordinate | null {
  const latitude = zone.latitude ?? zone.address?.latitude ?? null;
  const longitude = zone.longitude ?? zone.address?.longitude ?? null;
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

export function formatRiderZoneAddress(zone: RiderDeliveryZone) {
  if (!zone.address) return "Address not set";
  return [zone.address.address_line, zone.address.city]
    .filter(Boolean)
    .join(", ");
}
