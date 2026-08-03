/**
 * Local Node TCP server.
 *
 * Listens for incoming connections from other terminals and display clients on
 * the local network, receives commands, and broadcasts events.
 *
 * Connections are TLS-encrypted and authenticated via a challenge-response
 * handshake using a shared per-business secret:
 *   1. Client sends `hello` with deviceId/deviceName/businessId.
 *   2. Server rejects the connection if the business does not match.
 *   3. Server replies with a `challenge` containing a random nonce.
 *   4. Client replies with `auth` carrying `proof = SHA256(nonce:secret)`.
 *   5. Server verifies the proof and either marks the socket authenticated
 *      (`auth_ok`) or closes it (`auth_fail`).
 *
 * Only authenticated sockets may send commands or receive broadcast events.
 *
 * Uses react-native-tcp-socket.
 */

import TcpSocket from "react-native-tcp-socket";
import { syncLogger } from "@/utils/sync-logger";
import { generateUUID } from "@/utils/uuid";
import type { Command, DomainEvent } from "@/sync/types";
import type { LocalNodeMessage } from "./types";
import { computeProof, generateNonce } from "./security";
import { patchTLSServerListen } from "./tls-listen-patch";

const SERVER_KEYSTORE = require("../../assets/tls/server-keystore.p12");
const SERVER_CERT = require("../../assets/tls/server-cert.pem");

type Server = ReturnType<typeof TcpSocket.createTLSServer>;
type Socket = ReturnType<typeof TcpSocket.createConnection>;

interface SocketMeta {
  deviceId: string | null;
  deviceName?: string;
  businessId?: string;
  authenticated: boolean;
  nonce?: string;
}

export interface LocalNodeServerOptions {
  port: number;
  host?: string;
  businessId: string;
  secret: string;
  onCommand?: (command: Command, socket: Socket) => Promise<DomainEvent[]>;
  onClientConnected?: (
    info: { deviceId: string; deviceName?: string; host?: string },
    socket: Socket,
  ) => void;
  onClientDisconnected?: (deviceId: string, socket: Socket) => void;
}

export class LocalNodeServer {
  private server: Server | null = null;
  private sockets = new Map<Socket, SocketMeta>();
  private options: LocalNodeServerOptions;

  constructor(options: LocalNodeServerOptions) {
    this.options = options;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      patchTLSServerListen();

      if (this.server?.listening) {
        resolve();
        return;
      }

      try {
        this.server = TcpSocket.createTLSServer(
          { keystore: SERVER_KEYSTORE },
          (socket) => {
            this.handleSocket(socket);
          },
        );

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
              tls: true,
            });
            resolve();
            this.selfCheck();
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

    let sent = 0;
    for (const [socket, meta] of this.sockets) {
      if (meta.authenticated && socket.readyState === "open") {
        socket.write(data);
        sent += 1;
      }
    }

    syncLogger.debug("LocalNodeServer", "Broadcast event", {
      event_type: event.event_type,
      clients: sent,
    });
  }

  isListening(): boolean {
    return this.server?.listening ?? false;
  }

  getClientCount(): number {
    let count = 0;
    for (const meta of this.sockets.values()) {
      if (meta.authenticated) count += 1;
    }
    return count;
  }

  /**
   * Loopback TLS self-check: connects to our own listener with the same CA
   * cert a real client would use. Proves on-device listener + TLS integrity
   * without a second phone. If the server's own listener cannot complete a
   * TLS handshake with itself, no remote terminal ever will.
   */
  private selfCheck(): void {
    const startedAt = Date.now();
    let settled = false;
    let socket: ReturnType<typeof TcpSocket.connectTLS>;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      syncLogger.warn("LocalNodeServer", "Self-check TLS TIMEOUT", {
        port: this.options.port,
      });
    }, 5000);

    socket = TcpSocket.connectTLS(
      {
        host: "127.0.0.1",
        port: this.options.port,
        ca: SERVER_CERT,
        connectTimeout: 5000,
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const ms = Date.now() - startedAt;
        syncLogger.info("LocalNodeServer", "Self-check TLS OK", {
          port: this.options.port,
          ms,
        });
        socket.destroy();
      },
    );

    socket.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      syncLogger.error("LocalNodeServer", "Self-check TLS FAILED", {
        port: this.options.port,
        error: String(error),
      });
      socket.destroy();
    });
  }

  private handleSocket(socket: Socket): void {
    syncLogger.debug("LocalNodeServer", "Client connected", {
      address: socket.remoteAddress,
      port: socket.remotePort,
    });

    this.sockets.set(socket, {
      deviceId: null,
      authenticated: false,
    });

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
        // Ignore stale close events: a reconnecting terminal may open a new
        // authenticated socket before its previous socket's close event is
        // delivered. The device is still connected, so don't report it as
        // disconnected while another authenticated socket for it is alive.
        const stillConnected = [...this.sockets.values()].some(
          (other) =>
            other.deviceId === meta.deviceId && other.authenticated,
        );
        if (!stillConnected) {
          this.options.onClientDisconnected?.(meta.deviceId, socket);
        }
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

    const meta = this.sockets.get(socket);

    if (message.type === "hello") {
      const payload = message.payload as {
        deviceId: string;
        deviceName?: string;
        businessId?: string;
      };
      const deviceId = payload.deviceId;

      if (payload.businessId !== this.options.businessId) {
        syncLogger.warn("LocalNodeServer", "Rejected connection from foreign business", {
          deviceId,
          businessId: payload.businessId,
        });
        this.send(socket, {
          type: "auth_fail",
          id: generateUUID(),
          payload: { reason: "business_mismatch" },
        });
        socket.destroy();
        return;
      }

      const nonce = await generateNonce();
      if (meta) {
        meta.deviceId = deviceId;
        meta.deviceName = payload.deviceName;
        meta.businessId = payload.businessId;
        meta.nonce = nonce;
      }
      this.send(socket, {
        type: "challenge",
        id: generateUUID(),
        payload: { nonce },
      });
      return;
    }

    if (message.type === "auth") {
      if (!meta || !meta.nonce) return;

      const payload = message.payload as { nonce: string; proof: string };
      const expected = await computeProof(this.options.secret, payload.nonce);
      if (expected === payload.proof) {
        meta.authenticated = true;
        meta.nonce = undefined;
        this.options.onClientConnected?.(
          {
            deviceId: meta.deviceId ?? "unknown",
            deviceName: meta.deviceName,
            host: socket.remoteAddress,
          },
          socket,
        );
        this.send(socket, { type: "auth_ok", id: generateUUID(), payload: {} });
        return;
      }

      syncLogger.warn("LocalNodeServer", "Rejected connection: bad proof", {
        deviceId: meta.deviceId,
      });
      this.send(socket, {
        type: "auth_fail",
        id: generateUUID(),
        payload: { reason: "invalid_proof" },
      });
      socket.destroy();
      return;
    }

    if (message.type === "ping") {
      this.send(socket, { type: "pong", id: generateUUID(), payload: {} });
      return;
    }

    if (message.type === "register") {
      // Client self-report: once a client authenticates it announces itself so
      // the node records it as a connected terminal. Re-announcing refreshes
      // the entry (the store dedupes by deviceId).
      if (!meta?.authenticated) return;
      const payload = message.payload as {
        deviceId?: string;
        deviceName?: string;
        connectedAt?: string;
      };
      meta.deviceId = payload.deviceId ?? meta.deviceId ?? null;
      meta.deviceName = payload.deviceName ?? meta.deviceName;
      syncLogger.info("LocalNodeServer", "Client registered", {
        deviceId: meta.deviceId,
        deviceName: meta.deviceName,
      });
      this.options.onClientConnected?.(
        {
          deviceId: meta.deviceId ?? "unknown",
          deviceName: meta.deviceName,
          host: socket.remoteAddress,
        },
        socket,
      );
      this.send(socket, {
        type: "register_ack",
        id: message.id,
        payload: {},
      });
      return;
    }

    if (message.type === "command") {
      if (!meta?.authenticated) {
        syncLogger.warn("LocalNodeServer", "Rejected command from unauthenticated socket", {
          deviceId: meta?.deviceId,
        });
        this.send(socket, {
          type: "auth_fail",
          id: generateUUID(),
          payload: { reason: "unauthenticated" },
        });
        return;
      }

      const command = message.payload as Command;
      syncLogger.info("LocalNodeServer", "Executing command from client", {
        command_type: command.command_type,
        command_id: command.command_id,
        device_id: meta.deviceId,
      });
      const events = (await this.options.onCommand?.(command, socket)) ?? [];
      this.send(socket, {
        type: "command_response",
        id: message.id,
        payload: events,
      });
      syncLogger.info("LocalNodeServer", "Command response sent", {
        command_id: command.command_id,
        event_count: events.length,
      });
    }
  }

  private send(socket: Socket, message: LocalNodeMessage): void {
    if (socket.readyState === "open") {
      socket.write(JSON.stringify(message) + "\n");
    }
  }
}
