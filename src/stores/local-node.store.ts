/**
 * Local Node store.
 *
 * Manages the device role in the local restaurant network:
 *   - isLocalNode: this device is the designated Local Node.
 *   - localNodePort: TCP port the Local Node listens on.
 *   - discoveredNodes: other devices discovered via mDNS/zeroconf.
 *   - electedNodeDeviceId: the device ID currently acting as the Local Node.
 *
 * One device per business location must be manually designated as the Local Node.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/utils/constants";
import { getAppInstanceId } from "@/services/devices.service";

export interface DiscoveredNode {
  deviceId: string;
  name: string;
  host: string;
  port: number;
  deviceName?: string;
  lastSeenAt: string;
}

export interface ConnectedClient {
  deviceId: string;
  deviceName?: string;
  host?: string;
  connectedAt: string;
}

interface LocalNodeState {
  isLocalNodeEnabled: boolean;
  localNodePort: number;
  electedNodeDeviceId: string | null;
  discoveredNodes: DiscoveredNode[];
  connectedClients: ConnectedClient[];

  setIsLocalNodeEnabled: (enabled: boolean) => void;
  setLocalNodePort: (port: number) => void;
  designateThisDevice: () => void;
  electNode: (deviceId: string | null) => void;
  addDiscoveredNode: (node: DiscoveredNode) => void;
  removeDiscoveredNode: (deviceId: string) => void;
  clearDiscoveredNodes: () => void;
  addConnectedClient: (client: ConnectedClient) => void;
  removeConnectedClient: (deviceId: string) => void;
  clearConnectedClients: () => void;
}

const DEFAULT_LOCAL_NODE_PORT = 44621;

export const useLocalNodeStore = create<LocalNodeState>()(
  persist(
    (set, get) => ({
      isLocalNodeEnabled: false,
      localNodePort: DEFAULT_LOCAL_NODE_PORT,
      electedNodeDeviceId: null,
      discoveredNodes: [],
      connectedClients: [],

      setIsLocalNodeEnabled: (enabled) => {
        set({ isLocalNodeEnabled: enabled });
      },

      setLocalNodePort: (port) => set({ localNodePort: port }),

      designateThisDevice: () => {
        set({
          electedNodeDeviceId: getAppInstanceId(),
          isLocalNodeEnabled: true,
        });
      },

      electNode: (deviceId) => set({ electedNodeDeviceId: deviceId }),

      addDiscoveredNode: (node) =>
        set((state) => {
          const existing = state.discoveredNodes.find(
            (n) => n.deviceId === node.deviceId,
          );
          if (existing) {
            return {
              discoveredNodes: state.discoveredNodes.map((n) =>
                n.deviceId === node.deviceId ? { ...node, ...n } : n,
              ),
            };
          }
          return { discoveredNodes: [...state.discoveredNodes, node] };
        }),

      removeDiscoveredNode: (deviceId) =>
        set((state) => ({
          discoveredNodes: state.discoveredNodes.filter(
            (n) => n.deviceId !== deviceId,
          ),
        })),

      clearDiscoveredNodes: () => set({ discoveredNodes: [] }),

      addConnectedClient: (client) =>
        set((state) => {
          const existing = state.connectedClients.find(
            (c) => c.deviceId === client.deviceId,
          );
          if (existing) {
            return {
              connectedClients: state.connectedClients.map((c) =>
                c.deviceId === client.deviceId ? { ...c, ...client } : c,
              ),
            };
          }
          return { connectedClients: [...state.connectedClients, client] };
        }),

      removeConnectedClient: (deviceId) =>
        set((state) => ({
          connectedClients: state.connectedClients.filter(
            (c) => c.deviceId !== deviceId,
          ),
        })),

      clearConnectedClients: () => set({ connectedClients: [] }),
    }),
    {
      name: STORAGE_KEYS.LOCAL_NODE_DATA ?? "Teinc Food-local-node",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        isLocalNodeEnabled: state.isLocalNodeEnabled,
        localNodePort: state.localNodePort,
        electedNodeDeviceId: state.electedNodeDeviceId,
      }),
    },
  ),
);
