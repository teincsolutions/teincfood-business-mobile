/**
 * POS cart store — delegates to @teincfood/core cart store (device-local, offline).
 * Keeps `usePOSStore` hook name for UI compatibility.
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

export function usePOSStore() {
  ensureHydrated();
  const state = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartSnapshot);
  return {
    items: state.items,
    checkoutForm: state.checkoutForm,
    addItem: (menuItem: MenuItem, quantity: number, variant: MenuItemVariantResponse | null, addons: MenuItemAddonResponse[]) =>
      coreAddItem(menuItem as unknown as Parameters<typeof coreAddItem>[0], quantity, variant as unknown as Parameters<typeof coreAddItem>[2], addons as unknown as Parameters<typeof coreAddItem>[3]),
    removeItem: coreRemoveItem,
    updateQuantity: coreUpdateQuantity,
    updateCheckoutForm: coreUpdateForm,
    clearCart: coreClearCart,
    clearAll: coreClearAll,
  };
}

// getState for non-hook call sites (rare)
(usePOSStore as unknown as { getState: typeof getCartSnapshot }).getState = getCartSnapshot;
