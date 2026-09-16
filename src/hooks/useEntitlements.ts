import { useMemo } from "react";
import { useReferenceData } from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import type { FeatureKey } from "@/constants/feature-keys";

interface EntitlementEnvelope {
  version: string;
  server_time: string;
  expires_at: string | null;
  grace_until: string | null;
  max_offline_days: number;
  algorithm: string;
  signature: string;
}

type PayloadShape =
  | { data: Record<string, unknown>; envelope: EntitlementEnvelope }
  | Record<string, unknown>;

export type EntitlementState =
  | "active"
  | "trialing"
  | "grace"
  | "expired"
  | "stale-blocked"
  | "unverified"
  | "no-plan"
  | "loading";

export interface EntitlementEvaluation {
  state: EntitlementState;
  entitled: boolean;
  mustReconnect: boolean;
  reason: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function unwrap(payload: PayloadShape | null | undefined): {
  features: Record<string, unknown> | null;
  envelope: EntitlementEnvelope | null;
} {
  if (!payload || typeof payload !== "object") return { features: null, envelope: null };
  if ("envelope" in payload && "data" in payload) {
    const rec = payload as { data: unknown; envelope: unknown };
    if (rec.envelope && typeof rec.envelope === "object" && rec.data && typeof rec.data === "object") {
      return { features: rec.data as Record<string, unknown>, envelope: rec.envelope as EntitlementEnvelope };
    }
    return { features: null, envelope: null };
  }
  return { features: payload as Record<string, unknown>, envelope: null };
}

// Transitional evaluator: uses server-issued timestamps from the signed
// envelope. Full tamper-proof evaluation (HMAC verify + monotonic own
// counter, no wall-clock) lands with @teincfood/core 0.9 — until then a
// backdated device clock can extend access, bounded by the 7-day stale rule
// and server-side 402 enforcement.
function evaluate(
  features: Record<string, unknown> | null,
  envelope: EntitlementEnvelope | null,
): EntitlementEvaluation {
  if (!features) {
    return { state: "loading", entitled: false, mustReconnect: false, reason: "Loading subscription" };
  }
  const status = String(features["subscription_status"] ?? "none");

  if (envelope?.server_time) {
    const anchoredAt = Date.parse(envelope.server_time);
    const maxOfflineDays = Number.isFinite(envelope.max_offline_days) ? envelope.max_offline_days : 7;
    if (Number.isFinite(anchoredAt) && Date.now() - anchoredAt > maxOfflineDays * DAY_MS) {
      return {
        state: "stale-blocked",
        entitled: false,
        mustReconnect: true,
        reason: `Subscription not verified for ${maxOfflineDays} days — reconnect required`,
      };
    }
    const expiresMs = envelope.expires_at ? Date.parse(envelope.expires_at) : NaN;
    const graceMs = envelope.grace_until ? Date.parse(envelope.grace_until) : NaN;
    if (Number.isFinite(expiresMs)) {
      const now = Date.now();
      if (now <= expiresMs) {
        return {
          state: status === "trialing" ? "trialing" : "active",
          entitled: true,
          mustReconnect: false,
          reason: "Subscription in period",
        };
      }
      if (Number.isFinite(graceMs) && now <= graceMs) {
        return { state: "grace", entitled: true, mustReconnect: false, reason: "Within grace period — renew soon" };
      }
      return { state: "expired", entitled: false, mustReconnect: false, reason: "Subscription expired — upgrade to continue" };
    }
  }

  // Legacy flat payload (pre-envelope cache): fail-closed on unknown.
  if (status === "active" || status === "trialing") {
    return { state: status, entitled: true, mustReconnect: false, reason: "Active subscription" };
  }
  return { state: "no-plan", entitled: false, mustReconnect: false, reason: "No subscription plan" };
}

export function useEntitlements() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const ref = useReferenceData<PayloadShape>("subscription:entitlements");

  const { features, envelope } = useMemo(() => unwrap(ref.data?.payload), [ref.data]);
  const evaluation = useMemo(() => evaluate(features, envelope), [features, envelope]);

  return {
    businessId,
    data: features,
    envelope,
    evaluation,
    isLoading: ref.isLoading,
    refetch: ref.refetch,
  };
}

export function useEntitlementEvaluation(): EntitlementEvaluation {
  const { evaluation } = useEntitlements();
  return evaluation;
}

export function useHasFeature(key: FeatureKey): boolean {
  const { data, evaluation } = useEntitlements();
  if (!evaluation.entitled || !data) return false;
  const val = data[key];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val > 0;
  return Boolean(val);
}

export function useFeatureLimit(key: FeatureKey): number | null {
  const { data, evaluation } = useEntitlements();
  if (!evaluation.entitled || !data) return 0;
  const val = data[key];
  return typeof val === "number" ? val : 0;
}
