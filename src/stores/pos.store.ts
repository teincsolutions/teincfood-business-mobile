/**
 * POS cart store — delegates to @teincfood/core cart store (device-local, offline).
 * Supports `usePOSStore()` and `usePOSStore(s => s.items)` selector forms.
 */
import { useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  subscribeCart,
  addItem as coreAddItem,
  removeItem as coreRemoveItem,
  updateQuantity as coreUpdateQuantity,
  updateCheckoutForm as coreUpdateForm,
  clearCart as coreClearCart,
  clearAll as coreClearAll,
  hydrateCartStore,
} from "@teincfood/core";
import type { MenuItem, MenuItemVariantResponse, MenuItemAddonResponse } from "@/types/api/menu.api";
import type { POSCheckoutForm } from "@/types/pos.types";

let hydrated = false;
function ensureHydrated() {
  if (!hydrated) {
    hydrated = true;
    void hydrateCartStore();
  }
}

type POSState = {
  items: ReturnType<typeof getCartSnapshot>["items"];
  checkoutForm: ReturnType<typeof getCartSnapshot>["checkoutForm"];
  addItem: (menuItem: MenuItem, quantity: number, variant: MenuItemVariantResponse | null, addons: MenuItemAddonResponse[]) => void;
  removeItem: typeof coreRemoveItem;
  updateQuantity: typeof coreUpdateQuantity;
  updateCheckoutForm: typeof coreUpdateForm;
  clearCart: typeof coreClearCart;
  clearAll: typeof coreClearAll;
};

function buildState(): POSState {
  const s = getCartSnapshot();
  return {
    items: Array.isArray(s.items) ? s.items : [],
    checkoutForm: s.checkoutForm,
    addItem: (menuItem: MenuItem, quantity: number, variant: MenuItemVariantResponse | null, addons: MenuItemAddonResponse[]) =>
      coreAddItem(menuItem as unknown as Parameters<typeof coreAddItem>[0], quantity, variant as unknown as Parameters<typeof coreAddItem>[2], addons as unknown as Parameters<typeof coreAddItem>[3]),
    removeItem: coreRemoveItem,
    updateQuantity: coreUpdateQuantity,
    updateCheckoutForm: coreUpdateForm,
    clearCart: coreClearCart,
    clearAll: coreClearAll,
  };
}

export function usePOSStore(): POSState;
export function usePOSStore<T>(selector: (s: POSState) => T): T;
export function usePOSStore<T>(selector?: (s: POSState) => T): T | POSState {
  ensureHydrated();
  const snap = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartSnapshot);
  const state: POSState = {
    items: Array.isArray(snap.items) ? snap.items : [],
    checkoutForm: snap.checkoutForm,
    addItem: (menuItem: MenuItem, quantity: number, variant: MenuItemVariantResponse | null, addons: MenuItemAddonResponse[]) =>
      coreAddItem(menuItem as unknown as Parameters<typeof coreAddItem>[0], quantity, variant as unknown as Parameters<typeof coreAddItem>[2], addons as unknown as Parameters<typeof coreAddItem>[3]),
    removeItem: coreRemoveItem,
    updateQuantity: coreUpdateQuantity,
    updateCheckoutForm: coreUpdateForm,
    clearCart: coreClearCart,
    clearAll: coreClearAll,
  };
  return selector ? selector(state) : state;
}

(usePOSStore as unknown as { getState: () => POSState }).getState = buildState;
(usePOSStore as unknown as { subscribe: typeof subscribeCart }).subscribe = subscribeCart;
