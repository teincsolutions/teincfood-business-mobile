import { api } from "./api";

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  commission_rate_percent: number;
  monthly_fee_minor: number;
  yearly_fee_minor: number;
  currency: string;
  interval: string;
  trial_days: number;
  features: Record<string, unknown>;
  is_active: boolean;
}

export interface PaymentConfiguration {
  business_id: string;
  commission_rate_percent: number;
  subscription_plan: string | null;
  subscription_plan_id: string | null;
  subscription_active: boolean;
  subscription_status: string;
  provider: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

export interface Entitlements extends Record<string, unknown> {
  commission_rate_percent: number;
  subscription_status: string;
  business_type: string;
}

export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await api.get<{ data: SubscriptionPlan[] }>("/subscription-plans");
  // axios interceptor unwraps data, but reference service expects nested
  return (res as unknown as { data: SubscriptionPlan[] }).data ?? [];
}

export async function fetchMySubscription(businessId: string): Promise<{
  configuration: PaymentConfiguration;
  entitlements: Entitlements;
  available_plans: SubscriptionPlan[];
}> {
  const res = await api.get<{
    data: {
      configuration: PaymentConfiguration;
      entitlements: Entitlements;
      available_plans: SubscriptionPlan[];
    };
  }>(`/businesses/${businessId}/subscription`);
  return (res as unknown as { data: { configuration: PaymentConfiguration; entitlements: Entitlements; available_plans: SubscriptionPlan[] } }).data;
}

export async function updateMySubscription(
  businessId: string,
  payload: { subscription_plan_id: string | null; provider?: string | null },
) {
  const res = await api.patch<{
    data: { configuration: PaymentConfiguration; entitlements: Entitlements };
  }>(`/businesses/${businessId}/subscription`, payload);
  return (res as unknown as { data: { configuration: PaymentConfiguration; entitlements: Entitlements } }).data;
}
