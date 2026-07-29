/**
 * Local Node Service.
 *
 * Orchestrates the Local Node lifecycle:
 *   - If this device is the Local Node, start the TCP server and publish mDNS.
 *   - Otherwise, scan for the Local Node and connect as a client.
 *   - Routes commands to the Local Node when cloud is unavailable.
 *   - Broadcasts events received from the Local Node.
 */

import { useLocalNodeStore, type DiscoveredNode } from "@/stores/local-node.store";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { getAppInstanceId } from "@/services/devices.service";
import { restTransport } from "@/sync/transport-rest";
import { commandQueueService } from "@/sync/command-queue.service";
import { syncLogger } from "@/utils/sync-logger";
import { LocalNodeServer } from "./server";
import { LocalNodeClient } from "./client";
import { localNodeDiscovery } from "./discovery";
import type { Command, DomainEvent } from "@/sync/types";
import type { LocalNodeInfo } from "./types";

class LocalNodeService {
  private server: LocalNodeServer | null = null;
  private client: LocalNodeClient | null = null;
  private discovery: typeof localNodeDiscovery = localNodeDiscovery;
  private electedNode: LocalNodeInfo | null = null;

  async initialize(): Promise<void> {
    const store = useLocalNodeStore.getState();

    if (!store.isLocalNodeEnabled) {
      syncLogger.info("LocalNodeService", "Local Node disabled");
      return;
    }

    const thisDeviceId = getAppInstanceId();
    const isThisNode = store.electedNodeDeviceId === thisDeviceId;

    if (isThisNode) {
      await this.startAsNode(store.localNodePort);
    } else {
      this.startDiscovery();
    }
  }

  async shutdown(): Promise<void> {
    this.client?.disconnect();
    this.client = null;
    await this.server?.stop();
    this.server = null;
    this.discovery.stop();
  }

  isLocalNode(): boolean {
    const store = useLocalNodeStore.getState();
    return (
      store.isLocalNodeEnabled &&
      store.electedNodeDeviceId === getAppInstanceId()
    );
  }

  isConnectedToNode(): boolean {
    return this.client?.isConnected() ?? false;
  }

  getClient(): LocalNodeClient | null {
    return this.client;
  }

  getElectedNode(): LocalNodeInfo | null {
    return this.electedNode;
  }

  private async startAsNode(port: number): Promise<void> {
    this.server = new LocalNodeServer({
      port,
      onCommand: async (command) => {
        // Phase 4: execute command locally and persist to outbox.
        // Phase 3: just echo back as an event for now.
        const event = await this.handleNodeCommand(command);
        return event ? [event] : [];
      },
      onClientConnected: (deviceId) => {
        syncLogger.info("LocalNodeService", "Client connected", { deviceId });
      },
      onClientDisconnected: (deviceId) => {
        syncLogger.info("LocalNodeService", "Client disconnected", { deviceId });
      },
    });

    await this.server.start();

    this.discovery.startPublishing({
      deviceId: getAppInstanceId(),
      port,
      onNodeFound: (node) => useLocalNodeStore.getState().addDiscoveredNode(node),
      onNodeLost: (deviceId) => useLocalNodeStore.getState().removeDiscoveredNode(deviceId),
    });
  }

  private startDiscovery(): void {
    this.discovery.startPublishing({
      deviceId: getAppInstanceId(),
      port: 0,
      onNodeFound: (node) => useLocalNodeStore.getState().addDiscoveredNode(node),
      onNodeLost: (deviceId) => useLocalNodeStore.getState().removeDiscoveredNode(deviceId),
    });

    this.discovery.startScanning();

    // Auto-connect when the elected node is discovered.
    useLocalNodeStore.subscribe((state) => {
      const elected = state.discoveredNodes.find(
        (n) => n.deviceId === state.electedNodeDeviceId,
      );
      if (elected && (!this.client || !this.client.isConnected())) {
        this.connectToNode(elected);
      }
    });
  }

  private connectToNode(node: DiscoveredNode): void {
    this.electedNode = {
      deviceId: node.deviceId,
      host: node.host,
      port: node.port,
    };

    this.client = new LocalNodeClient({
      node: this.electedNode,
      onEvent: (event) => {
        syncLogger.event(event, "received", { origin: "lan" });
      },
      onConnected: () => {
        syncLogger.info("LocalNodeService", "Connected to elected node", {
          deviceId: node.deviceId,
        });
        useConnectivityStore.getState().setCloudReachable("reachable");
      },
      onDisconnected: () => {
        syncLogger.warn("LocalNodeService", "Disconnected from elected node");
        useConnectivityStore.getState().setCloudReachable("unreachable");
      },
    });

    this.client.connect().catch((error) => {
      syncLogger.error("LocalNodeService", "Failed to connect to node", {
        error: String(error),
      });
    });
  }

  async handleNodeCommand(command: Command): Promise<DomainEvent | null> {
    syncLogger.command(command, "executing", { via: "local_node" });

    const { isCloudReachable } = useConnectivityStore.getState();
    const cloudReachable = isCloudReachable === "reachable";

    if (cloudReachable) {
      // Forward to cloud via REST directly to avoid a loop through the Local
      // Node transport.
      const events = await restTransport.execute(command);
      return events[0] ?? null;
    }

    // Cloud unreachable: queue on the Local Node and return optimistic event.
    // Client terminals will display the same pending state.
    const event = await commandQueueService.enqueue(command);
    return event;
  }
}


export const localNodeService = new LocalNodeService();
