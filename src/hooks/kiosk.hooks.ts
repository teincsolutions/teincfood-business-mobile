/**
 * Kiosk Hooks
 * TanStack Query hooks for kiosk-mode order handling
 * Replaces setInterval polling with automatic query refetching
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { KioskOrder } from '@/services/mock-data.service';
import type {
  KioskOrdersResponse,
  KioskOrderActionResponse,
  AvailableRider,
} from '@/services/kiosk.service';
import * as kioskService from '@/services/kiosk.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const KIOSK_KEYS = {
  all: ['kiosk'] as const,
  orders: () => [...KIOSK_KEYS.all, 'orders'] as const,
  riders: () => [...KIOSK_KEYS.all, 'riders'] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetches kiosk orders (pending + preparing + ready) with automatic refetching.
 */
export function useKioskOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: KIOSK_KEYS.orders(),
    queryFn: () => kioskService.fetchKioskOrders(),
    enabled,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 3000,
  });
}

/**
 * Fetches available riders sorted by distance
 */
export function useAvailableRidersQuery(enabled = true) {
  return useQuery({
    queryKey: KIOSK_KEYS.riders(),
    queryFn: () => kioskService.fetchAvailableRiders(),
    enabled,
    staleTime: 10000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/**
 * Accept a pending order — moves it to preparing
 */
export function useAcceptKioskOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => kioskService.acceptKioskOrder(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders() });

      const previous = queryClient.getQueryData<KioskOrdersResponse>(
        KIOSK_KEYS.orders()
      );

      if (previous) {
        const order = previous.pendingOrders.find((o) => o.id === orderId);
        if (order) {
          queryClient.setQueryData<KioskOrdersResponse>(KIOSK_KEYS.orders(), {
            pendingOrders: previous.pendingOrders.filter((o) => o.id !== orderId),
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
        queryClient.setQueryData(KIOSK_KEYS.orders(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders() });
    },
  });
}

/**
 * Reject a pending order — removes it from the queue
 */
export function useRejectKioskOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => kioskService.rejectKioskOrder(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders() });

      const previous = queryClient.getQueryData<KioskOrdersResponse>(
        KIOSK_KEYS.orders()
      );

      if (previous) {
        queryClient.setQueryData<KioskOrdersResponse>(KIOSK_KEYS.orders(), {
          ...previous,
          pendingOrders: previous.pendingOrders.filter((o) => o.id !== orderId),
        });
      }

      return { previous };
    },

    onError: (_err, _orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KIOSK_KEYS.orders(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders() });
    },
  });
}

/**
 * Mark a preparing order as ready — moves it to ready queue
 */
export function useMarkKioskOrderReadyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => kioskService.markKioskOrderReady(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders() });

      const previous = queryClient.getQueryData<KioskOrdersResponse>(
        KIOSK_KEYS.orders()
      );

      if (previous) {
        const order = previous.preparingOrders.find((o) => o.id === orderId);
        if (order) {
          queryClient.setQueryData<KioskOrdersResponse>(KIOSK_KEYS.orders(), {
            pendingOrders: previous.pendingOrders,
            preparingOrders: previous.preparingOrders.filter((o) => o.id !== orderId),
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
        queryClient.setQueryData(KIOSK_KEYS.orders(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders() });
    },
  });
}

/**
 * Assign a rider to a ready order — removes it from kiosk queue
 */
export function useAssignRiderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      kioskService.assignKioskOrderToRider(orderId, riderId),

    onMutate: async ({ orderId }) => {
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders() });

      const previous = queryClient.getQueryData<KioskOrdersResponse>(
        KIOSK_KEYS.orders()
      );

      if (previous) {
        queryClient.setQueryData<KioskOrdersResponse>(KIOSK_KEYS.orders(), {
          ...previous,
          readyOrders: previous.readyOrders.filter((o) => o.id !== orderId),
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KIOSK_KEYS.orders(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders() });
    },
  });
}

// Export query keys for external use
export { KIOSK_KEYS as kioskKeys };