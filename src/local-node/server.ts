/**
 * Local Node TCP server.
 *
 * Listens for incoming connections from other terminals and display clients on
 * the local network, receives commands, and broadcasts events.
 *
 * Uses react-native-tcp-socket.
 */

import TcpSocket from "react-native-tcp-socket";
import { syncLogger } from "@/utils/sync-logger";
import { generateUUID } from "@/utils/uuid";
import type { Command, DomainEvent } from "@/sync/types";
import type { LocalNodeMessage } from "./types";

type Server = ReturnType<typeof TcpSocket.createServer>;
type Socket = ReturnType<typeof TcpSocket.createConnection>;

export interface LocalNodeServerOptions {
  port: number;
  host?: string;
  onCommand?: (command: Command, socket: Socket) => Promise<DomainEvent[]>;
  onClientConnected?: (deviceId: string, socket: Socket) => void;
  onClientDisconnected?: (deviceId: string, socket: Socket) => void;
}

export class LocalNodeServer {
  private server: Server | null = null;
  private sockets = new Map<Socket, { deviceId: string | null }>();
  private options: LocalNodeServerOptions;

  constructor(options: LocalNodeServerOptions) {
    this.options = options;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server?.listening) {
        resolve();
        return;
      }

      try {
        this.server = TcpSocket.createServer((socket) => {
          this.handleSocket(socket);
        });

        this.server.on("error", (error) => {
          syncLogger.error("LocalNodeServer", "Server error", {
            error: String(error),
          });
          reject(error);
        });

        this.server.listen(
          { port: this.options.port, host: this.options.host ?? "0.0.0.0" },
          () => {
            syncLogger.info("LocalNodeServer", "Listening", {
              port: this.options.port,
              host: this.options.host ?? "0.0.0.0",
            });
            resolve();
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      for (const [socket] of this.sockets) {
        socket.destroy();
      }
      this.sockets.clear();

      this.server.close(() => {
        this.server = null;
        resolve();
      });
    });
  }

  broadcast(event: DomainEvent): void {
    const message: LocalNodeMessage = {
      type: "event",
      id: generateUUID(),
      payload: event,
    };
    const data = JSON.stringify(message) + "\n";

    for (const [socket] of this.sockets) {
      if (socket.readyState === "open") {
        socket.write(data);
      }
    }

    syncLogger.debug("LocalNodeServer", "Broadcast event", {
      event_type: event.event_type,
      clients: this.sockets.size,
    });
  }

  isListening(): boolean {
    return this.server?.listening ?? false;
  }

  getClientCount(): number {
    return this.sockets.size;
  }

  private handleSocket(socket: Socket): void {
    syncLogger.debug("LocalNodeServer", "Client connected", {
      address: socket.remoteAddress,
      port: socket.remotePort,
    });

    this.sockets.set(socket, { deviceId: null });

    let buffer = "";

    socket.on("data", (data) => {
      buffer += data.toString("utf-8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        this.handleLine(socket, line).catch((error) => {
          syncLogger.error("LocalNodeServer", "Error handling message", {
            error: String(error),
          });
        });
      }
    });

    socket.on("close", () => {
      const meta = this.sockets.get(socket);
      this.sockets.delete(socket);
      if (meta?.deviceId) {
        this.options.onClientDisconnected?.(meta.deviceId, socket);
      }
    });

    socket.on("error", (error) => {
      syncLogger.error("LocalNodeServer", "Socket error", {
        error: String(error),
      });
    });
  }

  private async handleLine(socket: Socket, line: string): Promise<void> {
    let message: LocalNodeMessage;
    try {
      message = JSON.parse(line) as LocalNodeMessage;
    } catch {
      return;
    }

    if (message.type === "hello") {
      const meta = this.sockets.get(socket);
      const deviceId = (message.payload as { deviceId: string }).deviceId;
      if (meta) {
        meta.deviceId = deviceId;
      }
      this.options.onClientConnected?.(deviceId, socket);
      this.send(socket, { type: "pong", id: generateUUID(), payload: {} });
      return;
    }

    if (message.type === "ping") {
      this.send(socket, { type: "pong", id: generateUUID(), payload: {} });
      return;
    }

    if (message.type === "command") {
      const command = message.payload as Command;
      const events = (await this.options.onCommand?.(command, socket)) ?? [];
      for (const event of events) {
        this.send(socket, {
          type: "event",
          id: generateUUID(),
          payload: event,
        });
      }
    }
  }

  private send(socket: Socket, message: LocalNodeMessage): void {
    if (socket.readyState === "open") {
      socket.write(JSON.stringify(message) + "\n");
    }
  }
}
