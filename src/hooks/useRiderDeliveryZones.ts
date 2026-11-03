import { useQuery } from "@tanstack/react-query";
import {
  fetchRiderDeliveryZones,
  type RiderDeliveryZone,
} from "@/services/rider-zones.service";

export const riderDeliveryZonesQueryKey = [
  "rider",
  "delivery-zones",
] as const;

export function useRiderDeliveryZonesQuery() {
  return useQuery<RiderDeliveryZone[]>({
    queryKey: riderDeliveryZonesQueryKey,
    queryFn: fetchRiderDeliveryZones,
    staleTime: 5 * 60 * 1000,
  });
}
