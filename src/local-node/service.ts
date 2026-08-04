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
import {
  applyPendingOrderEvent,
  applyOrderStateChangeEvent,
} from "@/sync/pending-orders.service";
import { applyReferenceChangeEvent } from "@/reference/events";
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

/** Initial reconnect delay after a failed connect attempt. */
const RECONNECT_BASE_DELAY_MS = 1_000;
/** Maximum reconnect delay (exponential backoff cap). */
const RECONNECT_MAX_DELAY_MS = 30_000;
/** Safety-net: release the single-flight connect lock if a connect never settles. */
const CONNECT_GUARD_MS = 15_000;

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

  // Reconnect manager state.
  private connecting = false;
  private reconnectDelayMs = RECONNECT_BASE_DELAY_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectGuardTimer: ReturnType<typeof setTimeout> | null = null;
  /** Incremented on every connect attempt so stale socket callbacks are ignored. */
  private generation = 0;

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
    this.generation += 1;
    this.connecting = false;
    this.clearReconnectTimer();
    this.clearConnectGuard();
    this.client?.disconnect();
    this.client = null;
    await this.server?.stop();
    this.server = null;
    this.discovery.stop();
    this.electedNode = null;
    this.mode = "idle";
    this.businessId = null;
    this.secret = null;
    this.reconnectDelayMs = RECONNECT_BASE_DELAY_MS;
    syncLogger.info("LocalNodeService", "Clearing connected clients (shutdown)");
    useLocalNodeStore.getState().clearConnectedClients();
    await deactivateKeepAwake(LOCAL_NODE_KEEP_AWAKE_TAG).catch(() => undefined);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearConnectGuard(): void {
    if (this.connectGuardTimer) {
      clearTimeout(this.connectGuardTimer);
      this.connectGuardTimer = null;
    }
  }

  isLocalNode(): boolean {
    const store = useLocalNodeStore.getState();
    return (
      store.isLocalNodeEnabled &&
      store.electedNodeDeviceId === getAppInstanceId()
    );
  }

  /**
   * Broadcast an event to every authenticated LAN client. Only meaningful on
   * the node; used to relay Sync Engine events (e.g. order.created from a
   * replayed command) that do not pass through handleNodeCommand.
   */
  broadcastToClients(event: DomainEvent): void {
    this.server?.broadcast(event);
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
    // Single-flight: never stack concurrent connect attempts. The reconnect
    // timer, store subscriptions, and socket callbacks all funnel through here.
    if (this.connecting) return;
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

  private scheduleReconnect(): void {
    if (this.mode !== "client") return;
    if (this.connecting) return;
    if (this.client?.isConnected()) return;
    if (this.reconnectTimer) return;

    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(
      this.reconnectDelayMs * 2,
      RECONNECT_MAX_DELAY_MS,
    );
    syncLogger.debug("LocalNodeService", "Scheduling reconnect", {
      delay_ms: delay,
    });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectToElectedNode();
    }, delay);
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
      onRelayEvent: (event) => {
        // A client notified the node of a change (e.g. reference_data.changed
        // after editing the menu). Apply it locally so this node's cache and
        // UI stay in sync; the server already rebroadcast it to the other
        // terminals.
        applyReferenceChangeEvent(event, "lan").catch((error) => {
          syncLogger.error("LocalNodeService", "Failed to apply relayed reference change", {
            error: String(error),
            event_type: event.event_type,
          });
        });
      },
      onClientConnected: (info) => {
        useLocalNodeStore.getState().addConnectedClient({
          deviceId: info.deviceId,
          deviceName: info.deviceName,
          host: info.host,
          connectedAt: new Date().toISOString(),
        });
        syncLogger.info("LocalNodeService", "Client connected", {
          deviceId: info.deviceId,
          deviceName: info.deviceName,
          connected_clients:
            useLocalNodeStore.getState().connectedClients.length,
        });
      },
      onClientDisconnected: (deviceId) => {
        useLocalNodeStore.getState().removeConnectedClient(deviceId);
        syncLogger.info("LocalNodeService", "Client disconnected", {
          deviceId,
          connected_clients:
            useLocalNodeStore.getState().connectedClients.length,
        });
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
    // Clients only scan — never publish. Publishing a service with port 0
    // would advertise the client as a "node" and mislead other terminals.
    this.discovery.setOptions({
      deviceId: getAppInstanceId(),
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

    // Bump generation so callbacks from any previous socket are ignored.
    const generation = ++this.generation;
    this.connecting = true;
    this.clearReconnectTimer();
    this.clearConnectGuard();

    // Safety net: if the connect promise never settles (e.g. the socket
    // library swallows the error), release the single-flight lock so future
    // reconnect attempts are not blocked forever.
    this.connectGuardTimer = setTimeout(() => {
      this.connectGuardTimer = null;
      if (generation !== this.generation) return;
      if (!this.client?.isConnected() && this.connecting) {
        this.connecting = false;
        syncLogger.warn("LocalNodeService", "Connect guard released", {
          deviceId: node.deviceId,
        });
        this.scheduleReconnect();
      }
    }, CONNECT_GUARD_MS);

    this.electedNode = {
      deviceId: node.deviceId,
      host: node.host,
      port: node.port,
    };
    syncLogger.info("LocalNodeService", "Connecting to node", {
      deviceId: node.deviceId,
      host: node.host,
      port: node.port,
    });

    this.client?.disconnect();
    this.client = new LocalNodeClient({
      node: this.electedNode,
      businessId: this.businessId,
      secret: this.secret,
      onEvent: (event) => {
        syncLogger.event(event, "received", { origin: "lan" });
        // Apply LAN events (pending order broadcasts, reconciled orders) to
        // the pending-orders store and persistence layer.
        applyPendingOrderEvent(event, "lan").catch((error) => {
          syncLogger.error("LocalNodeService", "Failed to apply LAN event", {
            error: String(error),
            event_type: event.event_type,
          });
        });
        // Reference data changed on another device: re-sync the affected keys
        // and refresh caches so this terminal stays in sync.
        applyReferenceChangeEvent(event, "lan").catch((error) => {
          syncLogger.error(
            "LocalNodeService",
            "Failed to apply LAN reference change",
            {
              error: String(error),
              event_type: event.event_type,
            },
          );
        });
        // Order/delivery state changed on another device: refresh order caches
        // so every terminal shows the same order states.
        applyOrderStateChangeEvent(event, "lan").catch((error) => {
          syncLogger.error(
            "LocalNodeService",
            "Failed to apply LAN order state change",
            {
              error: String(error),
              event_type: event.event_type,
            },
          );
        });
      },
      onConnected: () => {
        if (generation !== this.generation) return;
        this.connecting = false;
        this.clearConnectGuard();
        this.reconnectDelayMs = RECONNECT_BASE_DELAY_MS;
        syncLogger.info("LocalNodeService", "Connected to elected node", {
          deviceId: node.deviceId,
        });
        // Stop scanning once connected to the Local Node; resume when the
        // connection drops so the client can find the node again.
        this.discovery.stopScanning();
        useConnectivityStore.getState().setCloudReachable("reachable");
      },
      onDisconnected: () => {
        if (generation !== this.generation) return;
        this.connecting = false;
        this.clearConnectGuard();
        this.client = null;
        this.electedNode = null;
        syncLogger.warn("LocalNodeService", "Disconnected from elected node");
        useConnectivityStore.getState().setCloudReachable("unreachable");
        this.discovery.startScanning();
        // Rejoin with backoff instead of an immediate hot retry loop. Discovery
        // events and the reconnect timer will keep trying until the node is up.
        this.scheduleReconnect();
      },
      onError: (error) => {
        if (generation !== this.generation) return;
        this.connecting = false;
        this.clearConnectGuard();
        syncLogger.debug("LocalNodeService", "Node connect error", {
          error: String(error),
        });
      },
    });

    this.client.connect().catch((error) => {
      if (generation !== this.generation) return;
      this.connecting = false;
      this.clearConnectGuard();
      syncLogger.debug("LocalNodeService", "Node connect failed, will retry", {
        error: String(error),
      });
      this.scheduleReconnect();
    });
  }

  async handleNodeCommand(command: Command): Promise<DomainEvent | null> {
    syncLogger.command(command, "executing", { via: "local_node" });

    const { isCloudReachable } = useConnectivityStore.getState();
    // Treat "unknown" as reachable so the node actually attempts the cloud
    // before falling back to the outbox. Previously only "reachable" forwarded
    // to the cloud, so the node (whose reachability is never set to
    // "reachable") always queued online orders locally.
    const cloudReachable =
      isCloudReachable === "reachable" || isCloudReachable === "unknown";

    let event: DomainEvent | null = null;

    if (cloudReachable) {
      // Forward to cloud via REST directly to avoid a loop through the Local
      // Node transport. If the cloud is slow, fall back to the outbox quickly
      // so the terminal stays responsive.
      try {
        const events = await withTimeout(
          restTransport.execute(command),
          CLOUD_COMMAND_TIMEOUT_MS,
        );
        event = events[0] ?? null;
      } catch (error) {
        syncLogger.warn("LocalNodeService", "Cloud forward failed, queueing", {
          error: String(error),
        });
        useConnectivityStore.getState().setCloudReachable("unreachable");
        event = await commandQueueService.enqueue(command);
      }
    } else {
      // Cloud unreachable: queue on the Local Node and return optimistic event.
      // Client terminals will display the same pending state.
      event = await commandQueueService.enqueue(command);
    }

    // Broadcast the resulting event to every connected terminal so the whole
    // LAN stays in sync (e.g. a queued order created on one device shows as
    // pending on all of them). This covers both client-sent commands (via the
    // server) and commands this node executes for itself.
    if (event) {
      this.server?.broadcast(event);
    }

    return event;
  }
}

export const localNodeService = new LocalNodeService();
