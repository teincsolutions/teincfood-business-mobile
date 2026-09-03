import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as kioskService from '@/services/kiosk.service';
import { orderRepository } from '@/repositories/order.repository';
import { useBusinessStore } from '@/stores/business.store';
import { SELLER_KEYS } from '@/hooks/seller.hooks';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

export const KIOSK_KEYS = {
  all: ['kiosk'] as const,
  orders: (businessId?: string) => [...KIOSK_KEYS.all, 'orders', businessId] as const,
  riders: (businessId?: string) => [...KIOSK_KEYS.all, 'riders', businessId] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

export function useKioskOrdersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: KIOSK_KEYS.orders(businessId),
    queryFn: () => kioskService.fetchKioskOrders(businessId),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useAvailableRidersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: KIOSK_KEYS.riders(businessId),
    queryFn: () => kioskService.fetchAvailableRiders(businessId),
    enabled,
    staleTime: 0,
    select: (response) =>
      (response?.data ?? []).map((rider: Record<string, any>) => ({
        id: rider.id,
        name: rider.user?.full_name || rider.rider_number || 'Rider',
        phone: rider.phone || null,
        vehicle_type: rider.vehicle?.type || null,
        rating: null,
        distance: null,
      })),
  });
}

// Offline-first transitions — delegate to core's device-owned outbox so they queue
// when offline and patch the snapshot (visible in InProgress/Today immediately).
export {
  useAcceptOrderMutation as useAcceptKioskOrderMutation,
  useRejectOrderMutation as useRejectKioskOrderMutation,
  useStartPreparingOrderMutation as useStartPreparingKioskOrderMutation,
  useMarkOrderReadyMutation as useMarkKioskOrderReadyMutation,
} from "@teincfood/core";

export function useAssignRiderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      if (!businessId) throw new Error('No active business');
      return orderRepository.assignRider({ orderId, riderId, businessId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      toast.success('Rider assigned successfully');
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export { KIOSK_KEYS as kioskKeys };
