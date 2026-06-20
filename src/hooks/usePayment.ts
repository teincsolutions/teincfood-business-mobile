import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';

export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await paymentService.listPaymentMethods();
      return response?.data || [];
    },
  });
}

export function useInitiatePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => paymentService.initiatePayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useRemovePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) => paymentService.deletePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useSetDefaultPaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentService.updatePaymentMethod(paymentMethodId, { is_default: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useUpdatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      paymentService.updatePaymentMethod(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useAddPaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      paymentService.createPaymentMethod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useSetupPaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      paymentService.setupPaymentMethod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useConfirmPaymentMethodSetupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      paymentService.confirmPaymentMethodSetup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
  });
}

export function useVerifyPaymentMutation(options?: {
  onSuccess?: (data: any) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { provider: string; reference: string; order_id: string }) =>
      paymentService.verifyPayment(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.order_id] });
      options?.onSuccess?.(data);
    },
  });
}
