/**
 * Connectivity state for the Sync Engine.
 *
 * Exposes:
 *   - isOnline: whether the device has a network interface.
 *   - isCloudReachable: whether the cloud API is reachable (heartbeats).
 *   - connectionType: cellular, wifi, ethernet, unknown, none.
 *   - isMetered: whether the connection is metered.
 *
 * The store is initialized by calling `initializeConnectivity()` from the root layout.
 */

import { create } from "zustand";
import NetInfo, {
  type NetInfoState,
  type NetInfoStateType,
  type NetInfoSubscription,
} from "@react-native-community/netinfo";
import { probeCloudHealth, recordAttempt, syncLogger } from "@teincfood/core";
import { API_BASE_URL } from "@/utils/constants";

export type CloudReachability = "unknown" | "reachable" | "unreachable";

/** Steady heartbeat between probes. Fixed cadence (not backed off): one small
 * no-auth GET per minute is cheap; retries elsewhere carry the backoff. */
const CLOUD_RETRY_COOLDOWN_MS = 60_000;

interface ConnectivityState {
  isOnline: boolean;
  isCloudReachable: CloudReachability;
  connectionType: NetInfoStateType;
  isMetered: boolean | null;
  details: NetInfoState["details"] | null;

  setNetworkState: (state: NetInfoState) => void;
  setCloudReachable: (reachable: CloudReachability) => void;
  initialize: () => () => void;
}

function netInfoStateToOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export const useConnectivityStore = create<ConnectivityState>()((set) => {
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const clearRetryTimer = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  return {
  isOnline: true,
  isCloudReachable: "unknown",
  connectionType: "unknown" as NetInfoStateType,
  isMetered: null,
  details: null,

  setNetworkState: (state) => {
    const netOnline = netInfoStateToOnline(state);
    const regainedNetwork = netOnline && !lastNetOnline;
    lastNetOnline = netOnline;
    const wasOnline = useConnectivityStore.getState().isOnline;
    // NetInfo can false-negative (iOS simulator/VPN). While the cloud is
    // known reachable, trust that over the interface verdict; the probe below
    // re-verifies and the gate falls back to offline if the cloud is lost.
    const isOnline =
      netOnline || useConnectivityStore.getState().isCloudReachable === "reachable";
    set({
      isOnline,
      connectionType: state.type,
      isMetered:
        state.details && "isConnectionExpensive" in state.details
          ? (state.details as { isConnectionExpensive?: boolean }).isConnectionExpensive ?? null
          : null,
      details: state.details,
    });
    syncLogger.debug("ConnectivityStore", "Network state changed", {
      isOnline,
      type: state.type,
      isMetered: state.details && "isConnectionExpensive" in state.details
        ? (state.details as { isConnectionExpensive?: boolean }).isConnectionExpensive
        : null,
    });
    // Probe on every online/offline transition and whenever NetInfo reports
    // no network. Regain settles the cloud state; loss is verified because a
    // successful probe is proof the app can still reach the backend.
    if (!netOnline || regainedNetwork || isOnline !== wasOnline) {
      void probeCloud();
    }
  },

  setCloudReachable: (reachable) => {
    set({ isCloudReachable: reachable });
    syncLogger.debug("ConnectivityStore", "Cloud reachability changed", {
      reachable,
    });

    // When the cloud is marked unreachable, probe after a cooldown instead of
    // blindly flipping to "unknown": a probe settles the state without making
    // a user command eat a full timeout. Armed once per unreachable period.
    if (reachable === "unreachable") {
      if (retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void probeCloud();
      }, CLOUD_RETRY_COOLDOWN_MS);
    } else {
      clearRetryTimer();
    }
  },

  initialize: () => {
    // Fetch current state immediately + settle cloud state via probe (boot
    // with backend down must not leave every first command paying timeout).
    NetInfo.fetch()
      .then((state) => {
        useConnectivityStore.getState().setNetworkState(state);
      })
      .catch((error) => {
        syncLogger.error("ConnectivityStore", "Failed to fetch initial state", {
          error: String(error),
        });
      });
    void probeCloud();

    const subscription: NetInfoSubscription = NetInfo.addEventListener(
      (state) => {
        useConnectivityStore.getState().setNetworkState(state);
      },
    );

    return () => {
      subscription();
      clearRetryTimer();
    };
  },
  };
});

/** Backend health probe timeout. Short: settling cloud state must never block UX. */
const PROBE_TIMEOUT_MS = 4_000;

/** In-flight health probe shared by boot, NetInfo transitions and diagnostics. */
let probeInFlight: Promise<boolean> | null = null;
/** Last raw NetInfo verdict, used to detect a regain even when the effective
 * `isOnline` stayed true because the cloud was reachable. */
let lastNetOnline = true;

function healthUrl(): string {
  try {
    // Backend serves health at /api/health (router scope "/api"), not under /api/v1.
    return new URL("/api/health", API_BASE_URL).toString();
  } catch {
    return `${API_BASE_URL}/../health`;
  }
}

/**
 * Prove the app can reach the backend and correct `isOnline` when NetInfo
 * false-negatives. Core's health probe is the sole owner of
 * `isCloudReachable` (mirrored back into this store by the bootstrap bridge);
 * this probe never writes that flag itself.
 *
 * Single-flight: concurrent callers (boot + NetInfo transitions) share one
 * request instead of stacking probes.
 */
export function probeCloud(): Promise<boolean> {
  if (probeInFlight) return probeInFlight;
  probeInFlight = runCloudProbe().finally(() => {
    probeInFlight = null;
  });
  return probeInFlight;
}

async function runCloudProbe(): Promise<boolean> {
  const url = healthUrl();
  const started = Date.now();
  recordAttempt("probe", "probeCloud");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const elapsed = Date.now() - started;
    if (res.ok) {
      syncLogger.debug("ConnectivityStore", "probeCloud reachable", { url, elapsed });
      // A successful round-trip proves a usable network path. NetInfo can
      // false-negative (iOS simulator/VPN), so trust the probe: leaving
      // isOnline false makes every online-only gate reject commands even
      // though the backend is reachable.
      useConnectivityStore.setState({ isOnline: true });
      // Let the single-owner core probe settle isCloudReachable now; its
      // verdict is mirrored back into this store.
      void probeCloudHealth();
      return true;
    }
    syncLogger.debug("ConnectivityStore", "probeCloud HTTP non-2xx", { url, elapsed, status: res.status });
  } catch (error) {
    syncLogger.debug("ConnectivityStore", "probeCloud failed", { url, error: String(error) });
  }
  // A single failed probe is not evidence the cloud is down; core's health
  // probe owns isCloudReachable and will settle it.
  return false;
}
