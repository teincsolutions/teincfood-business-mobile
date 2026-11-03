import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { POSPaymentMethod } from "@teincfood/core";
import * as businessService from "@/services/business.service";
import type { BusinessPaymentSettings } from "@/services/business.service";

export function paymentSettingsQueryKey(businessId?: string | null) {
  return ["payment-settings", businessId] as const;
}

export function usePaymentSettingsQuery(businessId?: string | null) {
  return useQuery({
    queryKey: paymentSettingsQueryKey(businessId),
    queryFn: () => businessService.fetchPaymentSettings(businessId as string),
    enabled: Boolean(businessId),
    staleTime: 60_000,
  });
}

export function useUpdatePaymentSettingsMutation(businessId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof businessService.updatePaymentSettings>[1]) =>
      businessService.updatePaymentSettings(businessId as string, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: paymentSettingsQueryKey(businessId),
      });
    },
  });
}

export function buildPaymentMethodSettings(
  acceptCash: boolean,
  acceptMobileMoney: boolean,
  acceptCard: boolean,
): string[] {
  const methods: string[] = [];
  if (acceptCash) methods.push("cash", "pay_on_delivery");
  if (acceptMobileMoney) methods.push("mobile_money");
  if (acceptCard) methods.push("card");
  return methods;
}

/**
 * Payment methods the POS can actually take. Card is excluded until the
 * terminal has a card-present capture flow; the setting still controls online
 * checkout.
 */
export function enabledPosPaymentMethods(
  settings?: BusinessPaymentSettings | null,
): POSPaymentMethod[] {
  const methods = settings?.configured
    ? settings.payment_methods ?? []
    : ["cash", "mobile_money"];

  const enabled: POSPaymentMethod[] = [];
  if (methods.includes("cash")) enabled.push("cash");
  if (methods.includes("mobile_money")) enabled.push("mobile_money");
  return enabled;
}
