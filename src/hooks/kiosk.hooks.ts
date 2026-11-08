/**
 * Kiosk hooks — now thin shim over @teincfood/core (SQLite-first).
 * Keeps host-specific riders query; order queries/mutations are single source in core.
 */
export {
  KIOSK_KEYS,
  useKioskOrdersQuery,
  useAcceptKioskOrderMutation,
  useRejectKioskOrderMutation,
  useStartPreparingKioskOrderMutation,
  useMarkKioskOrderReadyMutation,
  useAssignRiderMutation,
} from "@teincfood/core";
export { KIOSK_KEYS as kioskKeys } from "@teincfood/core";

import { useQuery } from "@tanstack/react-query";
import * as kioskService from "@/services/kiosk.service";
import { useBusinessStore } from "@/stores/business.store";
import { KIOSK_KEYS as Keys } from "@teincfood/core";

/**
 * Returns the backend response as-is: `{ data: DeliveryRider[] }`.
 * Consumers must read `.data` — do not remap/unwrap here.
 */
export function useAvailableRidersQuery(enabled = true) {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  return useQuery({
    queryKey: Keys.riders(businessId),
    queryFn: () => kioskService.fetchAvailableRiders(businessId),
    enabled,
    staleTime: 0,
  });
}
