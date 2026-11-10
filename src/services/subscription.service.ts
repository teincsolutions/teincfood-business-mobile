import { api } from "./api";
import type { MomoCharge } from "@/types/payment";

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  business_type: string;
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

export async function listSubscriptionPlans(
  businessType?: string,
): Promise<SubscriptionPlan[]> {
  const qs = businessType
    ? `?business_type=${encodeURIComponent(businessType)}`
    : ``;
  const res = await api.get<{ data: SubscriptionPlan[] }>(
    `/subscription-plans${qs}`,
  );
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
  return (
    res as unknown as {
      data: {
        configuration: PaymentConfiguration;
        entitlements: Entitlements;
        available_plans: SubscriptionPlan[];
      };
    }
  ).data;
}

export async function updateMySubscription(
  businessId: string,
  payload: { subscription_plan_id: string | null; provider?: string | null },
) {
  const res = await api.patch<{
    data: { configuration: PaymentConfiguration; entitlements: Entitlements };
  }>(`/businesses/${businessId}/subscription`, payload);
  return (
    res as unknown as {
      data: { configuration: PaymentConfiguration; entitlements: Entitlements };
    }
  ).data;
}

export interface BillingProfile {
  business_id: string;
  has_momo: boolean;
  momo_phone?: string | null;
  momo_phone_last4?: string | null;
  momo_provider?: string | null;
  billing_email?: string | null;
  auto_renew: boolean;
  consent_at?: string | null;
  consent_version?: string | null;
  failed_attempts?: number;
}

export interface SubscriptionInvoice {
  id: string;
  plan_id: string | null;
  billing_cycle: string;
  base_amount_minor: number;
  fee_minor: number;
  amount_minor: number;
  currency: string;
  period_start: string;
  period_end: string;
  due_at: string;
  status: string;
  reference: string;
  payment_reference?: string | null;
  paid_at?: string | null;
  provider_fee_minor?: number | null;
  attempt_count: number;
}

export interface BillingOverview {
  configuration: PaymentConfiguration & {
    momo_fee_basis_points?: number;
    subscription_amount_override_minor?: number | null;
    subscription_cycle_override?: string | null;
    cancel_at_period_end?: boolean;
  };
  billing_profile: BillingProfile;
  upcoming_invoice: SubscriptionInvoice | null;
  invoices: SubscriptionInvoice[];
  available_plans: SubscriptionPlan[];
  entitlements: Entitlements;
}

export interface SubscriptionCheckoutInput {
  plan_id: string;
  cycle?: "month" | "year";
  start_trial?: boolean;
  /** Create the invoice only; never start a MoMo charge. */
  defer_payment?: boolean;
  phone?: string;
  provider?: string;
  address?: string;
}

export interface SubscriptionCheckoutResponse {
  status: string;
  configuration?: PaymentConfiguration;
  upcoming_invoice?: SubscriptionInvoice | null;
  invoice?: SubscriptionInvoice | null;
  charge?: MomoCharge | null;
  payment_required?: boolean;
}

export async function fetchBilling(
  businessId: string,
): Promise<BillingOverview> {
  const res = await api.get<{ data: BillingOverview }>(
    `/businesses/${businessId}/billing`,
  );
  return (res as unknown as { data: BillingOverview }).data;
}

export async function fetchInvoices(
  businessId: string,
): Promise<SubscriptionInvoice[]> {
  const res = await api.get<{ data: SubscriptionInvoice[] }>(
    `/businesses/${businessId}/invoices`,
  );
  return (res as unknown as { data: SubscriptionInvoice[] }).data ?? [];
}

export async function updateBillingProfile(
  businessId: string,
  payload: {
    phone?: string;
    provider?: string;
    billing_email?: string;
    auto_renew?: boolean;
    consent_version?: string;
  },
): Promise<BillingProfile> {
  const res = await api.put<{ data: BillingProfile }>(
    `/businesses/${businessId}/billing/profile`,
    payload,
  );
  return (res as unknown as { data: BillingProfile }).data;
}

export async function checkoutSubscription(
  businessId: string,
  payload: SubscriptionCheckoutInput,
): Promise<SubscriptionCheckoutResponse> {
  const res = await api.post<{ data: SubscriptionCheckoutResponse }>(
    `/businesses/${businessId}/subscription/checkout`,
    payload,
  );
  return (res as unknown as { data: SubscriptionCheckoutResponse }).data;
}

export async function cancelSubscription(
  businessId: string,
): Promise<PaymentConfiguration> {
  const res = await api.post<{ data: PaymentConfiguration }>(
    `/businesses/${businessId}/subscription/cancel`,
    {},
  );
  return (res as unknown as { data: PaymentConfiguration }).data;
}

export async function cancelSubscriptionInvoice(
  businessId: string,
  invoiceId: string,
): Promise<SubscriptionInvoice> {
  const res = await api.post<{ data: SubscriptionInvoice }>(
    `/businesses/${businessId}/invoices/${invoiceId}/cancel`,
    {},
  );
  return (res as unknown as { data: SubscriptionInvoice }).data;
}

export async function resumeSubscription(
  businessId: string,
): Promise<PaymentConfiguration> {
  const res = await api.post<{ data: PaymentConfiguration }>(
    `/businesses/${businessId}/subscription/resume`,
    {},
  );
  return (res as unknown as { data: PaymentConfiguration }).data;
}
