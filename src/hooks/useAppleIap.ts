import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner-native";

import { verifyAppleSubscription } from "@/services/subscription.service";
import type { SubscriptionPlan } from "@/services/subscription.service";
import {
  buySubscription,
  completePurchase,
  fetchSubscriptionProducts,
  IapErrorCode,
  onPurchaseError,
  onPurchaseUpdated,
  openManageSubscriptions,
  restoreStorePurchases,
  supportsStoreBilling,
  type IapPurchase,
} from "@/services/iap.service";

export type BillingCycle = "month" | "year";

export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return (plan.monthly_fee_minor || 0) > 0 || (plan.yearly_fee_minor || 0) > 0;
}

export function storeProductId(
  plan: SubscriptionPlan,
  cycle: BillingCycle,
): string | null {
  const id =
    cycle === "year"
      ? plan.apple_product_id_yearly
      : plan.apple_product_id_monthly;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Loads localized StoreKit prices so the app shows the App Store price (which
 * may differ from the backend GHS amount) as required by App Review.
 */
export function useStorePrices(plans: SubscriptionPlan[]) {
  const [prices, setPrices] = useState<Record<string, string>>({});

  const skuKey = useMemo(
    () =>
      plans
        .flatMap((plan) => [
          plan.apple_product_id_monthly,
          plan.apple_product_id_yearly,
        ])
        .filter(
          (sku): sku is string => typeof sku === "string" && sku.length > 0,
        )
        .sort()
        .join("|"),
    [plans],
  );

  useEffect(() => {
    if (!supportsStoreBilling() || !skuKey) return;
    let cancelled = false;

    void (async () => {
      try {
        const products = await fetchSubscriptionProducts(skuKey.split("|"));
        if (cancelled) return;
        setPrices(
          Object.fromEntries(
            products.map((product) => [product.id, product.displayPrice]),
          ),
        );
      } catch {
        // Store prices are a display upgrade; the backend price is a safe
        // fallback and checkout still goes through StoreKit.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skuKey]);

  return prices;
}

interface PurchaseOptions {
  businessId?: string;
  plans: SubscriptionPlan[];
  onActivated: () => void;
}

/**
 * Drives the StoreKit purchase lifecycle:
 * request -> backend verification -> grant -> finishTransaction.
 *
 * A purchase is only finished after the backend verifies it, so a failed
 * verification can be retried instead of losing the transaction.
 */
export function useAppleSubscriptionPurchase({
  businessId,
  plans,
  onActivated,
}: PurchaseOptions) {
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pendingRef = useRef<{ planId: string; sku: string } | null>(null);
  const plansRef = useRef(plans);
  const businessRef = useRef(businessId);
  const activatedRef = useRef(onActivated);

  plansRef.current = plans;
  businessRef.current = businessId;
  activatedRef.current = onActivated;

  const planForProduct = useCallback((productId?: string | null) => {
    if (!productId) return null;
    return (
      plansRef.current.find(
        (plan) =>
          plan.apple_product_id_monthly === productId ||
          plan.apple_product_id_yearly === productId,
      ) ?? null
    );
  }, []);

  const grant = useCallback(
    async (purchase: IapPurchase): Promise<boolean> => {
      const currentBusinessId = businessRef.current;
      const signedTransaction = purchase.purchaseToken;
      if (!currentBusinessId || !signedTransaction) return false;

      const pending = pendingRef.current;
      const plan =
        (pending?.planId
          ? plansRef.current.find((item) => item.id === pending.planId)
          : null) ?? planForProduct(purchase.productId);

      // Not one of our subscription products (for example a future add-on).
      if (!plan) return false;

      setBusy(true);
      try {
        await verifyAppleSubscription(currentBusinessId, {
          signed_transaction: signedTransaction,
          plan_id: plan.id,
        });
        await completePurchase(purchase);
        pendingRef.current = null;
        setPendingPlanId(null);
        activatedRef.current();
        toast.success(`${plan.name} is active`);
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "We could not verify the App Store purchase",
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [planForProduct],
  );

  useEffect(() => {
    if (!supportsStoreBilling()) return;

    const removeUpdate = onPurchaseUpdated((purchase) => {
      void grant(purchase);
    });

    const removeError = onPurchaseError((error) => {
      if (error.code === IapErrorCode.UserCancelled) {
        pendingRef.current = null;
        setPendingPlanId(null);
        return;
      }
      toast.error(error.message || "The App Store purchase failed");
    });

    return () => {
      removeUpdate();
      removeError();
    };
  }, [grant]);

  const purchase = useCallback(
    (plan: SubscriptionPlan, cycle: BillingCycle) => {
      if (!supportsStoreBilling()) return;

      const sku = storeProductId(plan, cycle);
      if (!sku) {
        toast.error("This plan is not available for in-app purchase yet.");
        return;
      }

      pendingRef.current = { planId: plan.id, sku };
      setPendingPlanId(plan.id);

      void buySubscription(sku).catch((error: unknown) => {
        pendingRef.current = null;
        setPendingPlanId(null);
        toast.error(
          error instanceof Error
            ? error.message
            : "The App Store purchase failed",
        );
      });
    },
    [],
  );

  const restore = useCallback(async () => {
    setBusy(true);
    try {
      const purchases = await restoreStorePurchases();
      if (purchases.length === 0) {
        toast("No App Store purchases to restore");
        return;
      }
      for (const purchase of purchases) {
        await grant(purchase);
      }
    } catch {
      toast.error("Could not restore App Store purchases");
    } finally {
      setBusy(false);
    }
  }, [grant]);

  return {
    purchase,
    restore,
    manage: openManageSubscriptions,
    pendingPlanId,
    busy,
  };
}
