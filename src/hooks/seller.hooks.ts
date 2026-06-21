/**
 * Seller Hooks
 * TanStack Query hooks for seller order management
 * Handles order fetching, status updates, and order actions
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SellerOrder } from '@/models/seller.model';
import * as sellerService from '@/services/seller.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const SELLER_KEYS = {
  all: ['seller'] as const,
  orders: () => [...SELLER_KEYS.all, 'orders'] as const,
  order: (id: string) => [...SELLER_KEYS.all, 'order', id] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetches all seller orders with automatic refetching.
 */
export function useSellerOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: SELLER_KEYS.orders(),
    queryFn: () => sellerService.fetchSellerOrders(),
    enabled,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

/**
 * Fetches a single seller order by ID
 */
export function useSellerOrderQuery(orderId: string, enabled = true) {
  return useQuery({
    queryKey: SELLER_KEYS.order(orderId),
    queryFn: () => sellerService.fetchSellerOrder(orderId),
    enabled: enabled && Boolean(orderId),
    staleTime: 5000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/**
 * Update order status - generic mutation for any status change
 */
export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      sellerService.updateOrderStatus(orderId, status),

    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });

      const previous = queryClient.getQueryData<any>(
        SELLER_KEYS.order(orderId)
      );

      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status },
        });
      }

      return { previous };
    },

    onError: (_err, { orderId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
    },

    onSettled: (_data, _error, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.order(orderId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.orders() });
    },
  });
}

/**
 * Start preparing an order (pending -> preparing)
 */
export function useStartPreparingOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.startPreparingOrder(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });

      const previous = queryClient.getQueryData<any>(
        SELLER_KEYS.order(orderId)
      );

      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'preparing' },
        });
      }

      return { previous };
    },

    onError: (_err, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
    },

    onSettled: (_data, _error, orderId) => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.order(orderId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.orders() });
    },
  });
}

/**
 * Mark an order as ready (preparing -> ready)
 */
export function useMarkOrderReadyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.markOrderReady(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });

      const previous = queryClient.getQueryData<any>(
        SELLER_KEYS.order(orderId)
      );

      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'ready' },
        });
      }

      return { previous };
    },

    onError: (_err, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
    },

    onSettled: (_data, _error, orderId) => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.order(orderId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.orders() });
    },
  });
}

/**
 * Mark an order as delivered (ready -> delivered)
 */
export function useMarkOrderDeliveredMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.markOrderDelivered(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });

      const previous = queryClient.getQueryData<any>(
        SELLER_KEYS.order(orderId)
      );

      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'delivered' },
        });
      }

      return { previous };
    },

    onError: (_err, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
    },

    onSettled: (_data, _error, orderId) => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.order(orderId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.orders() });
    },
  });
}

/**
 * Accept a pending order
 */
export function useAcceptOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.acceptOrder(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });

      const previous = queryClient.getQueryData<any>(
        SELLER_KEYS.order(orderId)
      );

      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'preparing' },
        });
      }

      return { previous };
    },

    onError: (_err, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
    },

    onSettled: (_data, _error, orderId) => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.order(orderId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.orders() });
    },
  });
}

/**
 * Reject an order
 */
export function useRejectOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.rejectOrder(orderId),

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.orders() });

      const previous = queryClient.getQueryData<{ orders: SellerOrder[] }>(
        SELLER_KEYS.orders()
      );

      if (previous) {
        queryClient.setQueryData<{ orders: SellerOrder[] }>(SELLER_KEYS.orders(), {
          orders: previous.orders.filter((o) => o.id !== orderId),
        });
      }

      return { previous };
    },

    onError: (_err, _orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.orders(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.orders() });
    },
  });
}

// Export query keys for external use
export { SELLER_KEYS as sellerKeys };