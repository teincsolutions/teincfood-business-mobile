import {
  clearDebugLogs,
  localNodeService,
  phoenixSocket,
  setAccountScope,
  switchAccountScope,
} from "@teincfood/core";
import { queryClient } from "@/providers/QueryProvider";
import {
  clearPersistedQueryCacheFor,
  getActiveAccountId,
  setActiveAccountId,
  suspendPersistence,
  suspendPersistenceAsync,
} from "@/utils/storage";
import { resetChatClient } from "@/utils/chat-service";
import { useAddressStore } from "@/stores/address.store";
import { useBusinessStore } from "@/stores/business.store";
import { useCartStore } from "@/stores/cart.store";
import { useCustomerDisplayStore } from "@/stores/customer-display.store";
import { useDisplayStore } from "@/stores/display.store";
import { useFavoritesStore } from "@/stores/favorites.store";
import { useFleetStore } from "@/stores/fleet.store";
import { FILTER_DEFAULTS, useFilterStore } from "@/stores/filter.store";
import { useKioskStore } from "@/stores/kiosk.store";
import { useLocationStore } from "@/stores/location.store";
import { useNotificationStore } from "@/stores/notification.store";
import { useOfflineAuthStore } from "@/stores/offlineAuth.store";
import { useOfflineSetupStore } from "@/stores/offlineSetup.store";
import { useOrdersStore } from "@/stores/orders.store";
import { usePaymentStore } from "@/stores/payment.store";
import { useRiderNavigationStore } from "@/stores/rider-navigation.store";
import { useRoleStore } from "@/stores/role.store";
import { useSearchStore } from "@/stores/search.store";
import type { Business } from "@/types/business.model";

/**
 * Central account boundary for the Business app.
 *
 * Call `beginAccountScope(user.id)` immediately after a successful login /
 * offline session restore, and `endAccountScope()` on logout. It resets every
 * in-memory user store, switches the core persistence scope (SQLite + offline
 * KV), clears the query cache, and rehydrates the new account's stores.
 *
 * The reset runs with persistence suspended so empty state is never written
 * into the previous account's storage.
 */

type PersistableStore = {
  persist?: { rehydrate?: () => void | Promise<void> };
};

function resetChatAndLan(): void {
  try {
    resetChatClient();
  } catch {}
  try {
    phoenixSocket.disconnect();
  } catch {}
  try {
    void localNodeService.shutdown().catch(() => undefined);
  } catch {}
}

function resetUserStoresInMemory(): void {
  useBusinessStore.getState().clearBusinesses();
  useBusinessStore.setState({ isHydrated: false });
  useFleetStore.getState().clearFleet();
  useFleetStore.setState({ isHydrated: false });
  useOrdersStore.getState().setOrders([]);
  useCartStore.getState().clearCart();
  usePaymentStore.setState({ paymentMethods: [] });
  useAddressStore.getState().setAddresses([]);
  useFavoritesStore.setState({ savedFoodIds: [], savedRestaurantIds: [] });
  useFilterStore.setState({ ...FILTER_DEFAULTS, isHydrated: false });
  useSearchStore.getState().clearSearches();
  useNotificationStore.getState().clearAll();
  useKioskStore.getState().reset();
  useDisplayStore.setState({
    calloutDisplayEnabled: false,
    kitchenDisplayEnabled: false,
    customerDisplayEnabled: false,
  });
  useOfflineAuthStore.setState({
    loading: true,
    hasDevice: false,
    members: [],
    evaluation: null,
    error: null,
    businessId: null,
  });
  useOfflineSetupStore.setState({ skipped: {} });
  clearDebugLogs();
  useCustomerDisplayStore.getState().reset();
  useRiderNavigationStore.getState().clearMapTarget();
  useRiderNavigationStore.getState().clearNavigationTarget();
}

function resetSessionIdentity(): void {
  useRoleStore.getState().clearRole();
  useLocationStore.getState().clearLocation();
}

function rehydrateUserStores(businessOverride?: Business | null): void {
  const stores: unknown[] = [
    useBusinessStore,
    useFleetStore,
    useOrdersStore,
    useCartStore,
    usePaymentStore,
    useAddressStore,
    useFavoritesStore,
    useFilterStore,
    useSearchStore,
    useNotificationStore,
    useKioskStore,
    useDisplayStore,
  ];
  for (const store of stores) {
    try {
      if (store === useBusinessStore && businessOverride) {
        // Offline member sessions are licensed for a specific business that
        // may not be present in that member's persisted business list yet.
        useBusinessStore.setState({
          activeBusiness: businessOverride,
          isHydrated: true,
        });
        continue;
      }
      const persist = (store as PersistableStore).persist;
      if (persist?.rehydrate) void persist.rehydrate();
    } catch {}
  }
  useOfflineSetupStore.getState().reload();
}

function switchCoreScope(accountId: string | null): void {
  void switchAccountScope(accountId).catch(() => undefined);
}

/**
 * Adopt the account that the auth store just restored from disk. Unlike a
 * login this must not wipe/rehydrate anything: the scoped stores were already
 * hydrated using the same persisted account id.
 */
export function adoptPersistedAccountScope(accountId: string | null): void {
  if (getActiveAccountId() !== accountId) {
    setActiveAccountId(accountId);
  }
  // Synchronous: this runs during auth hydration, before the first DB open.
  // switchAccountScope() would only apply on a microtask, allowing an early
  // open of the anonymous/previous database.
  setAccountScope(accountId);
}

/** Switch to a newly authenticated account. */
let scopeTransition = 0;

export function beginAccountScope(
  accountId: string,
  options?: { business?: Business | null },
): boolean {
  const previous = getActiveAccountId();
  if (previous === accountId) return false;

  const transition = ++scopeTransition;
  // Stop old realtime/LAN clients before the storage scope changes so they
  // cannot receive or persist another account's traffic.
  resetChatAndLan();

  void suspendPersistenceAsync(async () => {
    suspendPersistence(() => {
      resetUserStoresInMemory();
    });

    clearPersistedQueryCacheFor(previous);
    await queryClient.cancelQueries();
    queryClient.clear();
    // Let the old LAN node finish tearing down before the new scope opens.
    await localNodeService.shutdown().catch(() => undefined);
    setActiveAccountId(accountId);
    // Rehydrate only after core has closed the previous account's SQLite
    // handle and applied the new scope. Persistence stays blocked throughout
    // so an in-flight request from the old session cannot write into the new
    // account's keys during the gap.
    await switchAccountScope(accountId).catch(() => undefined);
  }).then(() => {
    if (transition !== scopeTransition) return;
    if (getActiveAccountId() !== accountId) return;
    rehydrateUserStores(options?.business);
  });
  return true;
}

/** Clear the active account and all in-memory user state. */
export function endAccountScope(): void {
  const previous = getActiveAccountId();
  scopeTransition++;
  resetChatAndLan();

  suspendPersistence(() => {
    resetUserStoresInMemory();
  });
  resetSessionIdentity();

  clearPersistedQueryCacheFor(previous);
  queryClient.clear();
  setActiveAccountId(null);
  switchCoreScope(null);
}
