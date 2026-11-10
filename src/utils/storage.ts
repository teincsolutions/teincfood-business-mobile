import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';
import type { Business } from '@/types/business.model';

/**
 * Persistence boundary for the app.
 *
 * There are two kinds of state on a terminal:
 *  - device state (theme, onboarding, selected role/location, biometrics)
 *  - account state (business, orders, cart, payment methods, notifications,
 *    offline setup, chat, query cache)
 *
 * Account state MUST be namespaced by the authenticated user id. A terminal
 * can be used by several accounts over its lifetime, and logout is not a
 * reliable cleanup mechanism (crashes, failed API calls, token expiry, …).
 */
export const mmkvStorage = new MMKV();

/** Zustand key used by the auth store. It is intentionally unscoped. */
const AUTH_PERSIST_KEY = 'user_profile';

/**
 * Device-level pointer to the last business whose offline license was active
 * on this terminal. It lets the pre-auth offline login screen find the right
 * account/business scope to read. The pointer carries the owning account id;
 * online accounts never read it.
 */
export interface OfflineDeviceContext {
  accountId: string;
  business: Business;
  savedAt: string;
}

const OFFLINE_DEVICE_CONTEXT_KEY = 'teincfood.offline.device.v1';

export function getOfflineDeviceContext(): OfflineDeviceContext | null {
  try {
    const raw = mmkvStorage.getString(OFFLINE_DEVICE_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OfflineDeviceContext>;
    if (
      typeof parsed?.accountId !== 'string' ||
      !parsed.accountId ||
      !parsed.business ||
      typeof parsed.business.id !== 'string' ||
      !parsed.business.id
    ) {
      return null;
    }
    return {
      accountId: parsed.accountId,
      business: parsed.business as Business,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
    };
  } catch {
    return null;
  }
}

export function setOfflineDeviceContext(context: {
  accountId: string;
  business: Business;
}): void {
  if (!context.accountId || !context.business?.id) return;
  try {
    mmkvStorage.set(
      OFFLINE_DEVICE_CONTEXT_KEY,
      JSON.stringify({
        accountId: context.accountId,
        business: context.business,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {}
}

export function clearOfflineDeviceContext(): void {
  try {
    mmkvStorage.delete(OFFLINE_DEVICE_CONTEXT_KEY);
  } catch {}
}

/** One-time marker so the legacy cleanup below never deletes root state. */
const LEGACY_MIGRATION_MARKER = 'teincfood.account-scope.v1';

/** Key used by the React Query persister. */
export const QUERY_CACHE_KEY = 'teincfood-query-cache';

/**
 * User-owned stores written by older builds under global keys. Those values
 * cannot be safely attributed to the account that is signed in now (the old
 * logout path left them behind), so they are deleted instead of migrated.
 */
const LEGACY_USER_KEYS = [
  'business_data',
  'fleet_data',
  'Teinc Food Business-role',
  'Teinc Food Business-location',
  'Teinc Food Business-orders',
  'Teinc Food Business-cart',
  'Teinc Food Business-payments',
  'Teinc Food Business-addresses',
  'Teinc Food Business-notifications',
  'Teinc Food Business-kiosk-store',
  'teinc-favorites-storage',
  'teinc-filter-storage',
  'teinc-search-storage',
  'Teinc Food-display-settings',
  'offline_setup_skipped_businesses',
  'push_token_registered',
  'teincfood.pendingImageUploads.v1',
  'push_token_id',
  QUERY_CACHE_KEY,
  // Core-owned user data from the previous unscoped layout.
  'offline:licenses',
  'offline:license',
  'offline:license:public_key',
  'offline:license:key_id',
  'offline:members',
  'Teinc Food-pos-cart',
];

function readPersistedAccountId(): string | null {
  try {
    const raw = mmkvStorage.getString(AUTH_PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { user?: { id?: string } | null } };
    return parsed?.state?.user?.id ?? null;
  } catch {
    return null;
  }
}

let activeAccountId: string | null = readPersistedAccountId();
let persistenceSuspensionDepth = 0;

export function getActiveAccountId(): string | null {
  return activeAccountId;
}

export function setActiveAccountId(accountId: string | null): void {
  activeAccountId = accountId;
}

export function isPersistenceSuspended(): boolean {
  return persistenceSuspensionDepth > 0;
}

/**
 * Run an in-memory reset without writing the empty state back to the previous
 * account's storage. Used while switching scopes.
 */
export function suspendPersistence<T>(fn: () => T): T {
  persistenceSuspensionDepth++;
  try {
    return fn();
  } finally {
    persistenceSuspensionDepth--;
  }
}

/**
 * Keep persistence blocked while an async account transition closes the old
 * database handle and applies the new core scope. Otherwise an in-flight
 * request from the old session can finish in the gap and write its response
 * under the new account's keys.
 */
export async function suspendPersistenceAsync<T>(
  fn: () => Promise<T>,
): Promise<T> {
  persistenceSuspensionDepth++;
  try {
    return await fn();
  } finally {
    persistenceSuspensionDepth--;
  }
}

export function accountScopedKeyFor(accountId: string | null, key: string): string {
  if (!accountId) return key;
  return `acct:${encodeURIComponent(accountId)}:${key}`;
}

export function scopedStorageKey(key: string): string {
  return accountScopedKeyFor(activeAccountId, key);
}

export function getAccountStoragePrefix(accountId: string | null = activeAccountId): string {
  return accountId ? `acct:${encodeURIComponent(accountId)}:` : '';
}

function purgeLegacyUserData(): void {
  if (mmkvStorage.getString(LEGACY_MIGRATION_MARKER) === '1') return;
  for (const key of LEGACY_USER_KEYS) {
    try {
      mmkvStorage.delete(key);
    } catch {
      // Best-effort cleanup; the scoped keys below are still the only ones read.
    }
  }
  // Older chat-client builds wrote `chat:*` globally. The new adapter only
  // reads account-prefixed keys, but remove the old copies too.
  try {
    for (const key of mmkvStorage.getAllKeys()) {
      if (
        key.startsWith('chat:') ||
        key.startsWith('places_') ||
        key.startsWith('directions_polyline_')
      ) {
        mmkvStorage.delete(key);
      }
    }
  } catch {}
  mmkvStorage.set(LEGACY_MIGRATION_MARKER, '1');
}

// Run once, before any persisted Zustand store hydrates.
purgeLegacyUserData();

/**
 * Unscoped storage for device-level state (auth session itself, onboarding,
 * theme, role/location selection, biometrics).
 */
export const rootZustandStorage: StateStorage = {
  // Root state is device/session state and must still be writable while we
  // reset user-owned stores during a logout/account switch.
  setItem: (name, value) => {
    mmkvStorage.set(name, value);
  },
  getItem: (name) => mmkvStorage.getString(name) ?? null,
  removeItem: (name) => mmkvStorage.delete(name),
};

/**
 * Account-scoped Zustand storage. Reads/writes are refused while no account is
 * active, so user data can never be written under a global key before login.
 */
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    if (isPersistenceSuspended() || !activeAccountId) return;
    mmkvStorage.set(scopedStorageKey(name), value);
  },
  getItem: (name) => {
    if (!activeAccountId) return null;
    return mmkvStorage.getString(scopedStorageKey(name)) ?? null;
  },
  removeItem: (name) => {
    if (!activeAccountId) {
      mmkvStorage.delete(name);
      return;
    }
    mmkvStorage.delete(scopedStorageKey(name));
  },
};

/** Direct account-scoped string helpers for non-Zustand stores. */
export const accountStorage = {
  getString(key: string): string | null {
    if (!activeAccountId) return null;
    return mmkvStorage.getString(scopedStorageKey(key)) ?? null;
  },
  set(key: string, value: string): void {
    if (isPersistenceSuspended() || !activeAccountId) return;
    mmkvStorage.set(scopedStorageKey(key), value);
  },
  delete(key: string): void {
    if (!activeAccountId) return;
    mmkvStorage.delete(scopedStorageKey(key));
  },
};

/** Delete every account-scoped key with a prefix (e.g. chat storage). */
export function clearAccountStoragePrefix(prefix: string): void {
  if (!activeAccountId) return;
  const fullPrefix = `${getAccountStoragePrefix()}${prefix}`;
  for (const key of mmkvStorage.getAllKeys()) {
    if (key.startsWith(fullPrefix)) {
      mmkvStorage.delete(key);
    }
  }
}

/** Delete the persisted query cache for an explicit account. */
export function clearPersistedQueryCacheFor(accountId: string | null): void {
  mmkvStorage.delete(accountScopedKeyFor(accountId, QUERY_CACHE_KEY));
}

// ── Legacy generic helpers (device/global callers) ──────────────────────────
// Kept for compatibility with services that persist non-user caches (places,
// directions, observability). User-owned data must use `accountStorage` or a
// scoped Zustand store instead.

export function getItem<T>(key: string): T | null {
  const value = mmkvStorage.getString(key);
  if (value == null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  mmkvStorage.set(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  mmkvStorage.delete(key);
}
