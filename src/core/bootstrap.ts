/**
 * TeincFood Core bootstrap — injects platform adapters once at startup.
 *
 * Env vars are owned by the APP (src/utils/constants.ts from .env) and passed
 * to core live via createTeincCore({ apiBaseUrl, wsBaseUrl }). Core never reads
 * process.env / import.meta.env itself.
 *
 * ensureCoreBootstrap() is idempotent and safe to call from anywhere (it is
 * invoked by the core's openSyncDatabase() at first import so the app's
 * existing call sites run against an already-bootstrapped core).
 */
import { openDatabaseAsync } from "expo-sqlite";
import { mmkvStorage } from "@/utils/storage";
import { createTeincCore } from "@teincfood/core";
import { setEntitlementSecret } from "@teincfood/core";
import { setCompanyInfo } from "@teincfood/core";
import type { SqliteDriver } from "@teincfood/core";
import type { KVDriver } from "@teincfood/core";
import type { HttpClient } from "@teincfood/core";
import { setConnectivityState, getConnectivityState, subscribeConnectivity, setAuthProvider, setAuthRefreshProvider, setAuthTokensProvider, setAuthClearProvider } from "@teincfood/core";
import { initDebugLogCapture } from "@teincfood/core";
import { setAppInstanceId, setDeviceMetadataProvider } from "@teincfood/core";
import { ensureDeviceLease, purgeNonCanonicalMenuCache } from "@teincfood/core";
import { setReferenceLocalNodeFetcher } from "@teincfood/core";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import { localNodeService, initLocalNodeService, localNodeStore } from "@teincfood/core";
import type { ReferenceLocalNodeFetcher } from "@teincfood/core";
import { ZeroconfDiscovery } from "@/local-node/drivers/zeroconf-discovery";
import { TcpTransport } from "@/local-node/drivers/tcp-transport";
import { ExpoKeepAlive } from "@/local-node/drivers/keep-alive";
import {
  posService as corePosService,
  sellerService as coreSellerService,
  kioskService as coreKioskService,
  menuService as coreMenuService,
  businessService as coreBusinessService,
  rolesService as coreRolesService,
  walletService as coreWalletService,
  riderService as coreRiderService,
  fleetService as coreFleetService,
  deliveryService as coreDeliveryService,
  dashboardService as coreDashboardService,
  analyticsService as coreAnalyticsService,
  placesService as corePlacesService,
  imageCacheService as coreImageCache,
} from "@teincfood/core";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { API_BASE_URL, WS_BASE_URL, ENTITLEMENT_HMAC_SECRET, COMPANY_INFO } from "@/utils/constants";
import { api } from "@/services/api";
import { getAppInstanceId } from "@/services/devices.service";
import { logoutAfterSessionFailure } from "@/services/session-lifecycle.service";
import { useConnectivityStore } from "@/stores/connectivity.store";
import * as posSrv from "@/services/pos.service";
import * as sellerSrv from "@/services/seller.service";
import * as kioskSrv from "@/services/kiosk.service";
import * as menuSrv from "@/services/menu.service";
import * as businessSrv from "@/services/business.service";
import * as rolesSrv from "@/services/roles.service";
import * as walletSrv from "@/services/wallet.service";
import * as riderSrv from "@/services/rider.service";
import * as fleetSrv from "@/services/fleet.service";
import * as deliverySrv from "@/services/delivery.service";
import * as dashboardSrv from "@/services/seller-dashboard.service";
import * as analyticsSrv from "@/services/seller-analytics.service";
import * as placesSrv from "@/services/places.service";
import { setNotifyHandlers, setSyncFailureReporter } from "@teincfood/core";
import {
  setOfflineSecureStorage,
  setOfflineRandomBytesProvider,
  setOfflineSessionRecoveryProvider,
  exchangeOfflineSession,
} from "@teincfood/core";
import * as SecureStore from "expo-secure-store";
import { getRandomBytes } from "expo-crypto";
import { toast } from "sonner-native";
import { getObservability } from "@/utils/observability";
import * as desktopImageCache from "@teincfood/core";
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
  return {
    getItem: (key: string) => mmkvStorage.getString(key) ?? null,
    setItem: (key: string, value: string) => { mmkvStorage.set(key, value); },
    removeItem: (key: string) => { mmkvStorage.delete(key); },
  };
}

function buildPrintAdapters() {
  const tcp = {
    sendToTcpPrinter: async (ip: string, port: number, text: string): Promise<void> => {
      const TcpSocket = require("react-native-tcp-socket");
      return new Promise((resolve, reject) => {
        const client = TcpSocket.createConnection({ host: ip, port, timeout: 5000 }, () => {
          client.write(text);
          client.destroy();
          resolve();
        });
        client.on("error", (err: Error) => { client.destroy(); reject(err); });
        client.on("timeout", () => { client.destroy(); reject(new Error("Connection timeout")); });
      });
    },
  };
  const printFile = {
    printToFileAsync: async (html: string) => Print.printToFileAsync({ html }),
    isSharingAvailable: async () => Sharing.isAvailableAsync(),
    shareAsync: async (uri: string, options?: { dialogTitle?: string; mimeType?: string }) => { await Sharing.shareAsync(uri, options as unknown as Parameters<typeof Sharing.shareAsync>[1]); },
  };
  const mdns = {
    discoverPrinters: async (timeoutMs = 8000): Promise<{ name: string; ip: string; port: number }[]> => {
      try {
        const Zeroconf = require("react-native-zeroconf").default ?? require("react-native-zeroconf");
        const zeroconf = new Zeroconf();
        return await new Promise((resolve) => {
          const found = new Map<string, { name: string; ip: string; port: number }>();
          const timer = setTimeout(() => { try { zeroconf.stop(); } catch {} ; resolve([...found.values()]); }, timeoutMs);
          zeroconf.on("resolved", (svc: { name: string; host: string; port: number; addresses?: string[] }) => {
            const ip = svc.addresses?.[0] ?? svc.host;
            if (ip && svc.port) found.set(ip, { name: svc.name, ip, port: svc.port });
          });
          try { zeroconf.scan("_printer._tcp", "tcp", "local."); zeroconf.scan("_ipp._tcp", "tcp", "local."); } catch {}
        });
      } catch { return []; }
    },
  };
  return { tcp, printFile, mdns };
}

function buildFileSystemAdapter() {
  // Web: no-op — core image-cache falls back to remote URL
  if (Platform.OS === "web") return null as unknown as import("@teincfood/core").FileSystemAdapter;
  const docDir = (FileSystem as unknown as { documentDirectory?: string | null }).documentDirectory ?? "";
  return {
    getInfoAsync: async (path: string) => {
      const info = await FileSystem.getInfoAsync(path);
      return { exists: info.exists, isDirectory: (info as { isDirectory?: boolean }).isDirectory };
    },
    makeDirectoryAsync: async (path: string, opts?: { intermediates?: boolean }) => { await FileSystem.makeDirectoryAsync(path, opts); },
    downloadAsync: async (url: string, fileUri: string) => {
      const dl = FileSystem.createDownloadResumable(url, fileUri, { cache: false });
      const res = await dl.downloadAsync();
      return { uri: res?.uri ?? fileUri };
    },
    deleteAsync: async (path: string, opts?: { idempotent?: boolean }) => { await FileSystem.deleteAsync(path, opts); },
    readDirectoryAsync: async (path: string) => FileSystem.readDirectoryAsync(path),
    readAsBase64Async: async (path: string) =>
      FileSystem.readAsStringAsync(path, { encoding: "base64" }),
    writeAsBase64Async: async (path: string, base64: string) => {
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: "base64",
      });
    },
    getDocumentDirectory: () => docDir,
  } as import("@teincfood/core").FileSystemAdapter;
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
      fetchPOSOrderPreview: posSrv.fetchPOSOrderPreview,
      fetchBusinessOrders: posSrv.fetchBusinessOrders,
    });
    Object.assign(coreSellerService as Record<string, unknown>, {
      fetchBusinessOrders: (sellerSrv as unknown as { fetchBusinessOrders?: unknown }).fetchBusinessOrders ?? sellerSrv.fetchBusinessOrders,
      fetchSellerOrder: (sellerSrv as unknown as { fetchSellerOrder?: unknown }).fetchSellerOrder,
      fetchBusinessDeliveries: (sellerSrv as unknown as { fetchBusinessDeliveries?: unknown }).fetchBusinessDeliveries,
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
      updateCategory: menuSrv.updateBusinessCategory,
      deleteCategory: menuSrv.deleteBusinessCategory,
    });
    Object.assign(coreBusinessService as Record<string, unknown>, {
      fetchBusinessMembers: businessSrv.fetchBusinessMembers,
      inviteBusinessMember: (businessSrv as unknown as { inviteBusinessMember?: unknown }).inviteBusinessMember,
      updateBusinessMember: (businessSrv as unknown as { updateBusinessMember?: unknown }).updateBusinessMember,
      removeBusinessMember: (businessSrv as unknown as { removeBusinessMember?: unknown }).removeBusinessMember,
      fetchBusinessMemberInvitations: (businessSrv as unknown as { fetchBusinessMemberInvitations?: unknown }).fetchBusinessMemberInvitations,
      revokeBusinessMemberInvitation: (businessSrv as unknown as { revokeBusinessMemberInvitation?: unknown }).revokeBusinessMemberInvitation,
      deleteBusinessMemberInvitation: (businessSrv as unknown as { deleteBusinessMemberInvitation?: unknown }).deleteBusinessMemberInvitation,
      fetchUserInvitations: (businessSrv as unknown as { fetchUserInvitations?: unknown }).fetchUserInvitations,
      leaveBusiness: (businessSrv as unknown as { leaveBusiness?: unknown }).leaveBusiness,
      acceptBusinessInvitation: (businessSrv as unknown as { acceptBusinessInvitation?: unknown }).acceptBusinessInvitation,
      declineBusinessInvitation: (businessSrv as unknown as { declineBusinessInvitation?: unknown }).declineBusinessInvitation,
      resendBusinessMemberInvitation: (businessSrv as unknown as { resendBusinessMemberInvitation?: unknown }).resendBusinessMemberInvitation,      fetchBusinessTaxRules: businessSrv.fetchBusinessTaxRules,
      createBusinessTaxRule: (businessSrv as unknown as { createBusinessTaxRule?: unknown }).createBusinessTaxRule,
      updateTaxRule: (businessSrv as unknown as { updateTaxRule?: unknown }).updateTaxRule,
      deleteTaxRule: (businessSrv as unknown as { deleteTaxRule?: unknown }).deleteTaxRule,
      fetchBusinessById: businessSrv.fetchBusinessById,
      fetchOperatingHours: businessSrv.fetchOperatingHours,
      fetchMyBusinessMembership: businessSrv.fetchMyBusinessMembership,
    });
    Object.assign(coreRolesService as Record<string, unknown>, {
      fetchBusinessRoles: rolesSrv.fetchBusinessRoles,
    });
    Object.assign(coreWalletService as Record<string, unknown>, {
      fetchAllBalances: walletSrv.fetchAllBalances,
      fetchBusinessWalletBalance: walletSrv.fetchBusinessWalletBalance,
      fetchWalletHistory: walletSrv.fetchWalletHistory,
    });
    Object.assign(coreRiderService as Record<string, unknown>, {
      fetchRiderProfile: riderSrv.fetchRiderProfile,
      updateRiderProfile: riderSrv.updateRiderProfile,
      updateOnlineStatus: riderSrv.updateOnlineStatus,
      fetchRiderMetrics: riderSrv.fetchRiderMetrics,
      fetchRiderDashboard: riderSrv.fetchRiderDashboard,
      fetchRiderStatistics: riderSrv.fetchRiderStatistics,
      fetchAvailableOrders: riderSrv.fetchAvailableOrders,
      acceptDelivery: riderSrv.acceptDelivery,
      selfAssignDelivery: riderSrv.selfAssignDelivery,
      fetchActiveDelivery: riderSrv.fetchActiveDelivery,
      fetchRiderDeliveries: riderSrv.fetchRiderDeliveries,
      fetchDeliveryDetail: riderSrv.fetchDeliveryDetail,
      markDeliveryInTransit: riderSrv.markDeliveryInTransit,
      markDeliveryArrived: riderSrv.markDeliveryArrived,
      markDeliveryDelivered: riderSrv.markDeliveryDelivered,
      markDeliveryFailed: riderSrv.markDeliveryFailed,
      markDeliveryReturned: riderSrv.markDeliveryReturned,
      confirmDeliveryPickup: riderSrv.confirmDeliveryPickup,
      confirmDeliveryHandover: riderSrv.confirmDeliveryHandover,
      fetchRiderEarnings: riderSrv.fetchRiderEarnings,
      fetchEarningsBreakdown: riderSrv.fetchEarningsBreakdown,
      fetchRiderEarningsSummary: riderSrv.fetchRiderEarningsSummary,
      fetchWalletHistory: riderSrv.fetchWalletHistory,
      fetchVehicleInfo: riderSrv.fetchVehicleInfo,
      createVehicle: riderSrv.createVehicle,
      fetchDeliveryZones: riderSrv.fetchDeliveryZones,
      updateDeliveryZones: riderSrv.updateDeliveryZones,
      toggleDeliveryZone: riderSrv.toggleDeliveryZone,
      fetchNavigationSettings: riderSrv.fetchNavigationSettings,
      updateNavigationSettings: riderSrv.updateNavigationSettings,
      fetchNavigationApps: riderSrv.fetchNavigationApps,
      fetchVehicleTypes: riderSrv.fetchVehicleTypes,
    });
    setNotifyHandlers({ success: (m) => toast.success(m), error: (m) => toast.error(m) });
    // Forward sync failures to observability so the device/app/user behind a
    // stuck command is visible for monitoring and field fixes.
    setSyncFailureReporter((report) => {
      try {
        const obs = getObservability();
        if (!obs) return;
        const attrs = {
          phase: report.phase,
          business_id: report.business_id,
          user_id: report.user_id,
          device_id: report.device_id,
          command_type: report.command_type,
          command_id: report.command_id,
          entity_id: report.entity_id,
          status: report.status,
          code: report.code,
          message: report.message,
          attempts: report.attempts,
          terminal: report.terminal,
        };
        obs.event("sync.command.failed", attrs as never);
        if (report.terminal) {
          obs.captureException(
            new Error(report.message ?? "sync command failed"),
            attrs as never,
          );
        }
      } catch {}
    });
    Object.assign(coreDeliveryService as Record<string, unknown>, {
      fetchBusinessDeliveries: deliverySrv.fetchBusinessDeliveries,
      fetchDeliveryDetail: deliverySrv.fetchDeliveryDetail,
    });
    Object.assign(coreDashboardService as Record<string, unknown>, {
      fetchSellerDashboard: dashboardSrv.fetchSellerDashboard,
    });
    Object.assign(coreAnalyticsService as Record<string, unknown>, {
      fetchSellerAnalytics: analyticsSrv.fetchSellerAnalytics,
      fetchRevenueSummary: analyticsSrv.fetchRevenueSummary,
    });
    Object.assign(corePlacesService as Record<string, unknown>, {
      searchPlaces: placesSrv.placesService.searchPlaces.bind(placesSrv.placesService),
      getPlaceDetails: placesSrv.placesService.getPlaceDetails.bind(placesSrv.placesService),
      clearCache: placesSrv.placesService.clearCache.bind(placesSrv.placesService),
    });
    Object.assign(coreFleetService as Record<string, unknown>, {
      fetchFleetRiders: fleetSrv.fetchFleetRiders,
      fetchFleetRider: fleetSrv.fetchFleetRider,
      inviteRider: fleetSrv.inviteRider,
      approveRider: fleetSrv.approveRider,
      suspendRider: fleetSrv.suspendRider,
      activateRider: fleetSrv.activateRider,
      fetchRiderKyc: fleetSrv.fetchRiderKyc,
      fetchJoinRequests: fleetSrv.fetchJoinRequests,
      approveJoinRequest: fleetSrv.approveJoinRequest,
      rejectJoinRequest: fleetSrv.rejectJoinRequest,
      fetchInvitations: fleetSrv.fetchInvitations,
      revokeInvitation: fleetSrv.revokeInvitation,
      fetchFleetVehicles: fleetSrv.fetchFleetVehicles,
      addVehicle: fleetSrv.addVehicle,
      removeVehicle: fleetSrv.removeVehicle,
      fetchFleetDashboard: fleetSrv.fetchFleetDashboard,
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
    // The app owns `isOnline` (NetInfo); core's health probe is the sole owner
    // of `isCloudReachable`. Pushing the store's cloud verdict here would let
    // the app probe and the core probe clobber each other on boot transients.
    setConnectivityState({ isOnline: useConnectivityStore.getState().isOnline });
    const subscribe = (useConnectivityStore as unknown as {
      subscribe: (fn: (s: { isOnline: boolean; isCloudReachable: "reachable" | "unreachable" | "unknown" }) => void) => () => void;
    }).subscribe;
    if (typeof subscribe === "function") {
      subscribe((s) => setConnectivityState({ isOnline: s.isOnline }));
    }
    // Mirror core's authoritative connectivity back into the store so app
    // surfaces (diagnostics, POS, order flow) see the same verdict as the
    // online-only gates.
    subscribeConnectivity(() => {
      const c = getConnectivityState();
      useConnectivityStore.setState({
        isOnline: c.isOnline,
        isCloudReachable: c.isCloudReachable,
      });
    });
  } catch {}
}

function syncBusinessBridge(): void {
  try {
    const { setActiveBusiness } = require("@teincfood/core") as { setActiveBusiness: (b: { id: string } | null) => void };
    const sync = () => {
      const b = useBusinessStore.getState().activeBusiness;
      setActiveBusiness(b ? { id: b.id } : null);
    };
    sync();
    const subscribe = (useBusinessStore as unknown as { subscribe: (fn: (s: { activeBusiness: { id: string } | null }, prev: { activeBusiness: { id: string } | null }) => void) => () => void }).subscribe;
    if (typeof subscribe === "function") {
      subscribe((s, prev) => {
        if (s?.activeBusiness?.id !== prev?.activeBusiness?.id) sync();
      });
    }
  } catch {}
}

export function bootstrapCore(): ReturnType<typeof createTeincCore> | null {
  try {
    setDeviceMetadataProvider(() => ({
      deviceName: Device.deviceName ?? Device.modelName ?? `${Platform.OS} terminal`,
      platform: Platform.OS,
      osVersion: Device.osVersion ?? String(Platform.Version),
      appVersion: Constants.expoConfig?.version ?? undefined,
    }));
  } catch {}
  if (bootstrapped) return null;
  try {
    // Always-on shared log capture (same store Desktop Diagnostics reads).
    initDebugLogCapture();
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
    try { setAuthProvider(() => useAuthStore.getState().accessToken ?? null); } catch {}
    // Core owns the session lifecycle (access-expired → refresh →
    // refresh-expired → logout). Without these, core clearAuth() is a no-op
    // and core cannot read/store tokens.
    try { setAuthRefreshProvider(() => useAuthStore.getState().refreshToken ?? null); } catch {}
    try { setAuthTokensProvider((at: string, rt: string) => { try { useAuthStore.getState().setTokens(at, rt); } catch {} }); } catch {}
    // Core can discover a dead refresh token from sync/auth paths. Never let
    // that clear the offline session until the device is online and /health
    // proves the rejection came from a reachable backend.
    try { setAuthClearProvider(() => { void logoutAfterSessionFailure(); }); } catch {}
    // Offline device license: private key in Keychain/Keystore, license in KV.
    try {
      const secureKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, "_");
      setOfflineSecureStorage({
        getItem: (key) => SecureStore.getItemAsync(secureKey(key)),
        setItem: (key, value) => SecureStore.setItemAsync(secureKey(key), value),
        removeItem: (key) => SecureStore.deleteItemAsync(secureKey(key)),
      });
      setOfflineRandomBytesProvider((length) => getRandomBytes(length));
    } catch {}
    // Refresh-token death while online: try the device license before logout.
    try {
      setOfflineSessionRecoveryProvider(async () => {
        const auth = useAuthStore.getState();
        const businessId = useBusinessStore.getState().activeBusiness?.id;
        if (!businessId || !auth.offlineMemberId) return null;
        try {
          const result = await exchangeOfflineSession({
            businessId,
            memberId: auth.offlineMemberId,
          });
          useAuthStore.getState().setTokens(result.access_token, result.refresh_token);
          return {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          };
        } catch {
          return null;
        }
      });
    } catch {}
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
    const { tcp, printFile, mdns } = buildPrintAdapters();
    const fileSystemAdapter = buildFileSystemAdapter();
    const result = createTeincCore({
      sqliteDriver,
      kvDriver,
      httpClient,
      apiBaseUrl: API_BASE_URL,
      wsBaseUrl: WS_BASE_URL,
      initialConnectivity,
      printAdapters: { tcp, printFile, mdns },
      fileSystemAdapter: fileSystemAdapter as unknown as import("@teincfood/core").FileSystemAdapter,
    });
    try {
      syncConnectivityBridge();
    } catch {}
    // Provision the entitlement HMAC secret once: the core auto-guard
    // verifies the cached subscription envelope against it (fail-closed
    // once proof exists; backend 402 remains the final authority).
    try {
      setEntitlementSecret(
        ENTITLEMENT_HMAC_SECRET && ENTITLEMENT_HMAC_SECRET.length > 0
          ? ENTITLEMENT_HMAC_SECRET
          : null,
      );
    } catch {}
    // Company footer for receipts (empty values keep template defaults).
    try {
      setCompanyInfo(COMPANY_INFO);
    } catch {}
    try {
      syncBusinessBridge();
    } catch {}
    // Core-owned Local Node — drivers injected, lan_discover native via Zeroconf / Tauri poll
    try {
      initLocalNodeService({
        getDeviceId: () => getAppInstanceId(),
        getDeviceName: () => {
          try { const { getDeviceDisplayName } = require("@/services/devices.service"); return getDeviceDisplayName(); } catch { return undefined; }
        },
        getBusiness: () => useBusinessStore.getState().activeBusiness as unknown as { id: string; ownerId?: string; owner_id?: string } | null,
        getAuth: () => {
          const s = useAuthStore.getState() as unknown as {
            user: unknown | null;
            accessToken: string | null;
            offlineMemberId: string | null;
          };
          return {
            user: s.user ?? null,
            accessToken: s.accessToken ?? null,
            localSession: Boolean(s.offlineMemberId),
          };
        },
        discovery: new ZeroconfDiscovery(),
        transport: new TcpTransport(),
        keepAlive: new ExpoKeepAlive(),
      });
      // Wire auth/business changes to re-initialize LAN (core service handles lifecycle)
      try {
        let prevBiz = useBusinessStore.getState().activeBusiness?.id ?? null;
        let prevToken = (useAuthStore.getState() as unknown as { accessToken?: string | null }).accessToken ?? null;
        useBusinessStore.subscribe((s: unknown, prev: unknown) => {
          const id = (s as { activeBusiness?: { id?: string } })?.activeBusiness?.id ?? null;
          const prevId = (prev as { activeBusiness?: { id?: string } })?.activeBusiness?.id ?? null;
          if (id !== prevId) { prevBiz = id; localNodeService.initialize().catch(() => undefined); }
        });
        useAuthStore.subscribe((s: unknown, prev: unknown) => {
          const tok = (s as { accessToken?: string | null })?.accessToken ?? null;
          const prevTok = (prev as { accessToken?: string | null })?.accessToken ?? null;
          if (tok !== prevTok) { prevToken = tok; localNodeService.initialize().catch(() => undefined); }
        });
        // Also handle foreground resume for real devices
        try { const { AppState } = require("react-native"); AppState.addEventListener("change", (st: string) => { if (st === "active") localNodeService.reconnectNow(); }); } catch {}
        // Re-hydrate persisted LAN flag (KVDriver now set) then kick lifecycle
        try { localNodeStore.rehydrate().then(() => localNodeService.initialize().catch(() => undefined)).catch(() => localNodeService.initialize().catch(() => undefined)); } catch { localNodeService.initialize().catch(() => undefined); }
        // Retry mesh start after Zustand rehydrate (same businessId, owner optional) — ensures harness/desktop/mobile converge
        try {
          let retries = 0;
          const iv = setInterval(() => {
            retries++;
            try {
              const biz = useBusinessStore.getState().activeBusiness as unknown as { id?: string } | null;
              const auth = useAuthStore.getState() as unknown as { user: unknown; accessToken: string | null };
              const enabled = localNodeStore.getState().isLocalNodeEnabled;
              const listening = localNodeService.isLocalNode();
              if (enabled && biz?.id && auth?.accessToken && !listening && retries < 30) {
                localNodeService.initialize().catch(() => undefined);
              }
              if (retries >= 30 || listening) clearInterval(iv);
            } catch {}
          }, 2000);
          if ((iv as unknown as { unref?: () => void }).unref) (iv as unknown as { unref: () => void }).unref?.();
        } catch {}
      } catch {}
    } catch {}
    // 0.7.0: auto-lease device number per business (DD 01-99) for offline DD-RRR-CCC
    // Seller role only — fleet managers and riders never queue offline orders.
    try {
      const ensureLeaseForBusiness = (bid: string | null | undefined) => {
        if (!bid) return;
        if (useRoleStore.getState().role !== 'seller') return;
        ensureDeviceLease(bid).catch(() => {});
        // One-time janitor: drop cached menu rows that are not backend-shaped
        // MenuItems (older builds cached raw wire payloads and crashed readers).
        purgeNonCanonicalMenuCache(bid).catch(() => {});
      };
      const currentId: string | null = useBusinessStore.getState().activeBusiness?.id ?? null;
      if (currentId) ensureLeaseForBusiness(currentId);
      try {
        useBusinessStore.subscribe((s: any, prev: any) => {
          const id: string | undefined = s?.activeBusiness?.id;
          const prevId: string | undefined = prev?.activeBusiness?.id;
          if (id && id !== prevId) ensureLeaseForBusiness(id);
        });
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

// When this module is imported, ensure the SQLite driver and all platform
// adapters are registered before any core service can be used. This replaces
// the old side-effect in src/db/connection.ts that was deleted in the
// shim cleanup (a59d9d3).
ensureCoreBootstrap();

/**
 * Manual override: call this once at app startup (e.g. from a splash-screen
 * init or root layout) if the module-side import-side-effect does not fire
 * for any reason. Idempotent — safe to call multiple times.
 */
export function useCorePrime(): void {
  if (!bootstrapped) bootstrapCore();
}