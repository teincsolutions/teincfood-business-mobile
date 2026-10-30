import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { referenceSyncService, useIsEffectivelyOnline } from "@teincfood/core";
import type { Promo } from "@teincfood/core";
import * as subscriptionService from "@/services/subscription.service";
import * as businessService from "@/services/business.service";
import { useBusinessStore } from "@/stores/business.store";

const PLANS_KEY = ["subscription-plans"];
const ENTITLEMENTS_KEY = ["reference-data", "subscription:entitlements"];
const subscriptionKey = (businessId: string | undefined) => [
  "my-subscription",
  businessId,
];
const promosKey = (businessId: string | undefined) => [
  "business-promos",
  businessId,
];

/** Audience for plan filtering: merchant sellers vs delivery-provider fleets. */
export function usePlanAudience(): string {
  const businessType = useBusinessStore((s) => s.activeBusiness?.type);
  if (businessType === "delivery_provider") return "delivery_provider";
  return "merchant";
}

export function useSubscriptionPlansQuery() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const audience = usePlanAudience();
  const online = useIsEffectivelyOnline();
  return useQuery({
    queryKey: [...PLANS_KEY, audience],
    queryFn: async () => {
      const plans = await subscriptionService.listSubscriptionPlans(audience);
      // Client-side guard: only this role's plans, single-column list.
      const mine = plans.filter((p) =>
        !p.business_type ? true : p.business_type === audience,
      );
      return mine.length > 0 ? mine : plans;
    },
    // Never fire while the cloud is unreachable — the request would hang and
    // leave the screen spinning. Cached plans still render from persistence.
    enabled: !!businessId && online,
  });
}

export function useMySubscriptionQuery() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const online = useIsEffectivelyOnline();
  return useQuery({
    queryKey: subscriptionKey(businessId),
    queryFn: () => subscriptionService.fetchMySubscription(businessId!),
    enabled: !!businessId && online,
  });
}

export function useUpdateSubscriptionMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (planId: string) =>
      subscriptionService.updateMySubscription(businessId!, {
        subscription_plan_id: planId,
        provider: "paystack",
      }),
    onError: (err) => {
      console.debug("[useUpdateSubscriptionMutation] failed", err);
    },
    onSuccess: async () => {
      if (businessId) {
        await referenceSyncService.sync({
          businessId,
          keys: ["subscription:entitlements"],
          force: true,
        });
        queryClient.invalidateQueries({
          queryKey: ENTITLEMENTS_KEY,
        });
      }
      queryClient.invalidateQueries({ queryKey: subscriptionKey(businessId) });
      queryClient.invalidateQueries({ queryKey: PLANS_KEY });
    },
  });
}

export function useBusinessPromosQuery() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const online = useIsEffectivelyOnline();
  return useQuery({
    queryKey: promosKey(businessId),
    queryFn: async (): Promise<Promo[]> => {
      const res = await businessService.fetchBusinessPromos(businessId!);
      return res.data ?? [];
    },
    enabled: !!businessId && online,
  });
}

export interface CreatePromoInput {
  code: string;
  discount_percent?: number | null;
  discount_minor?: number | null;
  max_uses?: number | null;
  expires_at?: string | null;
}

export function useCreatePromoMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (input: CreatePromoInput) =>
      businessService.createBusinessPromo(businessId!, { ...input }),
    onError: (err) => {
      console.debug("[useCreatePromoMutation] failed", err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promosKey(businessId) });
    },
  });
}

export function useDeletePromoMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (promoId: string) => businessService.deletePromo(promoId),
    onError: (err) => {
      console.debug("[useDeletePromoMutation] failed", err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promosKey(businessId) });
    },
  });
}

const billingKey = (businessId: string | undefined) => ["billing", businessId];

export function useBillingQuery() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const online = useIsEffectivelyOnline();
  return useQuery({
    queryKey: billingKey(businessId),
    queryFn: () => subscriptionService.fetchBilling(businessId!),
    enabled: !!businessId && online,
  });
}

function invalidateBilling(
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: string | undefined,
) {
  queryClient.invalidateQueries({ queryKey: billingKey(businessId) });
  queryClient.invalidateQueries({ queryKey: subscriptionKey(businessId) });
  queryClient.invalidateQueries({ queryKey: PLANS_KEY });
  if (businessId) {
    void referenceSyncService
      .sync({ businessId, keys: ["subscription:entitlements"], force: true })
      .catch(() => undefined);
  }
}

export function useUpdateBillingProfileMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (
      payload: Parameters<typeof subscriptionService.updateBillingProfile>[1],
    ) => subscriptionService.updateBillingProfile(businessId!, payload),
    onSuccess: () => invalidateBilling(queryClient, businessId),
  });
}

export function useCheckoutSubscriptionMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (payload: subscriptionService.SubscriptionCheckoutInput) =>
      subscriptionService.checkoutSubscription(businessId!, payload),
    onSuccess: () => invalidateBilling(queryClient, businessId),
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: () => subscriptionService.cancelSubscription(businessId!),
    onSuccess: () => invalidateBilling(queryClient, businessId),
  });
}

export function useResumeSubscriptionMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: () => subscriptionService.resumeSubscription(businessId!),
    onSuccess: () => invalidateBilling(queryClient, businessId),
  });
}
