/**
 * TeincFood Core bootstrap — injects platform adapters once at startup.
 *
 * Env vars are owned by the APP (src/utils/constants.ts from .env) and passed
 * to core live via createTeincCore({ apiBaseUrl, wsBaseUrl }). Core never reads
 * process.env / import.meta.env itself.
 *
 * ensureCoreBootstrap() is idempotent and safe to call from anywhere (it is
 * invoked by src/db/connection.ts at import time so the app's existing
 * openSyncDatabase() call sites run against an already-bootstrapped core).
 */
import { openDatabaseAsync } from "expo-sqlite";
import { MMKV } from "react-native-mmkv";
import { createTeincCore } from "@teincfood/core";
import type { SqliteDriver } from "@teincfood/core";
import type { KVDriver } from "@teincfood/core";
import type { HttpClient } from "@teincfood/core";
import { setConnectivityState } from "@teincfood/core";
import { setAppInstanceId } from "@teincfood/core";
import { setReferenceLocalNodeFetcher } from "@teincfood/core";
import { localNodeService } from "@/local-node/service";
import type { ReferenceLocalNodeFetcher } from "@teincfood/core";
import {
  posService as corePosService,
  sellerService as coreSellerService,
  kioskService as coreKioskService,
  menuService as coreMenuService,
  businessService as coreBusinessService,
  rolesService as coreRolesService,
  imageCacheService as coreImageCache,
} from "@teincfood/core";
import { API_BASE_URL, WS_BASE_URL } from "@/utils/constants";
import { api } from "@/services/api";
import { getAppInstanceId } from "@/services/devices.service";
import { useConnectivityStore } from "@/stores/connectivity.store";
import * as posSrv from "@/services/pos.service";
import * as sellerSrv from "@/services/seller.service";
import * as kioskSrv from "@/services/kiosk.service";
import * as menuSrv from "@/services/menu.service";
import * as businessSrv from "@/services/business.service";
import * as rolesSrv from "@/services/roles.service";
import * as desktopImageCache from "@/reference/image-cache";
import type { SQLiteDatabase } from "expo-sqlite";

let bootstrapped = false;

function buildSqliteDriver(): SqliteDriver {
  let dbPromise: Promise<SQLiteDatabase> | null = null;
  function getDb(): Promise<SQLiteDatabase> {
    if (!dbPromise) dbPromise = openDatabaseAsync("teincfood_sync.db");
    return dbPromise;
  }
  return {
    execAsync: async (sql: string, ...args: unknown[]) => {
      const db = await getDb();
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
    getItem: (key: string) => mmkv.getString(key) ?? null,
    setItem: (key: string, value: string) => {
      mmkv.set(key, value);
    },
    removeItem: (key: string) => {
      mmkv.delete(key);
    },
  };
}

function buildHttpClient(): HttpClient {
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
      createMenuItem: menuSrv.createBusinessMenuItem,
      updateMenuItem: menuSrv.updateMenuItem,
      deleteMenuItem: menuSrv.deleteMenuItem,
      createCategory: menuSrv.createBusinessCategory,
    });
    Object.assign(coreBusinessService as Record<string, unknown>, {
      fetchBusinessMembers: businessSrv.fetchBusinessMembers,
      fetchBusinessTaxRules: businessSrv.fetchBusinessTaxRules,
      fetchBusinessById: businessSrv.fetchBusinessById,
      fetchOperatingHours: businessSrv.fetchOperatingHours,
      fetchMyBusinessMembership: businessSrv.fetchMyBusinessMembership,
    });
    Object.assign(coreRolesService as Record<string, unknown>, {
      fetchBusinessRoles: rolesSrv.fetchBusinessRoles,
    });
  } catch {}
  try {
    const patch: Record<string, unknown> = {};
    if ((desktopImageCache as unknown as { cacheImageBatch?: unknown }).cacheImageBatch) {
      patch.cacheImageBatch = (desktopImageCache as unknown as { cacheImageBatch: unknown }).cacheImageBatch;
    }
    if ((desktopImageCache as unknown as { pruneImageCache?: unknown }).pruneImageCache) {
      patch.pruneImageCache = (desktopImageCache as unknown as { pruneImageCache: unknown }).pruneImageCache;
    }
    if (Object.keys(patch).length) Object.assign(coreImageCache as Record<string, unknown>, patch);
  } catch {}
}

function syncConnectivityBridge(): void {
  try {
    const state = useConnectivityStore.getState();
    setConnectivityState({ isOnline: state.isOnline, isCloudReachable: state.isCloudReachable });
    const subscribe = (useConnectivityStore as unknown as {
      subscribe: (fn: (s: { isOnline: boolean; isCloudReachable: "reachable" | "unreachable" | "unknown" }) => void) => () => void;
    }).subscribe;
    if (typeof subscribe === "function") {
      subscribe((s) =>
        setConnectivityState({ isOnline: s.isOnline, isCloudReachable: s.isCloudReachable }),
      );
    }
  } catch {}
}

export function bootstrapCore(): ReturnType<typeof createTeincCore> | null {
  if (bootstrapped) return null;
  try {
    console.debug("[bootstrapCore] env (app-owned)", { API_BASE_URL, WS_BASE_URL });
    const sqliteDriver = buildSqliteDriver();
    const kvDriver = buildKVDriver();
    const httpClient = buildHttpClient();
    const initialConnectivity = (() => {
      try {
        const s = useConnectivityStore.getState();
        return { isOnline: s.isOnline, isCloudReachable: s.isCloudReachable };
      } catch {
        return undefined;
      }
    })();
    wireServiceAdapters();
    try {
      const deviceId = getAppInstanceId();
      if (deviceId) setAppInstanceId(deviceId);
    } catch {}
    // When this terminal is a LAN client of a Local Node and the cloud is
    // unreachable, serve cached reference data from the node so menus/tax-rules
    // stay in sync on a fully dark LAN.
    try {
      const fetcher: ReferenceLocalNodeFetcher = async ({ businessId, keys }) => {
        const client = localNodeService.getClient();
        if (!client) return {};
        const result = await client.requestReferenceData(businessId, keys);
        return result.data;
      };
      setReferenceLocalNodeFetcher(fetcher);
    } catch {}
    const result = createTeincCore({
      sqliteDriver,
      kvDriver,
      httpClient,
      apiBaseUrl: API_BASE_URL,
      wsBaseUrl: WS_BASE_URL,
      initialConnectivity,
    });
    try {
      syncConnectivityBridge();
    } catch {}
    // 0.7.0: auto-lease device number per business (DD 01-99) for offline DD-RRR-CCC
    try {
      const ensureLeaseForBusiness = (bid: string | null | undefined) => {
        if (!bid) return;
        import("@teincfood/core").then((m) => (m as any).ensureDeviceLease?.(bid).catch(() => {})).catch(() => {});
      };
      try {
        const { useBusinessStore } = require("@/stores/business.store");
        const currentId: string | null = useBusinessStore.getState().activeBusiness?.id ?? null;
        if (currentId) ensureLeaseForBusiness(currentId);
        // subscribe to activeBusiness changes (covers setActiveBusiness + setBusinesses auto-select)
        try {
          useBusinessStore.subscribe((s: any, prev: any) => {
            const id: string | undefined = s?.activeBusiness?.id;
            const prevId: string | undefined = prev?.activeBusiness?.id;
            if (id && id !== prevId) ensureLeaseForBusiness(id);
          });
        } catch {}
      } catch {}
    } catch {}
    bootstrapped = true;
    console.debug("[bootstrapCore] core created (live injection)", {
      apiBaseUrl: API_BASE_URL,
      wsBaseUrl: WS_BASE_URL,
      hasResult: !!result,
    });
    return result;
  } catch (e) {
    console.error("[bootstrapCore] failed", e);
    return null;
  }
}

export function ensureCoreBootstrap(): void {
  bootstrapCore();
}

export function isCoreBootstrapped(): boolean {
  return bootstrapped;
}