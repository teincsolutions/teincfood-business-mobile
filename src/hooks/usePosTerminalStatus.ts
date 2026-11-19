import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ensureLease,
  getDeviceNumber,
  getLastLeaseFailure,
  type DeviceLeaseFailure,
} from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import { useEntitlements, useHasFeature } from "@/hooks/useEntitlements";

export type PosTerminalBlockReason =
  | "terminal_limit"
  | "missing_lease"
  | "subscription"
  | "pos_not_included"
  | null;

export interface PosTerminalStatus {
  deviceNumber: string | null;
  failure: DeviceLeaseFailure | null;
  checking: boolean;
  blocked: boolean;
  reason: PosTerminalBlockReason;
  title: string;
  message: string;
  shortLabel: string;
  retry: () => Promise<string | null>;
}

/**
 * Preflight for POS order creation.
 *
 * The backend/local order service requires both a leased terminal number
 * (DD 02-99) and the `seller.pos.terminal` entitlement. Checkout should show
 * this before the teller enters payment details instead of failing after the
 * sale is rung up.
 */
export function usePosTerminalStatus(): PosTerminalStatus {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const entitlements = useEntitlements();
  const hasPosFeature = useHasFeature("seller.pos.terminal");
  const [deviceNumber, setDeviceNumber] = useState<string | null>(null);
  const [failure, setFailure] = useState<DeviceLeaseFailure | null>(null);
  const [checking, setChecking] = useState(false);

  const retry = useCallback(async () => {
    if (!businessId) {
      setDeviceNumber(null);
      setFailure(null);
      return null;
    }
    const cached = getDeviceNumber(businessId);
    if (cached) {
      setDeviceNumber(cached);
      setFailure(null);
      return cached;
    }
    setChecking(true);
    try {
      const leased = await ensureLease(businessId);
      setDeviceNumber(leased);
      setFailure(getLastLeaseFailure(businessId));
      return leased;
    } finally {
      setChecking(false);
    }
  }, [businessId]);

  useFocusEffect(
    useCallback(() => {
      void retry();
    }, [retry]),
  );

  const terminalLimit =
    failure?.code === "TERMINAL_LIMIT_REACHED" ||
    failure?.code === "DEVICE_LIMIT_REACHED";
  const missingLease = !deviceNumber && !checking;
  const entitlementsResolved =
    !entitlements.isLoading && entitlements.evaluation.state !== "loading";
  const subscriptionBlocked =
    entitlementsResolved && !entitlements.evaluation.entitled;
  const posNotIncluded =
    entitlementsResolved && entitlements.evaluation.entitled && !hasPosFeature;

  const reason: PosTerminalBlockReason = terminalLimit
    ? "terminal_limit"
    : missingLease
      ? "missing_lease"
      : subscriptionBlocked
        ? "subscription"
        : posNotIncluded
          ? "pos_not_included"
          : null;

  const content =
    reason === "terminal_limit"
      ? {
          title: "Terminal limit reached",
          message:
            "Every terminal slot on this plan is in use. Ask the owner to remove an unused terminal, then retry.",
          shortLabel: "Terminal Limit Reached",
        }
      : reason === "missing_lease"
        ? {
            title: "Terminal not activated",
            message:
              "This device needs a terminal number before it can take orders. Connect to the internet and retry.",
            shortLabel: "Terminal Not Activated",
          }
        : reason === "subscription"
          ? {
              title: "Subscription required",
              message:
                "This business's subscription is not active. Renew or upgrade the plan to create orders.",
              shortLabel: "Subscription Required",
            }
          : reason === "pos_not_included"
            ? {
                title: "POS ordering not included",
                message:
                  "The current plan does not include terminal ordering. Upgrade the plan to continue.",
                shortLabel: "POS Not Included",
              }
            : {
                title: "",
                message: "",
                shortLabel: "",
              };

  return {
    deviceNumber,
    failure,
    checking,
    blocked: reason !== null,
    reason,
    title: content.title,
    message: content.message,
    shortLabel: content.shortLabel,
    retry,
  };
}
