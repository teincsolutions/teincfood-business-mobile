import { useQuery, type QueryClient } from "@tanstack/react-query";
import { RIDER_KEYS } from "@teincfood/core";
import {
  fetchRiderDeliveryZones,
  type RiderDeliveryZone,
} from "@/services/rider-zones.service";

/**
 * Shared cache key for rider delivery coverage.
 *
 * Uses the core rider key space so a broad `["rider"]` invalidation (realtime
 * delivery events, profile changes) also refreshes the coverage map.
 */
export const riderDeliveryZonesQueryKey = RIDER_KEYS.deliveryZones();

export function invalidateRiderDeliveryZones(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: riderDeliveryZonesQueryKey,
  });
}

export function useRiderDeliveryZonesQuery() {
  return useQuery<RiderDeliveryZone[]>({
    queryKey: riderDeliveryZonesQueryKey,
    queryFn: fetchRiderDeliveryZones,
    // Coverage changes only when the rider joins/leaves a business or a
    // business updates its delivery radius. Keep the persisted copy warm so
    // opening Home/Settings renders the map immediately instead of reloading.
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: "offlineFirst",
  });
}
