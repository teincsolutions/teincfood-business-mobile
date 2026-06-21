/**
 * Kiosk Hooks
 * TanStack Query hooks for kiosk-mode order handling
 * Replaces setInterval polling with automatic query refetching
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KioskOrder } from '@/types/kiosk.model';
import * as kioskService from '@/services/kiosk.service';
import { useBusinessStore } from '@/stores/business.store';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const KIOSK_KEYS = {
  all: ['kiosk'] as const,
  orders: (businessId?: string) => [...KIOSK_KEYS.all, 'orders', businessId] as const,
  riders: (businessId?: string) => [...KIOSK_KEYS.all, 'riders', businessId] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useKioskOrdersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: KIOSK_KEYS.orders(businessId),
    queryFn: () => kioskService.fetchKioskOrders(businessId),
    enabled,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 3000,
  });
}

export function useAvailableRidersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: KIOSK_KEYS.riders(businessId),
    queryFn: () => kioskService.fetchAvailableRiders(businessId),
    enabled,
    staleTime: 10000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

export function useAcceptKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => kioskService.acceptKioskOrder(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders(businessId) });

      const previous = queryClient.getQueryData<any>(KIOSK_KEYS.orders(businessId));

      if (previous) {
        const order = previous.pendingOrders.find((o: any) => o.id === orderId);
        if (order) {
          queryClient.setQueryData<any>(KIOSK_KEYS.orders(businessId), {
            pendingOrders: previous.pendingOrders.filter((o: any) => o.id !== orderId),
            preparingOrders: [
              ...previous.preparingOrders,
              { ...order, status: 'preparing' as const, startedAt: new Date().toISOString() },
            ],
            readyOrders: previous.readyOrders,
          });
        }
      }

      return { previous };
    },

    onError: (_err, _orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KIOSK_KEYS.orders(businessId), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
  });
}

export function useRejectKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => kioskService.rejectKioskOrder(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders(businessId) });

      const previous = queryClient.getQueryData<any>(KIOSK_KEYS.orders(businessId));

      if (previous) {
        queryClient.setQueryData<any>(KIOSK_KEYS.orders(businessId), {
          ...previous,
          pendingOrders: previous.pendingOrders.filter((o: any) => o.id !== orderId),
        });
      }

      return { previous };
    },

    onError: (_err, _orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KIOSK_KEYS.orders(businessId), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
  });
}

export function useMarkKioskOrderReadyMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => kioskService.markKioskOrderReady(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders(businessId) });

      const previous = queryClient.getQueryData<any>(KIOSK_KEYS.orders(businessId));

      if (previous) {
        const order = previous.preparingOrders.find((o: any) => o.id === orderId);
        if (order) {
          queryClient.setQueryData<any>(KIOSK_KEYS.orders(businessId), {
            pendingOrders: previous.pendingOrders,
            preparingOrders: previous.preparingOrders.filter((o: any) => o.id !== orderId),
            readyOrders: [
              ...previous.readyOrders,
              { ...order, status: 'ready' as const },
            ],
          });
        }
      }

      return { previous };
    },

    onError: (_err, _orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KIOSK_KEYS.orders(businessId), context.previous);
      }
    },

    onSettled: () => {
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

    onMutate: async ({ orderId }) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders(businessId) });

      const previous = queryClient.getQueryData<any>(KIOSK_KEYS.orders(businessId));

      if (previous) {
        queryClient.setQueryData<any>(KIOSK_KEYS.orders(businessId), {
          ...previous,
          readyOrders: previous.readyOrders.filter((o: any) => o.id !== orderId),
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KIOSK_KEYS.orders(businessId), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
    },
  });
}

// Export query keys for external use
export { KIOSK_KEYS as kioskKeys };
