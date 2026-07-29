/**
 * Local Node TCP client.
 *
 * Connects to a designated Local Node on the local network, sends commands,
 * and receives broadcast events.
 */

import TcpSocket from "react-native-tcp-socket";
import { syncLogger } from "@/utils/sync-logger";
import { generateUUID } from "@/utils/uuid";
import { getAppInstanceId } from "@/services/devices.service";
import type { Command, DomainEvent } from "@/sync/types";
import type { LocalNodeInfo, LocalNodeMessage } from "./types";

type Socket = ReturnType<typeof TcpSocket.createConnection>;

export interface LocalNodeClientOptions {
  node: LocalNodeInfo;
  businessId?: string;
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

  constructor(options: LocalNodeClientOptions) {
    this.options = options;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        resolve();
        return;
      }

      const socket = TcpSocket.createConnection(
        { host: this.options.node.host, port: this.options.node.port },
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
              businessId: this.options.businessId,
            },
          });
          this.options.onConnected?.();
          resolve();
        },
      );

      socket.on("data", (data) => {
        this.handleData(data.toString("utf-8"));
      });

      socket.on("error", (error) => {
        syncLogger.error("LocalNodeClient", "Connection error", {
          error: String(error),
        });
        this.options.onError?.(error);
        reject(error);
      });

      socket.on("close", () => {
        syncLogger.info("LocalNodeClient", "Disconnected from Local Node");
        this.socket = null;
        this.options.onDisconnected?.();
      });

      this.socket = socket;
    });
  }

  disconnect(): void {
    this.socket?.destroy();
    this.socket = null;
    this.pendingReplies.clear();
  }

  isConnected(): boolean {
    return this.socket?.readyState === "open";
  }

  execute(command: Command): Promise<DomainEvent[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== "open") {
        reject(new Error("Local Node client not connected"));
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

  private handleData(data: string): void {
    let buffer = "";
    const lines = data.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line) as LocalNodeMessage;
        this.handleMessage(message);
      } catch {
        // Ignore malformed lines.
      }
    }
  }

  private handleMessage(message: LocalNodeMessage): void {
    if (message.type === "pong") {
      return;
    }

    if (message.type === "command_response") {
      const pending = this.pendingReplies.get(message.id);
      if (pending) {
        this.pendingReplies.delete(message.id);
        pending.resolve(message.payload as DomainEvent[]);
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
