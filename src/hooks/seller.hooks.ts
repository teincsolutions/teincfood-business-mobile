import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { SellerOrder as ApiSellerOrder } from '@/types/api/seller.api';
import type { BusinessOrdersParams } from '@/services/seller.service';
import * as sellerService from '@/services/seller.service';
import { useBusinessStore } from '@/stores/business.store';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

export const SELLER_KEYS = {
  all: ['seller'] as const,
  orders: (businessId?: string, filters?: BusinessOrdersParams) =>
    [...SELLER_KEYS.all, 'orders', businessId, filters].filter((x) => x !== undefined) as readonly any[],
  order: (id: string, businessId?: string) => [...SELLER_KEYS.all, 'order', id, businessId] as const,
};

export function useSellerOrdersQuery(
  enabled = true,
  filters?: { status?: string; q?: string },
) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useInfiniteQuery({
    queryKey: SELLER_KEYS.orders(activeBusinessId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: BusinessOrdersParams = { page: pageParam, page_size: 20 };
      if (filters?.status) params.status = filters.status;
      if (filters?.q) params.q = filters.q;
      return sellerService.fetchBusinessOrders(activeBusinessId!, params);
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

export function useSellerOrderQuery(orderId: string, enabled = true) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useQuery({
    queryKey: SELLER_KEYS.order(orderId, activeBusinessId),
    queryFn: () => sellerService.fetchSellerOrder(orderId),
    enabled: enabled && Boolean(orderId),
    staleTime: 5000,
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
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      sellerService.updateOrderStatus(orderId, status),

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.startPreparingOrder(orderId),

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.markOrderReady(orderId),

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.acceptOrder(orderId),

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sellerService.rejectOrder(orderId),

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
  const queryClient = useQueryClient();

  return   useMutation({
    mutationFn: (deliveryId: string) => sellerService.confirmHandover(deliveryId),

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => sellerService.cancelOrder(orderId),
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
