import { useMemo } from 'react';
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { posRepository } from '@/repositories/pos.repository';
import { useBusinessStore } from '@/stores/business.store';
import { usePendingOrders } from './pending-orders.hooks';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';
import { SELLER_KEYS } from './seller.hooks';
import type { POSOrderCreateRequest, POSOrderPreviewResponse } from '@/types/pos.types';
import type { POSCartItem, POSOrderType, POSOrderItemRequest } from '@/types/pos.types';
import type { SellerOrder } from '@/types/api/seller.api';

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

export function usePOSOrdersQuery(
  filters?: { status?: string; order_type?: string; date_from?: string; date_to?: string },
  enabled = true,
) {
  const businessId = useBusinessId();
  const pendingOrders = usePendingOrders(businessId);
  const query = useInfiniteQuery({
    queryKey: [...POS_KEYS.orders(businessId), filters],
    queryFn: ({ pageParam = 1 }) => {
      const params: Record<string, string> = { page: String(pageParam) };
      if (filters?.status) params.status = filters.status;
      if (filters?.order_type) params.order_type = filters.order_type;
      if (filters?.date_from) params.date_from = filters.date_from;
      if (filters?.date_to) params.date_to = filters.date_to;
      return posRepository.fetchOrders(businessId!, params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: enabled && !!businessId,
    staleTime: 30 * 1000,
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
    mutationFn: (data: POSOrderCreateRequest) =>
      posRepository.createOrder(businessId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      toast.success('Order created successfully');
    },
    onError: (error) => {
      console.debug('[POS] Create order error:', error);
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
    queryFn: () => {
      const orderItems: POSOrderItemRequest[] = items.map((i) => ({
        menu_item_id: i.menu_item.id,
        quantity: i.quantity,
        variant_id: i.selected_variant?.id,
        addon_ids:
          i.selected_addons.length > 0
            ? i.selected_addons.map((a) => a.addon_id)
            : undefined,
      }));
      return posRepository.fetchPreview({
        businessId: businessId!,
        items: orderItems,
        orderType,
        customerName: customerName || undefined,
      });
    },
    enabled: !!businessId && items.length > 0,
    staleTime: 1000 * 30,
  });
}
