import { useMemo } from 'react';
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { SellerOrder as ApiSellerOrder } from "@teincfood/core";
import type { BusinessOrdersParams, BusinessDeliveriesParams } from '@/services/seller.service';
import * as sellerService from '@/services/seller.service';
import { orderRepository } from "@teincfood/core";
import { useBusinessStore } from '@/stores/business.store';
import { usePendingOrders } from './pending-orders.hooks';
import { orderSnapshotsService } from "@teincfood/core";
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from "@teincfood/core";
import { useConnectivityStore } from '@/stores/connectivity.store';

function isQueuedTransition(result: unknown): boolean {
  const r = result as { status?: string; command_id?: string; id?: string } | undefined;
  return r?.status === "pending" && typeof r?.command_id === "string" && !r?.id;
}

const sellerPreSnap = new Map<string, { isOnline: boolean; isCloudReachable: string; navOnline: boolean | null; at: string }>();
function captureSellerPre(orderId: string) {
  const s = useConnectivityStore.getState();
  const snap = { isOnline: s.isOnline, isCloudReachable: s.isCloudReachable, navOnline: typeof navigator !== "undefined" ? navigator.onLine : null, at: new Date().toISOString() };
  sellerPreSnap.set(orderId, snap);
  return snap;
}

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

function filterSellerOrdersOffline(orders: ApiSellerOrder[], filters?: { status?: string; q?: string }): ApiSellerOrder[] {
  let filtered = orders;
  if (filters?.status) {
    const set = new Set(filters.status.split(",").map((s) => s.trim()));
    filtered = filtered.filter((o) => set.has(o.status));
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter((o) => o.order_number.toLowerCase().includes(q) || (o.customer_name ?? "").toLowerCase().includes(q));
  }
  return filtered;
}
function paginateSellerOffline(orders: ApiSellerOrder[], page: number, pageSize = 20) {
  const start = (page - 1) * pageSize;
  const slice = orders.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  return { data: slice, pagination: { page, page_size: pageSize, total_pages: totalPages, total_count: orders.length } } as unknown as { data: ApiSellerOrder[]; pagination: { page: number; total_pages: number } };
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
      try {
        const result = await sellerService.fetchBusinessOrders(activeBusinessId!, params);
        // Write through to the durable offline read model so the exact list seen
        // online is available offline after a restart.
        if (pageParam === 1 && activeBusinessId && Array.isArray(result?.data)) {
          orderSnapshotsService
            .persistSellerOrders(activeBusinessId, activeBusinessId, result.data)
            .catch(() => {});
        }
        return result;
      } catch (e) {
        const offline = activeBusinessId ? await orderSnapshotsService.getSellerList(activeBusinessId, activeBusinessId) : null;
        if (offline) {
          const filtered = filterSellerOrdersOffline(offline, filters);
          return paginateSellerOffline(filtered, pageParam as number);
        }
        throw e;
      }
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
      captureSellerPre(orderId);
      console.debug('[seller] updateOrderStatus → sync engine', { orderId, status, businessId, isCloudReachable: useConnectivityStore.getState().isCloudReachable });
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

    onSuccess: (data, { orderId }, context) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] updateOrderStatus QUEUED offline — will sync when online', { orderId, pre: sellerPreSnap.get(orderId), now: useConnectivityStore.getState(), hint: "See [SyncEngine]/[http]/[api] lines below" });
        if (context?.previous) queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
        toast.warning('Queued offline — will sync when online');
        return;
      }
    },

    onError: (error, { orderId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      console.error('[seller] updateOrderStatus failed', { orderId, error });
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
      captureSellerPre(orderId);
      console.debug('[seller] startPreparing → sync engine', { orderId, businessId: activeBusinessId });
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

    onSuccess: (data, orderId, context) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] startPreparing QUEUED offline — will sync when online', { orderId });
        if (context?.previous) queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
        toast.warning('Queued offline — will sync when online');
        return;
      }
      toast.success("Started preparing order");
    },

    onError: (error, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      console.error('[seller] startPreparing failed', { orderId, error });
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
      captureSellerPre(orderId);
      console.debug('[seller] markReady → sync engine', { orderId, businessId: activeBusinessId });
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

    onSuccess: (data, orderId, context) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] markReady QUEUED offline — will sync when online', { orderId });
        if (context?.previous) queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
        toast.warning('Queued offline — will sync when online');
        return;
      }
      toast.success("Order marked as ready");
    },

    onError: (error, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      console.error('[seller] markReady failed', { orderId, error });
      toast.error(extractApiErrorMessage(error));
    },

    onSettled: (_data, _error, orderId) => {
      invalidateOrderQueries(queryClient, orderId);
    },
  });
}

export function useCompletePickupMutation() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => {
      if (!activeBusinessId) throw new Error('No active business');
      captureSellerPre(orderId);
      console.debug('[seller] completePickup → sync engine', { orderId, businessId: activeBusinessId });
      return orderRepository.completePickup({ orderId, businessId: activeBusinessId });
    },

    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: SELLER_KEYS.order(orderId) });
      const previous = queryClient.getQueryData<any>(SELLER_KEYS.order(orderId));
      if (previous) {
        queryClient.setQueryData<any>(SELLER_KEYS.order(orderId), {
          order: { ...previous.order, status: 'delivered' },
        });
      }
      return { previous };
    },

    onSuccess: (data, orderId, context) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] completePickup QUEUED offline — will sync when online', { orderId });
        if (context?.previous) queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
        toast.warning('Queued offline — will sync when online');
        return;
      }
      toast.success("Order handed to customer");
    },

    onError: (error, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      console.error('[seller] completePickup failed', { orderId, error });
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
      captureSellerPre(orderId);
      console.debug('[seller] accept → sync engine', { orderId, businessId: activeBusinessId });
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

    onSuccess: (data, orderId, context) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] accept QUEUED offline — will sync when online', { orderId });
        if (context?.previous) queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
        toast.warning('Queued offline — will sync when online');
        return;
      }
      toast.success("Order accepted");
    },

    onError: (error, orderId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SELLER_KEYS.order(orderId), context.previous);
      }
      console.error('[seller] accept failed', { orderId, error });
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
      captureSellerPre(orderId);
      console.debug('[seller] reject → sync engine', { orderId, businessId: activeBusinessId });
      return orderRepository.rejectOrder({ orderId, businessId: activeBusinessId });
    },

    onSuccess: (data) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] reject QUEUED offline — will sync when online');
        toast.warning('Queued offline — will sync when online');
        return;
      }
      toast.success("Order rejected");
    },

    onError: (error) => {
      console.error('[seller] reject failed', { error });
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
      captureSellerPre(deliveryId);
      console.debug('[seller] confirmHandover → sync engine', { deliveryId, businessId: activeBusinessId });
      return orderRepository.confirmHandover({ deliveryId, businessId: activeBusinessId });
    },

    onSuccess: (data) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] confirmHandover QUEUED offline — will sync when online');
        toast.warning('Queued offline — will sync when online');
        return;
      }
      toast.success("Handover confirmed! Waiting for rider pickup confirmation.");
    },

    onError: (error) => {
      console.error('[seller] confirmHandover failed', { error });
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
      captureSellerPre(orderId);
      console.debug('[seller] cancel → sync engine', { orderId, businessId: activeBusinessId });
      return orderRepository.cancelOrder({ orderId, businessId: activeBusinessId });
    },
    onSuccess: (data) => {
      if (isQueuedTransition(data)) {
        console.warn('[seller] cancel QUEUED offline — will sync when online');
        toast.warning('Queued offline — will sync when online');
        return;
      }
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
    },
    onError: (error) => {
      console.error('[seller] cancel failed', { error });
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export { SELLER_KEYS as sellerKeys };
