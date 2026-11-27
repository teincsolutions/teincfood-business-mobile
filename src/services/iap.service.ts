import { Platform } from "react-native";
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  showManageSubscriptionsIOS,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";

export { ErrorCode as IapErrorCode };
export type { ProductSubscription as IapProduct, Purchase as IapPurchase };

let connected = false;

/** StoreKit billing is iOS-only for now; Android still uses mobile money. */
export function supportsStoreBilling(): boolean {
  return Platform.OS === "ios";
}

export async function ensureIapConnected(): Promise<boolean> {
  if (connected) return true;
  connected = await initConnection();
  return connected;
}

export async function fetchSubscriptionProducts(
  skus: string[],
): Promise<ProductSubscription[]> {
  const unique = Array.from(new Set(skus.filter(Boolean)));
  if (unique.length === 0) return [];
  await ensureIapConnected();
  const products = await fetchProducts({ skus: unique, type: "subs" });
  return (products ?? []) as ProductSubscription[];
}

export async function buySubscription(sku: string): Promise<void> {
  await ensureIapConnected();
  await requestPurchase({
    request: {
      apple: { sku },
      google: { skus: [sku] },
    },
    type: "subs",
  });
}

/**
 * Finishes the StoreKit transaction. Only call this after the backend has
 * verified and granted the plan, otherwise a failed grant would be lost.
 */
export async function completePurchase(purchase: Purchase): Promise<void> {
  await finishTransaction({ purchase, isConsumable: false });
}

export async function restoreStorePurchases(): Promise<Purchase[]> {
  if (!supportsStoreBilling()) return [];
  await ensureIapConnected();
  await restorePurchases();
  return (await getAvailablePurchases()) ?? [];
}

export async function openManageSubscriptions(): Promise<void> {
  if (Platform.OS === "ios") {
    await showManageSubscriptionsIOS();
  }
}

export function onPurchaseUpdated(handler: (purchase: Purchase) => void) {
  const subscription = purchaseUpdatedListener(handler);
  return () => subscription.remove();
}

export type IapPurchaseError = { code?: string; message: string };

export function onPurchaseError(handler: (error: IapPurchaseError) => void) {
  // expo-iap declares the listener error with a stricter (non-optional) code
  // than the value it actually delivers, so narrow it here once.
  const subscribe = purchaseErrorListener as unknown as (
    listener: (error: IapPurchaseError) => void,
  ) => { remove: () => void };

  const subscription = subscribe(handler);
  return () => subscription.remove();
}
