/**
 * Local Node TCP client.
 *
 * Connects to a designated Local Node on the local network, sends commands,
 * and receives broadcast events.
 *
 * The connection is TLS-encrypted and authenticated via a challenge-response
 * handshake using a shared per-business secret (see server.ts for the protocol
 * sequence). The client does not resolve as connected until the node replies
 * `auth_ok`.
 */

import TcpSocket from "react-native-tcp-socket";
import { syncLogger } from "@/utils/sync-logger";
import { generateUUID } from "@/utils/uuid";
import { getAppInstanceId, getDeviceDisplayName } from "@/services/devices.service";
import type { Command, DomainEvent } from "@/sync/types";
import type { LocalNodeInfo, LocalNodeMessage } from "./types";
import { computeProof } from "./security";

const SERVER_CERT = require("../../assets/tls/server-cert.pem");

/** Timeout for the TLS connect + auth handshake. */
const CONNECT_TIMEOUT_MS = 10_000;

type Socket = ReturnType<typeof TcpSocket.connectTLS>;

/**
 * Best-effort raw TCP reachability probe. Distinguishes "the node is
 * unreachable at the TCP layer" from "TCP connects but the TLS handshake
 * stalls". Resolves with the round-trip time in ms on success, or `null` if
 * the port does not accept a plain connection within 3 seconds.
 */
function probeReachable(host: string, port: number): Promise<number | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let probe: ReturnType<typeof TcpSocket.createConnection> | null = null;
    const finish = (result: number | null) => {
      if (!probe) return;
      try {
        probe.destroy();
      } catch {
        // ignore
      }
      probe = null;
      resolve(result);
    };
    const timer = setTimeout(() => {
      syncLogger.warn("LocalNodeClient", "Raw TCP probe TIMEOUT", { host, port });
      finish(null);
    }, 3500);

    probe = TcpSocket.createConnection(
      { host, port, connectTimeout: 3000 },
      () => {
        clearTimeout(timer);
        const ms = Date.now() - startedAt;
        syncLogger.info("LocalNodeClient", "Raw TCP probe OK", { host, port, ms });
        finish(ms);
      },
    );

    probe.on("error", (error) => {
      clearTimeout(timer);
      syncLogger.warn("LocalNodeClient", "Raw TCP probe FAILED", {
        host,
        port,
        error: String(error),
      });
      finish(null);
    });
    probe.on("close", () => {
      clearTimeout(timer);
      finish(null);
    });
  });
}

export interface LocalNodeClientOptions {
  node: LocalNodeInfo;
  businessId: string;
  secret: string;
  onEvent?: (event: DomainEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export class LocalNodeClient {
  private socket: Socket | null = null;
  private options: LocalNodeClientOptions;
  private pendingReplies = new Map<
    string,
    { resolve: (events: DomainEvent[]) => void; reject: (error: Error) => void }
  >();
  private eventBuffer: DomainEvent[] = [];
  private eventHandler: ((event: DomainEvent) => void) | null = null;
  private authenticated = false;

  constructor(options: LocalNodeClientOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.socket) {
      return;
    }

    await probeReachable(this.options.node.host, this.options.node.port);

    return new Promise((resolve, reject) => {
      let settled = false;
      let socket: Socket;
      let timeout: ReturnType<typeof setTimeout>;
      const settle = (fn: () => void) => () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        fn();
      };

      // The connect promise must always settle: if neither auth_ok nor an
      // error arrives (e.g. the TLS handshake stalls), reject and destroy the
      // socket so the service can release its single-flight lock and retry.
      timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.socket = null;
        socket.destroy();
        const error = new Error("Local Node connect timeout");
        this.options.onError?.(error);
        reject(error);
      }, CONNECT_TIMEOUT_MS);

      socket = TcpSocket.connectTLS(
        {
          host: this.options.node.host,
          port: this.options.node.port,
          ca: SERVER_CERT,
          connectTimeout: CONNECT_TIMEOUT_MS,
        },
        () => {
          syncLogger.info("LocalNodeClient", "Connected to Local Node", {
            host: this.options.node.host,
            port: this.options.node.port,
          });
          this.send({
            type: "hello",
            id: generateUUID(),
            payload: {
              deviceId: getAppInstanceId(),
              deviceName: getDeviceDisplayName(),
              businessId: this.options.businessId,
            },
          });
        },
      );

      socket.on("data", (data) => {
        this.handleData(data.toString("utf-8"), settle(resolve), settle(reject));
      });

      socket.on("error", (error) => {
        syncLogger.error("LocalNodeClient", "Connection error", {
          error: String(error),
        });
        this.options.onError?.(error);
        settle(() => reject(error))();
      });

      socket.on("close", () => {
        syncLogger.info("LocalNodeClient", "Disconnected from Local Node");
        this.socket = null;
        this.authenticated = false;
        this.pendingReplies.clear();
        settle(() => undefined)();
        this.options.onDisconnected?.();
      });

      this.socket = socket;
    });
  }

  disconnect(): void {
    this.socket?.destroy();
    this.socket = null;
    this.authenticated = false;
    this.pendingReplies.clear();
  }

  isConnected(): boolean {
    return this.authenticated && this.socket?.readyState === "open";
  }

  execute(command: Command): Promise<DomainEvent[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error("Local Node client not authenticated"));
        return;
      }

      const messageId = generateUUID();
      this.pendingReplies.set(messageId, { resolve, reject });

      this.send({
        type: "command",
        id: messageId,
        payload: command,
      });

      // Timeout if Local Node does not respond within 10 seconds.
      setTimeout(() => {
        if (this.pendingReplies.has(messageId)) {
          this.pendingReplies.delete(messageId);
          reject(new Error("Local Node command timeout"));
        }
      }, 10_000);
    });
  }

  subscribe(handler: (event: DomainEvent) => void): void {
    this.eventHandler = handler;
    // Flush buffered events received before subscription.
    while (this.eventBuffer.length > 0) {
      handler(this.eventBuffer.shift()!);
    }
  }

  private handleData(
    data: string,
    resolve: () => void,
    reject: (error: Error) => void,
  ): void {
    const lines = data.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line) as LocalNodeMessage;
        this.handleMessage(message, resolve, reject);
      } catch {
        // Ignore malformed lines.
      }
    }
  }

  private handleMessage(
    message: LocalNodeMessage,
    resolve: () => void,
    reject: (error: Error) => void,
  ): void {
    if (message.type === "pong") {
      return;
    }

    if (message.type === "challenge") {
      const payload = message.payload as { nonce: string };
      computeProof(this.options.secret, payload.nonce)
        .then((proof) => {
          this.send({
            type: "auth",
            id: generateUUID(),
            payload: { nonce: payload.nonce, proof },
          });
        })
        .catch((error) => {
          reject(error as Error);
        });
      return;
    }

    if (message.type === "auth_ok") {
      this.authenticated = true;
      syncLogger.info("LocalNodeClient", "Authenticated with Local Node");
      // Report ourselves to the node so it records us as a connected terminal.
      this.send({
        type: "register",
        id: generateUUID(),
        payload: {
          deviceId: getAppInstanceId(),
          deviceName: getDeviceDisplayName(),
          businessId: this.options.businessId,
          connectedAt: new Date().toISOString(),
        },
      });
      this.options.onConnected?.();
      resolve();
      return;
    }

    if (message.type === "register_ack") {
      syncLogger.debug("LocalNodeClient", "Registered with Local Node");
      return;
    }

    if (message.type === "auth_fail") {
      const reason = (message.payload as { reason?: string }).reason;
      syncLogger.warn("LocalNodeClient", "Local Node rejected authentication", {
        reason,
      });
      const error = new Error(
        `Local Node authentication failed${reason ? `: ${reason}` : ""}`,
      );
      this.options.onError?.(error);
      reject(error);
      this.socket?.destroy();
      return;
    }

    if (message.type === "command_response") {
      const pending = this.pendingReplies.get(message.id);
      if (pending) {
        this.pendingReplies.delete(message.id);
        pending.resolve(message.payload as DomainEvent[]);
        syncLogger.info("LocalNodeClient", "Command response received", {
          message_id: message.id,
          event_count: (message.payload as DomainEvent[]).length,
        });
      }
      return;
    }

    if (message.type === "event") {
      const event = message.payload as DomainEvent;
      if (this.eventHandler) {
        this.eventHandler(event);
      } else {
        this.eventBuffer.push(event);
      }
      this.options.onEvent?.(event);
    }
  }

  private send(message: LocalNodeMessage): void {
    if (this.socket?.readyState === "open") {
      this.socket.write(JSON.stringify(message) + "\n");
    }
  }
}
