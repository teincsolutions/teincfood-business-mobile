/**
 * Local Node Service.
 *
 * Orchestrates the Local Node lifecycle:
 *   - If this device is the Local Node, start the TLS TCP server and publish mDNS.
 *   - Otherwise, scan for the Local Node and connect as a TLS client.
 *   - Routes commands to the Local Node when cloud is unavailable.
 *   - Broadcasts events received from the Local Node.
 *
 * Security:
 *   - Only starts when the user is authenticated and has an active business.
 *   - The server authenticates clients via a challenge-response handshake
 *     using a secret derived from the active business.
 *   - The designated node activates keep-awake so the screen stays on and the
 *     app remains active (dedicated POS terminal).
 */

import { useLocalNodeStore, type DiscoveredNode } from "@/stores/local-node.store";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { getAppInstanceId } from "@/services/devices.service";
import { restTransport } from "@/sync/transport-rest";
import { commandQueueService } from "@/sync/command-queue.service";
import { syncLogger } from "@/utils/sync-logger";
import { CLOUD_COMMAND_TIMEOUT_MS } from "@/utils/constants";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import { LocalNodeServer } from "./server";
import { LocalNodeClient } from "./client";
import { localNodeDiscovery } from "./discovery";
import { deriveLanSecret } from "./security";
import type { Command, DomainEvent } from "@/sync/types";
import type { LocalNodeInfo } from "./types";

const LOCAL_NODE_KEEP_AWAKE_TAG = "TeincLocalNode";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

class LocalNodeService {
  private server: LocalNodeServer | null = null;
  private client: LocalNodeClient | null = null;
  private discovery: typeof localNodeDiscovery = localNodeDiscovery;
  private electedNode: LocalNodeInfo | null = null;
  private mode: "node" | "client" | "idle" = "idle";
  private businessId: string | null = null;
  private secret: string | null = null;
  private subscribed = false;

  async initialize(): Promise<void> {
    const auth = useAuthStore.getState();
    const business = useBusinessStore.getState().activeBusiness;

    // Auth-gate: require an authenticated user with an active business.
    if (!auth.user || !auth.accessToken || !business) {
      if (this.mode !== "idle") {
        await this.shutdown();
      }
      syncLogger.info("LocalNodeService", "Local Node idle (no active business)");
      this.setupStoreSubscriptions();
      return;
    }

    const store = useLocalNodeStore.getState();

    if (!store.isLocalNodeEnabled) {
      if (this.mode !== "idle") {
        await this.shutdown();
      }
      syncLogger.info("LocalNodeService", "Local Node disabled");
      this.setupStoreSubscriptions();
      return;
    }

    const thisDeviceId = getAppInstanceId();
    const isThisNode = store.electedNodeDeviceId === thisDeviceId;

    // Re-initialize if the underlying connection/socket died (e.g. after the
    // app was suspended). initialize() runs from the app shell, the settings
    // screen, and on foreground resume, so only short-circuit when healthy
    // AND the current role matches the intended role (a client that is later
    // designated as node must restart as the node).
    if (isThisNode && this.mode === "node" && this.server?.isListening()) {
      this.setupStoreSubscriptions();
      return;
    }
    if (
      !isThisNode &&
      this.mode === "client" &&
      this.client?.isConnected() &&
      this.businessId === business.id
    ) {
      this.setupStoreSubscriptions();
      return;
    }

    // If the active business changed while running, tear down so the
    // server/client use the correct secret for the new business.
    if (this.mode !== "idle") {
      await this.shutdown();
    }

    this.businessId = business.id;
    this.secret = await deriveLanSecret(business);

    if (isThisNode) {
      await this.startAsNode(store.localNodePort);
      this.mode = "node";
    } else {
      this.startDiscovery();
      this.mode = "client";
      // Attempt an immediate connect in case nodes were already discovered
      // before the auto-connect subscription was registered.
      this.connectToElectedNode();
    }

    this.setupStoreSubscriptions();
  }

  async shutdown(): Promise<void> {
    this.client?.disconnect();
    this.client = null;
    await this.server?.stop();
    this.server = null;
    this.discovery.stop();
    this.electedNode = null;
    this.mode = "idle";
    this.businessId = null;
    this.secret = null;
    useLocalNodeStore.getState().clearConnectedClients();
    await deactivateKeepAwake(LOCAL_NODE_KEEP_AWAKE_TAG).catch(() => undefined);
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

  private setupStoreSubscriptions(): void {
    if (this.subscribed) return;
    this.subscribed = true;

    // Re-run initialize only when auth actually changes (not on every store
    // mutation, e.g. push-token registration or query updates).
    useAuthStore.subscribe((state, prevState) => {
      if (
        state.accessToken === prevState.accessToken &&
        state.user === prevState.user
      ) {
        return;
      }
      this.initialize().catch((error) => {
        syncLogger.error("LocalNodeService", "Re-init (auth) failed", {
          error: String(error),
        });
      });
    });

    // Re-run initialize only when the active business changes.
    useBusinessStore.subscribe((state, prevState) => {
      if (state.activeBusiness?.id === prevState.activeBusiness?.id) {
        return;
      }
      this.initialize().catch((error) => {
        syncLogger.error("LocalNodeService", "Re-init (business) failed", {
          error: String(error),
        });
      });
    });

    // Auto-connect when a node is discovered. Connect to the elected node if
    // set, otherwise fall back to the first discovered node so client
    // terminals can join the LAN without manual configuration. Registered once
    // to avoid duplicate listeners across repeated initialize() calls.
    useLocalNodeStore.subscribe((state, prevState) => {
      if (this.mode !== "client") return;
      if (this.client?.isConnected()) return;
      if (
        state.discoveredNodes === prevState.discoveredNodes &&
        state.electedNodeDeviceId === prevState.electedNodeDeviceId
      ) {
        return;
      }
      this.connectToElectedNode();
    });
  }

  private connectToElectedNode(): void {
    if (this.mode !== "client") return;
    if (this.client?.isConnected()) return;

    const { discoveredNodes, electedNodeDeviceId } =
      useLocalNodeStore.getState();
    const elected = discoveredNodes.find(
      (n) => n.deviceId === electedNodeDeviceId,
    );
    const target = elected ?? discoveredNodes[0];
    if (target) {
      this.connectToNode(target);
    }
  }

  private async startAsNode(port: number): Promise<void> {
    if (!this.businessId || !this.secret) {
      throw new Error("LocalNodeService: business context missing");
    }

    this.server = new LocalNodeServer({
      port,
      businessId: this.businessId,
      secret: this.secret,
      onCommand: async (command) => {
        const event = await this.handleNodeCommand(command);
        return event ? [event] : [];
      },
      onClientConnected: (info) => {
        syncLogger.info("LocalNodeService", "Client connected", {
          deviceId: info.deviceId,
          deviceName: info.deviceName,
        });
        useLocalNodeStore.getState().addConnectedClient({
          deviceId: info.deviceId,
          deviceName: info.deviceName,
          host: info.host,
          connectedAt: new Date().toISOString(),
        });
      },
      onClientDisconnected: (deviceId) => {
        syncLogger.info("LocalNodeService", "Client disconnected", {
          deviceId,
        });
        useLocalNodeStore.getState().removeConnectedClient(deviceId);
      },
    });

    await this.server.start();

    // Keep the designated node device awake so the server keeps listening.
    await activateKeepAwake(LOCAL_NODE_KEEP_AWAKE_TAG).catch(() => undefined);

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
  }

  private connectToNode(node: DiscoveredNode): void {
    if (!this.businessId || !this.secret) {
      syncLogger.warn("LocalNodeService", "Cannot connect: no business context");
      return;
    }

    this.electedNode = {
      deviceId: node.deviceId,
      host: node.host,
      port: node.port,
    };

    this.client?.disconnect();
    this.client = new LocalNodeClient({
      node: this.electedNode,
      businessId: this.businessId,
      secret: this.secret,
      onEvent: (event) => {
        syncLogger.event(event, "received", { origin: "lan" });
      },
      onConnected: () => {
        syncLogger.info("LocalNodeService", "Connected to elected node", {
          deviceId: node.deviceId,
        });
        // Stop scanning once connected to the Local Node; resume when the
        // connection drops so the client can find the node again.
        this.discovery.stopScanning();
        useConnectivityStore.getState().setCloudReachable("reachable");
      },
      onDisconnected: () => {
        syncLogger.warn("LocalNodeService", "Disconnected from elected node");
        this.client = null;
        this.electedNode = null;
        useConnectivityStore.getState().setCloudReachable("unreachable");
        this.discovery.startScanning();
        // Try to rejoin the LAN immediately; subsequent discovery events will
        // also re-trigger connection attempts.
        this.connectToElectedNode();
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
      // Node transport. If the cloud is slow, fall back to the outbox quickly
      // so the terminal stays responsive.
      try {
        const events = await withTimeout(
          restTransport.execute(command),
          CLOUD_COMMAND_TIMEOUT_MS,
        );
        return events[0] ?? null;
      } catch (error) {
        syncLogger.warn("LocalNodeService", "Cloud forward failed, queueing", {
          error: String(error),
        });
        useConnectivityStore.getState().setCloudReachable("unreachable");
        const event = await commandQueueService.enqueue(command);
        return event;
      }
    }

    // Cloud unreachable: queue on the Local Node and return optimistic event.
    // Client terminals will display the same pending state.
    const event = await commandQueueService.enqueue(command);
    return event;
  }
}

export const localNodeService = new LocalNodeService();
