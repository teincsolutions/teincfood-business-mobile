import { useQuery } from "@tanstack/react-query";
import { useReferenceData } from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import type { FeatureKey } from "@/constants/feature-keys";

const GRACE_HOURS = 72;

export function useEntitlements() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const ref = useReferenceData<Record<string, unknown>>("subscription:entitlements");

  const data = ref.data?.payload as Record<string, unknown> | undefined;

  return {
    businessId,
    data,
    isLoading: ref.isLoading,
    refetch: ref.refetch,
  };
}

export function useHasFeature(key: FeatureKey): boolean {
  const { data } = useEntitlements();
  if (!data) return false;
  // Grace period handled server-side but keep client grace for offline
  const status = data.subscription_status as string | undefined;
  const periodEnd = data.current_period_end as string | undefined;
  if (status && periodEnd && (status === "active" || status === "trialing")) {
    const diff = Date.now() - new Date(periodEnd).getTime();
    if (diff > GRACE_HOURS * 3600 * 1000 && diff > 0) {
      // Expired beyond grace — deny paid features
      if (key.startsWith("seller.pos") || key === "seller.online_orders" || key === "seller.promo" || key.startsWith("fleet.")) {
        return false;
      }
    }
  }
  const val = data[key];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return Boolean(val);
}

export function useFeatureLimit(key: FeatureKey): number | null {
  const { data } = useEntitlements();
  if (!data) return null;
  const val = data[key];
  return typeof val === "number" ? val : null;
}
