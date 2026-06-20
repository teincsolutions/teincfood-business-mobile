import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

const ORDERS_QUERY_KEY = ['orders'];

export function useOrdersQuery() {
  return useQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: () => api.get('/orders'),
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: any) => api.post('/orders', order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/orders/${orderId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}

export function useRemoveOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.delete(`/orders/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}
