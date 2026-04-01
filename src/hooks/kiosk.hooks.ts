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
} from '@/services/kiosk.service';
import * as kioskService from '@/services/kiosk.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const KIOSK_KEYS = {
  all: ['kiosk'] as const,
  orders: () => [...KIOSK_KEYS.all, 'orders'] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetches kiosk orders (pending + active) with automatic refetching.
 * 
 * - refetchInterval: polls every 5s (same as old setInterval)
 * - refetchOnWindowFocus: refreshes when app comes to foreground
 * - staleTime: 3s — marks data stale quickly for near-realtime feel
 */
export function useKioskOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: KIOSK_KEYS.orders(),
    queryFn: () => kioskService.fetchKioskOrders(),
    enabled,
    refetchInterval: 5000, // replaces old setInterval
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 3000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/**
 * Accept a pending order — moves it to active (preparing)
 * Uses optimistic update for instant UI feedback
 */
export function useAcceptKioskOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => kioskService.acceptKioskOrder(orderId),

    onMutate: async (orderId) => {
      // Cancel in-flight queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: KIOSK_KEYS.orders() });

      // Snapshot previous state
      const previous = queryClient.getQueryData<KioskOrdersResponse>(
        KIOSK_KEYS.orders()
      );

      // Optimistically move order from pending to active
      if (previous) {
        const order = previous.pendingOrders.find((o) => o.id === orderId);
        if (order) {
          queryClient.setQueryData<KioskOrdersResponse>(KIOSK_KEYS.orders(), {
            pendingOrders: previous.pendingOrders.filter((o) => o.id !== orderId),
            activeOrders: [
              ...previous.activeOrders,
              { ...order, status: 'preparing', startedAt: new Date().toISOString() },
            ],
          });
        }
      }

      return { previous };
    },

    onError: (_err, _orderId, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(KIOSK_KEYS.orders(), context.previous);
      }
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders() });
    },
  });
}

/**
 * Reject a pending order — removes it from the queue
 * Uses optimistic update for instant UI feedback
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
 * Mark an active order as ready — removes it from active queue
 * Uses optimistic update for instant UI feedback
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
        queryClient.setQueryData<KioskOrdersResponse>(KIOSK_KEYS.orders(), {
          ...previous,
          activeOrders: previous.activeOrders.filter((o) => o.id !== orderId),
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

// Export query keys for external use
export { KIOSK_KEYS as kioskKeys };