import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsEffectivelyOnline } from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import * as walletService from "@/services/wallet.service";

const pendingPayoutsKey = (businessId: string | undefined) => [
  "wallet-pending-payouts",
  businessId,
];

export function usePendingPayoutsQuery(businessId?: string | null) {
  const online = useIsEffectivelyOnline();

  return useQuery({
    queryKey: pendingPayoutsKey(businessId ?? undefined),
    queryFn: () => walletService.fetchPendingPayouts(businessId!),
    enabled: Boolean(businessId) && online,
    refetchInterval: 5_000,
    staleTime: 0,
  });
}

export function useSubmitPayoutOtpMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (params: { reference: string; otp: string }) =>
      walletService.submitPayoutOtp(params.reference, params.otp),
    onError: (error) => {
      console.debug("[useSubmitPayoutOtpMutation] failed", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pendingPayoutsKey(businessId),
      });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useResendPayoutOtpMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (reference: string) => walletService.resendPayoutOtp(reference),
    onError: (error) => {
      console.debug("[useResendPayoutOtpMutation] failed", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pendingPayoutsKey(businessId),
      });
    },
  });
}
