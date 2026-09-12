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
import { recordAttempt, syncLogger } from "@teincfood/core";
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
    const isOnline = netInfoStateToOnline(state);
    const wasOnline = useConnectivityStore.getState().isOnline;
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
    // Network (re)gained with unknown cloud state: probe now so the first
    // user command doesn't pay a timeout discovering the backend is down.
    if (isOnline && !wasOnline) {
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

function healthUrl(): string {
  try {
    // Backend serves health at /api/health (router scope "/api"), not under /api/v1.
    return new URL("/api/health", API_BASE_URL).toString();
  } catch {
    return `${API_BASE_URL}/../health`;
  }
}

/**
 * Probe the cloud and settle `isCloudReachable` (zustand + core via bridge).
 * No-auth GET /api/health with a short timeout. Called at boot, on network
 * regain, and after the unreachable cooldown — so the engine never pays a
 * full command timeout just to discover the backend is down.
 */
export async function probeCloud(): Promise<boolean> {
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
      useConnectivityStore.getState().setCloudReachable("reachable");
      return true;
    }
    syncLogger.debug("ConnectivityStore", "probeCloud HTTP non-2xx", { url, elapsed, status: res.status });
  } catch (error) {
    syncLogger.debug("ConnectivityStore", "probeCloud failed", { url, error: String(error) });
  }
  useConnectivityStore.getState().setCloudReachable("unreachable");
  return false;
}
