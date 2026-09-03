import { useMemo } from 'react';
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { posRepository } from "@teincfood/core";
import { useBusinessStore } from '@/stores/business.store';
import { usePendingOrders } from './pending-orders.hooks';
import { orderSnapshotsService } from "@teincfood/core";
import { toast } from 'sonner-native';
import { extractApiErrorMessage, isLocalOrderNumber } from "@teincfood/core";
import { useConnectivityStore } from '@/stores/connectivity.store';
import { SELLER_KEYS } from './seller.hooks';
import type { POSOrderCreateRequest, POSOrderPreviewResponse } from "@teincfood/core";
import type { POSCartItem, POSOrderType, POSOrderItemRequest } from "@teincfood/core";
import type { SellerOrder } from "@teincfood/core";

export const POS_KEYS = {
  all: ['pos'] as const,
  orders: (businessId?: string) => [...POS_KEYS.all, 'orders', businessId] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

/**
 * Prepend locally queued (pending) orders to the server-fetched list and sort
 * newest-first. Dedupes by order_number so an order that is both pending and
 * already visible from the server does not appear twice.
 */
function mergePendingOrders(
  pending: SellerOrder[],
  serverOrders: SellerOrder[] | undefined,
): SellerOrder[] {
  if (pending.length === 0) return serverOrders ?? [];
  const seen = new Set<string>();
  const merged: SellerOrder[] = [];
  for (const order of pending) {
    seen.add(order.order_number);
    merged.push(order);
  }
  for (const order of serverOrders ?? []) {
    if (!seen.has(order.order_number)) merged.push(order);
  }
  return merged.sort((a, b) => b.inserted_at.localeCompare(a.inserted_at));
}

function filterOrdersOffline(orders: SellerOrder[], filters?: { status?: string; order_type?: string; is_pos?: string; q?: string; search?: string; date_from?: string; date_to?: string }): SellerOrder[] {
  let filtered = orders;
  const statusSet = filters?.status ? new Set(filters.status.split(",").map((s) => s.trim())) : null;
  if (statusSet) filtered = filtered.filter((o) => statusSet.has(o.status));
  if (filters?.order_type) filtered = filtered.filter((o) => (o.order_type ?? "pos") === filters.order_type);
  if (filters?.is_pos !== undefined) {
    const wantPos = filters.is_pos === "true" || filters.is_pos === "1";
    filtered = filtered.filter((o) => !!o.is_pos === wantPos);
  }
  const q = (filters?.q ?? filters?.search ?? "").toLowerCase();
  if (q) filtered = filtered.filter((o) => o.order_number.toLowerCase().includes(q) || (o.customer_name ?? "").toLowerCase().includes(q));
  if (filters?.date_from) {
    const from = filters.date_from.slice(0, 10);
    filtered = filtered.filter((o) => (o.inserted_at ?? "").slice(0, 10) >= from);
  }
  if (filters?.date_to) {
    const to = filters.date_to.slice(0, 10);
    filtered = filtered.filter((o) => (o.inserted_at ?? "").slice(0, 10) <= to);
  }
  return filtered;
}

function paginateOffline(orders: SellerOrder[], page: number, pageSize = 20) {
  const start = (page - 1) * pageSize;
  const slice = orders.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  return { data: slice, pagination: { page, page_size: pageSize, total_pages: totalPages, total_count: orders.length } };
}

export function usePOSOrdersQuery(
  filters?: {
    status?: string;
    order_type?: string;
    is_pos?: string;
    date_from?: string;
    date_to?: string;
  },
  enabled = true,
) {
  const businessId = useBusinessId();
  const pendingOrders = usePendingOrders(businessId);
  // Snapshot hydration is done by useOfflineOrderHydration (seller _layout), so
  // query cache is warm after first sync; pending overlay is always immediate.
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const isCloudReachable = useConnectivityStore((s) => s.isCloudReachable);
  const isOffline = !isOnline || isCloudReachable === "unreachable";

  const query = useInfiniteQuery({
    queryKey: [...POS_KEYS.orders(businessId), filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string> = { page: String(pageParam) };
      if (filters?.status) params.status = filters.status;
      if (filters?.order_type) params.order_type = filters.order_type;
      if (filters?.is_pos) params.is_pos = filters.is_pos;
      if (filters?.date_from) params.date_from = filters.date_from;
      if (filters?.date_to) params.date_to = filters.date_to;

      // Device-owned outbox: when offline, never wait for cloud timeout — serve
      // the durable snapshot + pending overlay immediately; the SyncEngine
      // replays queued commands when back online.
      if (isOffline) {
        const offline = businessId ? await orderSnapshotsService.getSellerList(businessId, businessId) : null;
        const base = offline ?? [];
        const filtered = filterOrdersOffline(base, filters as any);
        return paginateOffline(filtered, pageParam as number);
      }

      try {
        const result = await posRepository.fetchOrders(businessId!, params);
        // Write through to the durable offline read model.
        if (pageParam === 1 && businessId && Array.isArray(result?.data)) {
          orderSnapshotsService
            .persistSellerOrders(businessId, businessId, result.data)
            .catch(() => {});
        }
        return result;
      } catch (e) {
        // Network error while nominally online — still serve snapshot.
        const offline = businessId ? await orderSnapshotsService.getSellerList(businessId, businessId) : null;
        if (offline) {
          const filtered = filterOrdersOffline(offline, filters as any);
          return paginateOffline(filtered, pageParam as number);
        }
        throw e;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: enabled && !!businessId,
    staleTime: 30 * 1000,
    retry: false,
    networkMode: "offlineFirst" as const,
    select: (data) => data.pages.flatMap((p) => p.data),
  });

  const data = useMemo(
    () => mergePendingOrders(pendingOrders, query.data),
    [pendingOrders, query.data],
  );

  return { ...query, data };
}

export function useCreatePOSOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: POSOrderCreateRequest) => {
      const cloudState = useConnectivityStore.getState().isCloudReachable;
      const isOnline = useConnectivityStore.getState().isOnline;
      console.debug('[POS] createOrder → sync engine', {
        businessId,
        isOnline,
        isCloudReachable: cloudState,
        order_type: data.order_type,
        items: data.items?.length,
        payload: data,
      });
      if (!businessId) {
        throw new Error('Missing business — select a business before creating orders');
      }
      // 0.7.0: ensure device lease before offline queuing (DD-RRR-CCC requires lease)
      try {
        const core = await import("@teincfood/core");
        const dn = (core as any).getDeviceNumber?.(businessId) ?? null;
        if (!dn) {
          const leased = await (core as any).ensureDeviceLease?.(businessId);
          if (!leased && (!isOnline || cloudState === "unreachable")) {
            throw new Error('No device number leased (99 devices max) — cannot create offline orders');
          }
        }
      } catch (e) {
        // rethrow device lease errors, otherwise ignore
        if ((e as Error)?.message?.includes('device number') || (e as Error)?.message?.includes('No device lease')) throw e;
      }
      return posRepository.createOrder(businessId, data);
    },
    onSuccess: (result: unknown) => {
      const r = result as { order_number?: string; id?: string; status?: string } | undefined;
      const orderNumber = r?.order_number ?? '';
      const queued = orderNumber ? isLocalOrderNumber(orderNumber) && r?.status === 'pending' : false;
      // The core returns the optimistic payload directly when queued; real orders
      // come back with backend-assigned id/status and are not flagged as local pending.
      console.debug('[POS] createOrder onSuccess', { businessId, orderNumber, status: r?.status, queued, result });
      queryClient.invalidateQueries({ queryKey: POS_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      if (queued) {
        console.warn('[POS] order was QUEUED offline (isCloudReachable=unreachable or timeout) — will sync when online', { businessId, orderNumber, cloudState: useConnectivityStore.getState().isCloudReachable });
        toast.warning(`Order ${orderNumber} queued offline — will sync when online`);
      } else {
        toast.success(orderNumber ? `Order ${orderNumber} created` : 'Order created successfully');
      }
    },
    onError: (error) => {
      console.error('[POS] Create order failed', {
        businessId,
        isOnline: useConnectivityStore.getState().isOnline,
        isCloudReachable: useConnectivityStore.getState().isCloudReachable,
        error,
      });
      toast.error(extractApiErrorMessage(error));
    },
  });
}

/** Stable hash from cart items for use as a query key suffix */
function cartHash(items: POSCartItem[]): string {
  if (items.length === 0) return '';
  return items
    .map(
      (i) =>
        `${i.menu_item.id}:${i.quantity}:${i.selected_variant?.id || ''}:${(i.selected_addons || [])
          .map((a) => a.addon_id)
          .sort()
          .join(',')}`,
    )
    .join('|');
}

export function usePOSOrderPreviewQuery(
  items: POSCartItem[],
  orderType: POSOrderType,
  customerName: string,
) {
  const businessId = useBusinessId();
  const hash = useMemo(() => cartHash(items), [items]);

  return useQuery({
    queryKey: [...POS_KEYS.all, 'preview', businessId, hash, orderType, customerName],
    queryFn: async () => {
      const orderItems: POSOrderItemRequest[] = items.map((i) => ({
        menu_item_id: i.menu_item.id,
        quantity: i.quantity,
        variant_id: i.selected_variant?.id,
        addon_ids:
          i.selected_addons.length > 0
            ? i.selected_addons.map((a) => a.addon_id)
            : undefined,
      }));
      try {
        return await posRepository.fetchPreview({
          businessId: businessId!,
          items: orderItems,
          orderType,
          customerName: customerName || undefined,
        });
      } catch (e) {
        // Offline fallback: local pricing via tax-rules + cart unit_price_minor.
        const state = useConnectivityStore.getState();
        const isOffline = !state.isOnline || state.isCloudReachable === "unreachable";
        if (!isOffline) throw e;
        try {
          const { openSyncDatabase, getReferenceData, calculatePricing } = await import("@teincfood/core");
          const db = await openSyncDatabase();
          const taxRec = await getReferenceData<{ data: unknown[] }>(db, businessId!, "tax-rules");
          const taxRules = (taxRec?.payload as { data?: unknown[] })?.data as unknown[] ?? [];
          // Convert POSCartItem to PricingInput shape (unit_price_minor already includes variant/addons)
          const pricing = calculatePricing({
            items: items as unknown as Parameters<typeof calculatePricing>[0]["items"],
            taxRules: taxRules as unknown as Parameters<typeof calculatePricing>[0]["taxRules"],
          });
          // Match POSOrderPreviewResponse shape minimally for UI.
          return {
            data: {
              subtotal_minor: pricing.subtotal_minor,
              discount_minor: pricing.discount_minor,
              delivery_fee_minor: pricing.delivery_fee_minor,
              tax_minor: pricing.tax_minor,
              tip_minor: pricing.tip_minor,
              total_minor: pricing.total_minor,
              tax_lines: pricing.tax_lines,
              currency: pricing.currency_code,
            },
          } as unknown as POSOrderPreviewResponse;
        } catch {
          throw e;
        }
      }
    },
    enabled: !!businessId && items.length > 0,
    staleTime: 1000 * 30,
  });
}
