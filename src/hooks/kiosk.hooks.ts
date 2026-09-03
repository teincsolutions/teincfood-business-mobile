import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as kioskService from "@/services/kiosk.service";
import { useBusinessStore } from "@/stores/business.store";
import { SELLER_KEYS } from "@teincfood/core";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@/utils/error";

export const KIOSK_KEYS = {
  all: ["kiosk"] as const,
  orders: (businessId?: string) => [...KIOSK_KEYS.all, "orders", businessId] as const,
  riders: (businessId?: string) => [...KIOSK_KEYS.all, "riders", businessId] as const,
};

function useBusinessId() { return useBusinessStore((s) => s.activeBusiness?.id); }

export function useKioskOrdersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({ queryKey: KIOSK_KEYS.orders(businessId), queryFn: () => kioskService.fetchKioskOrders(businessId), enabled, staleTime: 30 * 1000 });
}
export function useAvailableRidersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: KIOSK_KEYS.riders(businessId),
    queryFn: () => kioskService.fetchAvailableRiders(businessId),
    enabled,
    staleTime: 0,
    select: (res) => (res?.data ?? []).map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r as { user?: { full_name?: string }; rider_number?: string }).user?.full_name || (r as { rider_number?: string }).rider_number || "Rider", phone: (r as { phone?: string | null }).phone || null, vehicle_type: (r as { vehicle?: { type?: string } }).vehicle?.type || null, rating: null, distance: null })),
  });
}

export { useAcceptOrderMutation as useAcceptKioskOrderMutation, useRejectOrderMutation as useRejectKioskOrderMutation, useStartPreparingOrderMutation as useStartPreparingKioskOrderMutation, useMarkOrderReadyMutation as useMarkKioskOrderReadyMutation, useAssignRiderMutation } from "@teincfood/core";

export { KIOSK_KEYS as kioskKeys };
