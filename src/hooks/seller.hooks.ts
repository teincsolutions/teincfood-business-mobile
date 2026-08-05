import { useMemo } from 'react';
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { SellerOrder as ApiSellerOrder } from '@/types/api/seller.api';
import type { BusinessOrdersParams, BusinessDeliveriesParams } from '@/services/seller.service';
import * as sellerService from '@/services/seller.service';
import { orderRepository } from '@/repositories/order.repository';
import { useBusinessStore } from '@/stores/business.store';
import { usePendingOrders } from './pending-orders.hooks';
import { orderSnapshotsService } from '@/sync/order-snapshots.service';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

export const SELLER_KEYS = {
  all: ['seller'] as const,
  orders: (businessId?: string, filters?: BusinessOrdersParams) =>
    [...SELLER_KEYS.all, 'orders', businessId, filters].filter((x) => x !== undefined) as readonly any[],
  deliveries: (businessId?: string, filters?: BusinessDeliveriesParams) =>
    [...SELLER_KEYS.all, 'deliveries', businessId, filters].filter((x) => x !== undefined) as readonly any[],
  order: (id: string, businessId?: string) => [...SELLER_KEYS.all, 'order', id, businessId] as const,
};

/** Prepend locally queued pending orders, deduped by order_number. */
function mergePendingOrders(
  pending: ApiSellerOrder[],
  serverOrders: ApiSellerOrder[] | undefined,
): ApiSellerOrder[] {
  if (pending.length === 0) return serverOrders ?? [];
  const seen = new Set<string>();
  const merged: ApiSellerOrder[] = [];
  for (const order of pending) {
    seen.add(order.order_number);
    merged.push(order);
  }
  for (const order of serverOrders ?? []) {
    if (!seen.has(order.order_number)) merged.push(order);
  }
  return merged.sort((a, b) => b.inserted_at.localeCompare(a.inserted_at));
}

export function useSellerOrdersQuery(
  enabled = true,
  filters?: { status?: string; q?: string },
) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const pendingOrders = usePendingOrders(activeBusinessId);

  const query = useInfiniteQuery({
    queryKey: SELLER_KEYS.orders(activeBusinessId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: BusinessOrdersParams = { page: pageParam, page_size: 20 };
      if (filters?.status) params.status = filters.status;
      if (filters?.q) params.q = filters.q;
      const result = await sellerService.fetchBusinessOrders(activeBusinessId!, params);
      // Write through to the durable offline read model so the exact list seen
      // online is available offline after a restart.
      if (pageParam === 1 && activeBusinessId && Array.isArray(result?.data)) {
        orderSnapshotsService
          .persistSellerOrders(activeBusinessId, activeBusinessId, result.data)
          .catch(() => {});
      }
      return result;
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination ?? {};
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => data.pages.flatMap((p) => p.data),
    enabled: enabled && Boolean(activeBusinessId),
  });

  const data = useMemo(
    () => mergePendingOrders(pendingOrders, query.data),
    [pendingOrders, query.data],
  );

  return { ...query, data };
}

export function useSellerOrderQuery(orderId: string, enabled = true) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useQuery({
    queryKey: SELLER_KEYS.order(orderId, activeBusinessId),
    queryFn: () => sellerService.fetchSellerOrder(orderId),
    enabled: enabled && Boolean(orderId),
    staleTime: 5000,
  });
}

export function useBusinessDeliveriesQuery(
  enabled = true,
  filters?: { status?: string; search?: string },
) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useInfiniteQuery({
    queryKey: SELLER_KEYS.deliveries(activeBusinessId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: BusinessDeliveriesParams = { page: pageParam, page_size: 20 };
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      return sellerService.fetchBusinessDeliveries(activeBusinessId!, params);
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination ?? {};
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => data.pages.flatMap((p) => p.data),
    enabled: enabled && Boolean(activeBusinessId),
  });
}

function invalidateOrderQueries(queryClient: ReturnType<typeof useQueryClient>, orderId?: string) {
  queryClient.invalidateQueries({ queryKey: SELLER_KEYS.orders() });
  if (orderId) {
    queryClient.invalidateQueries({ queryKey: SELLER_KEYS.order(orderId) });
  }
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, businessId }: { orderId: string; status: string; businessId: string }) => {
      switch (status) {
        case 'preparing':
          return orderRepository.startPreparingOrder({ orderId, businessId });
        case 'ready':
          return orderRepository.markOrderReady({ orderId, businessId });
        case 'accepted':
          return orderRepository.acceptOrder({ orderId, businessId });
        case 'rejected':
          return orderRepository.rejectOrder({ orderId, businessId });
        case 'cancelled':
          return orderRepository.cancelOrder({ orderId, businessId });
        default:
          return sellerService.updateOrderStatus(orderId, status);
      }
    },

    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });
      const previous = queryClient.getQueryData<any>(SELLER_KEYS.order(orderId));
      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status },
        });
      }
      return { previous };
    },

    onError: (error, { orderId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      toast.error(extractApiErrorMessage(error));
    },

    onSettled: (_data, _error, { orderId }) => {
      invalidateOrderQueries(queryClient, orderId);
    },
  });
}

export function useStartPreparingOrderMutation() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => {
      if (!activeBusinessId) throw new Error('No active business');
      return orderRepository.startPreparingOrder({ orderId, businessId: activeBusinessId });
    },

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });
      const previous = queryClient.getQueryData<any>(SELLER_KEYS.order(orderId));
      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'preparing' },
        });
      }
      return { previous };
    },

    onSuccess: () => {
      toast.success("Started preparing order");
    },

    onError: (error, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      toast.error(extractApiErrorMessage(error));
    },

    onSettled: (_data, _error, orderId) => {
      invalidateOrderQueries(queryClient, orderId);
    },
  });
}

export function useMarkOrderReadyMutation() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => {
      if (!activeBusinessId) throw new Error('No active business');
      return orderRepository.markOrderReady({ orderId, businessId: activeBusinessId });
    },

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });
      const previous = queryClient.getQueryData<any>(SELLER_KEYS.order(orderId));
      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'ready' },
        });
      }
      return { previous };
    },

    onSuccess: () => {
      toast.success("Order marked as ready");
    },

    onError: (error, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      toast.error(extractApiErrorMessage(error));
    },

    onSettled: (_data, _error, orderId) => {
      invalidateOrderQueries(queryClient, orderId);
    },
  });
}

export function useAcceptOrderMutation() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => {
      if (!activeBusinessId) throw new Error('No active business');
      return orderRepository.acceptOrder({ orderId, businessId: activeBusinessId });
    },

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });
      const previous = queryClient.getQueryData<any>(SELLER_KEYS.order(orderId));
      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'preparing' },
        });
      }
      return { previous };
    },

    onSuccess: () => {
      toast.success("Order accepted");
    },

    onError: (error, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      toast.error(extractApiErrorMessage(error));
    },

    onSettled: (_data, _error, orderId) => {
      invalidateOrderQueries(queryClient, orderId);
    },
  });
}

export function useRejectOrderMutation() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => {
      if (!activeBusinessId) throw new Error('No active business');
      return orderRepository.rejectOrder({ orderId, businessId: activeBusinessId });
    },

    onSuccess: () => {
      toast.success("Order rejected");
    },

    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
    },
  });
}

export function useConfirmHandoverMutation() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => {
      if (!activeBusinessId) throw new Error('No active business');
      return orderRepository.confirmHandover({ deliveryId, businessId: activeBusinessId });
    },

    onSuccess: () => {
      toast.success("Handover confirmed! Waiting for rider pickup confirmation.");
    },

    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
    },
  });
}

export function useCancelOrderMutation() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => {
      if (!activeBusinessId) throw new Error('No active business');
      return orderRepository.cancelOrder({ orderId, businessId: activeBusinessId });
    },
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export { SELLER_KEYS as sellerKeys };
