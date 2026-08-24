/**
 * TeincFood Core bootstrap — injects platform adapters once at startup.
 *
 * Must be imported before any `openSyncDatabase()` / SyncEngine usage.
 * Idempotent: double calls are no-ops.
 */

import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { MMKV } from "react-native-mmkv";
import { createTeincCore } from "@teincfood/core";
import type { SqliteDriver } from "@teincfood/core";
import type { KVDriver } from "@teincfood/core";
import type { HttpClient } from "@teincfood/core";
import { setConnectivityState } from "@teincfood/core";
import { setAppInstanceId } from "@teincfood/core";

// Services to wire into core stubs
import * as posSrv from "@/services/pos.service";
import * as sellerSrv from "@/services/seller.service";
import * as kioskSrv from "@/services/kiosk.service";
import * as menuSrv from "@/services/menu.service";
import * as businessSrv from "@/services/business.service";
import * as rolesSrv from "@/services/roles.service";
import { getAppInstanceId as getBusinessAppInstanceId } from "@/services/devices.service";
import { api } from "@/services/api";
import { useConnectivityStore } from "@/stores/connectivity.store";
import * as businessImageCache from "@/reference/image-cache";
import {
  posService as corePosService,
  sellerService as coreSellerService,
  kioskService as coreKioskService,
  menuService as coreMenuService,
  businessService as coreBusinessService,
  rolesService as coreRolesService,
} from "@teincfood/core/dist/adapters/services.js";
import * as coreImageCache from "@teincfood/core/dist/adapters/image-cache.js";

let bootstrapped = false;

function buildSqliteDriver(): SqliteDriver {
  let dbPromise: Promise<SQLiteDatabase> | null = null;

  function getDb(): Promise<SQLiteDatabase> {
    if (!dbPromise) {
      dbPromise = openDatabaseAsync("teincfood_sync.db");
    }
    return dbPromise;
  }

  return {
    execAsync: async (sql: string, ...args: unknown[]) => {
      const db = await getDb();
      // expo-sqlite execAsync takes (sql) only; variadic args are for runAsync.
      // Delegate to driver's exec semantics: first arg is sql, rest are params.
      // For compat, pass through directly.
      // @ts-ignore expo types vary
      return (db as unknown as { execAsync: (...a: unknown[]) => Promise<void> }).execAsync(sql, ...args);
    },
    runAsync: async (sql: string, ...args: unknown[]) => {
      const db = await getDb();
      const result = await db.runAsync(sql, ...(args as never[]));
      return result as unknown as { lastInsertRowId: number; changes: number };
    },
    getFirstAsync: async <T>(sql: string, ...args: unknown[]) => {
      const db = await getDb();
      return db.getFirstAsync(sql, ...(args as never[])) as Promise<T | null>;
    },
    getAllAsync: async <T>(sql: string, ...args: unknown[]) => {
      const db = await getDb();
      return db.getAllAsync(sql, ...(args as never[])) as Promise<T[]>;
    },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      const db = await getDb();
      return db.withTransactionAsync(fn);
    },
    closeAsync: async () => {
      const db = await getDb();
      return db.closeAsync();
    },
  };
}

function buildKVDriver(): KVDriver {
  const mmkv = new MMKV();
  return {
    getItem: (key: string) => {
      const v = mmkv.getString(key);
      return v ?? null;
    },
    setItem: (key: string, value: string) => {
      mmkv.set(key, value);
    },
    removeItem: (key: string) => {
      mmkv.delete(key);
    },
  };
}

function buildHttpClient(): HttpClient {
  // Business `api` returns unwrapped data (axios interceptor returns response.data).
  // Core HttpClient expects { data: T }. Wrap to preserve contract.
  return {
    get: async <T>(url: string, config?: unknown) => {
      const data = await (api.get as unknown as (u: string, c?: unknown) => Promise<T>)(url, config);
      return { data };
    },
    post: async <T>(url: string, body?: unknown, config?: unknown) => {
      const data = await (api.post as unknown as (u: string, b?: unknown, c?: unknown) => Promise<T>)(url, body, config);
      return { data };
    },
    put: async <T>(url: string, body?: unknown, config?: unknown) => {
      const data = await (api.put as unknown as (u: string, b?: unknown, c?: unknown) => Promise<T>)(url, body, config);
      return { data };
    },
    patch: async <T>(url: string, body?: unknown, config?: unknown) => {
      const data = await (api.patch as unknown as (u: string, b?: unknown, c?: unknown) => Promise<T>)(url, body, config);
      return { data };
    },
    delete: async <T>(url: string, config?: unknown) => {
      const data = await (api.delete as unknown as (u: string, c?: unknown) => Promise<T>)(url, config);
      return { data };
    },
  };
}

function wireServiceAdapters(): void {
  // Mutate core's stub singletons so REST transport + reference fallback hit
  // the real Business services. Property assignment keeps the original object
  // identity that transports already captured.
  try {
    Object.assign(corePosService as Record<string, unknown>, {
      createPOSOrder: posSrv.createPOSOrder,
      fetchPOSOrderPreview: posSrv.fetchPOSOrderPreview,
      fetchBusinessOrders: posSrv.fetchBusinessOrders,
    });

    Object.assign(coreSellerService as Record<string, unknown>, {
      acceptOrder: sellerSrv.acceptOrder,
      rejectOrder: sellerSrv.rejectOrder,
      startPreparingOrder: sellerSrv.startPreparingOrder,
      markOrderReady: sellerSrv.markOrderReady,
      completeOrderPickup: sellerSrv.completeOrderPickup,
      cancelOrder: sellerSrv.cancelOrder,
      confirmHandover: sellerSrv.confirmHandover,
    });

    Object.assign(coreKioskService as Record<string, unknown>, {
      assignKioskOrderToRider: kioskSrv.assignKioskOrderToRider,
    });

    Object.assign(coreMenuService as Record<string, unknown>, {
      fetchBusinessMenuItems: menuSrv.fetchBusinessMenuItems,
      fetchBusinessCategories: menuSrv.fetchBusinessCategories,
    });

    Object.assign(coreBusinessService as Record<string, unknown>, {
      fetchBusinessMembers: businessSrv.fetchBusinessMembers,
      fetchBusinessTaxRules: businessSrv.fetchBusinessTaxRules,
      fetchBusinessById: businessSrv.fetchBusinessById,
      fetchOperatingHours: businessSrv.fetchOperatingHours,
    });

    Object.assign(coreRolesService as Record<string, unknown>, {
      fetchBusinessRoles: rolesSrv.fetchBusinessRoles,
    });
  } catch {
    // If core services shim changes shape, non-fatal — REST fallback will throw helpfully.
  }

  // Image cache — wire Business implementation so reference sync caches images.
  try {
    const patch: Record<string, unknown> = {};
    if ((businessImageCache as unknown as { cacheImageBatch?: unknown }).cacheImageBatch) {
      patch.cacheImageBatch = (businessImageCache as unknown as { cacheImageBatch: unknown }).cacheImageBatch;
    }
    if ((businessImageCache as unknown as { pruneImageCache?: unknown }).pruneImageCache) {
      patch.pruneImageCache = (businessImageCache as unknown as { pruneImageCache: unknown }).pruneImageCache;
    }
    if (Object.keys(patch).length) Object.assign(coreImageCache as Record<string, unknown>, patch);
  } catch {
    // optional — stub remains
  }
}

function syncConnectivityBridge(): void {
  const state = useConnectivityStore.getState();
  setConnectivityState({
    isOnline: state.isOnline,
    isCloudReachable: state.isCloudReachable,
  });

  // Keep core connectivity in sync with Zustand store (outside React).
   
  type Unsubscribe = () => void;
  const subscribe = (useConnectivityStore as unknown as { subscribe: (fn: (s: { isOnline: boolean; isCloudReachable: "reachable" | "unreachable" | "unknown" }) => void) => Unsubscribe }).subscribe;
  if (typeof subscribe === "function") {
    subscribe((s) => {
      setConnectivityState({
        isOnline: s.isOnline,
        isCloudReachable: s.isCloudReachable,
      });
    });
  } else {
    // Fallback: zustand v4 subscribe with selector pattern
    const store = useConnectivityStore as unknown as { subscribe: (listener: (state: unknown, prev: unknown) => void) => Unsubscribe };
    if (typeof store.subscribe === "function") {
      try {
        (store.subscribe as unknown as (fn: (state: { isOnline: boolean; isCloudReachable: string }) => void) => Unsubscribe)((s) => {
          setConnectivityState({
            isOnline: (s as { isOnline: boolean }).isOnline,
            isCloudReachable: (s as { isCloudReachable: "reachable" | "unreachable" | "unknown" }).isCloudReachable as "reachable" | "unreachable" | "unknown",
          });
        });
      } catch {
        // ignore
      }
    }
  }
}

export function bootstrapCore(): ReturnType<typeof createTeincCore> | null {
  if (bootstrapped) return null;
  try {
    const sqliteDriver = buildSqliteDriver();
    const kvDriver = buildKVDriver();
    const httpClient = buildHttpClient();

    const initialConnectivity = (() => {
      try {
        const s = useConnectivityStore.getState();
        return {
          isOnline: s.isOnline,
          isCloudReachable: s.isCloudReachable,
        };
      } catch {
        return undefined;
      }
    })();

    wireServiceAdapters();

    // Seed core device id from Business storage
    try {
      const deviceId = getBusinessAppInstanceId();
      setAppInstanceId(deviceId);
    } catch {
      // ignore
    }

    const result = createTeincCore({
      sqliteDriver,
      kvDriver,
      httpClient,
      initialConnectivity,
    });

    // Bridge future connectivity changes into core
    try {
      syncConnectivityBridge();
    } catch {
      // ignore
    }

    bootstrapped = true;
    return result;
  } catch (e) {
    console.error("[bootstrapCore] failed", e);
    return null;
  }
}

export function isCoreBootstrapped(): boolean {
  return bootstrapped;
}
