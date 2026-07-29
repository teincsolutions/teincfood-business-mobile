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
import { syncLogger } from "@/utils/sync-logger";

export type CloudReachability = "unknown" | "reachable" | "unreachable";

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

export const useConnectivityStore = create<ConnectivityState>()((set) => ({
  isOnline: true,
  isCloudReachable: "unknown",
  connectionType: "unknown" as NetInfoStateType,
  isMetered: null,
  details: null,

  setNetworkState: (state) => {
    const isOnline = netInfoStateToOnline(state);
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
  },

  setCloudReachable: (reachable) => {
    set({ isCloudReachable: reachable });
    syncLogger.debug("ConnectivityStore", "Cloud reachability changed", {
      reachable,
    });
  },

  initialize: () => {
    // Fetch current state immediately
    NetInfo.fetch()
      .then((state) => {
        useConnectivityStore.getState().setNetworkState(state);
      })
      .catch((error) => {
        syncLogger.error("ConnectivityStore", "Failed to fetch initial state", {
          error: String(error),
        });
      });

    const subscription: NetInfoSubscription = NetInfo.addEventListener(
      (state) => {
        useConnectivityStore.getState().setNetworkState(state);
      },
    );

    return () => {
      subscription();
    };
  },
}));

/**
 * Convenience hook that returns true when the cloud is assumed reachable.
 *
 * "unknown" is treated as reachable by default to keep the online-first
 * behavior. The Sync Engine will downgrade to queueing on the first failed
 * cloud heartbeat.
 */
export function useIsCloudReachable(): boolean {
  return useConnectivityStore(
    (s) => s.isCloudReachable === "reachable" || s.isCloudReachable === "unknown",
  );
}

export function useIsOnline(): boolean {
  return useConnectivityStore((s) => s.isOnline);
}
