import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as kioskService from '@/services/kiosk.service';
import { useBusinessStore } from '@/stores/business.store';

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

export function useAcceptKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => kioskService.acceptKioskOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
  });
}

export function useRejectKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => kioskService.rejectKioskOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
  });
}

export function useStartPreparingKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => kioskService.startPreparingKioskOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
  });
}

export function useMarkKioskOrderReadyMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => kioskService.markKioskOrderReady(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
  });
}

export function useAssignRiderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      kioskService.assignKioskOrderToRider(orderId, riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
    onError: (error) => {
      console.debug('Assign rider mutation failed:', error);
    },
  });
}

export { KIOSK_KEYS as kioskKeys };
