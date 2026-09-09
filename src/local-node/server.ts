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
import { syncLogger } from "@teincfood/core";
import { generateUUID } from "@teincfood/core";
import { openSyncDatabase } from "@teincfood/core";
import { getReferenceData } from "@teincfood/core";
import type { Command, DomainEvent } from "@teincfood/core";
import type { LocalNodeMessage } from "./types";
import type { ReferenceDataKey, ReferenceDataRecord } from "@teincfood/core";
import { computeProof, generateNonce } from "./security";
import { patchTLSServerListen } from "./tls-listen-patch";

const SERVER_KEYSTORE = require("../../assets/tls/server-keystore.p12");
const SERVER_CERT = require("../../assets/tls/server-cert.pem");

/** Listen retry budget for EADDRINUSE (stale socket after reload/restart). */
const START_RETRY_ATTEMPTS = 3;
const START_RETRY_DELAYS_MS = [500, 1_000, 2_000];
/** Safety: never let server.close() hang a shutdown forever. */
const STOP_TIMEOUT_MS = 5_000;

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
  /**
   * Called when a client relays a notification event for rebroadcast. The
   * node should apply it locally; the rebroadcast itself is handled by the
   * server. The origin socket is excluded from the rebroadcast.
   */
  onRelayEvent?: (event: DomainEvent, socket: Socket) => void;
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

      let settled = false;

      const attemptListen = (attempt: number) => {
        const finishOk = (server: Server) => {
          if (settled) return;
          settled = true;
          this.server = server;
          syncLogger.info("LocalNodeServer", "Listening", {
            port: this.options.port,
            host: this.options.host ?? "0.0.0.0",
            tls: true,
          });
          resolve();
          this.selfCheck();
        };

        const finishErr = (server: Server | null, error: unknown) => {
          if (settled) return;
          settled = true;
          // Drop the broken listener so a later start/retry binds cleanly.
          try {
            if (server && typeof server.close === "function") server.close();
          } catch {
            // ignore
          }
          if (this.server === server) this.server = null;
          const code = (error as { code?: string })?.code;
          if (
            (code === "EADDRINUSE" ||
              String(error).includes("EADDRINUSE") ||
              String(error).includes("Address already in use")) &&
            attempt < START_RETRY_ATTEMPTS
          ) {
            const delay = START_RETRY_DELAYS_MS[attempt - 1] ?? 1_000;
            syncLogger.warn("LocalNodeServer", "Port busy, retrying listen", {
              port: this.options.port,
              attempt,
              delay_ms: delay,
            });
            setTimeout(() => attemptListen(attempt + 1), delay);
            return;
          }
          reject(error);
        };

        let server: Server;
        try {
          server = TcpSocket.createTLSServer(
            { keystore: SERVER_KEYSTORE },
            (socket) => {
              this.handleSocket(socket);
            },
          );
        } catch (error) {
          finishErr(null, error);
          return;
        }

        server.on("error", (error) => {
          syncLogger.error("LocalNodeServer", "Server error", {
            error: String(error),
          });
          finishErr(server, error);
        });

        server.listen(
          {
            port: this.options.port,
            host: this.options.host ?? "0.0.0.0",
            // Allow a TIME_WAIT-stale socket (e.g. left by a previous JS
            // bundle after a reload) to be rebound immediately.
            reuseAddress: true,
          },
          () => finishOk(server),
        );
      };

      attemptListen(1);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      const server = this.server;

      for (const [socket] of this.sockets) {
        socket.destroy();
      }
      this.sockets.clear();

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (this.server === server) this.server = null;
        resolve();
      };

      // The TLS server may not expose close() — guard against a never-firing
      // callback so shutdown can always proceed.
      const timer = setTimeout(finish, STOP_TIMEOUT_MS);
      if (typeof server.close === "function") {
        try {
          server.close(() => {
            clearTimeout(timer);
            finish();
          });
        } catch {
          clearTimeout(timer);
          finish();
        }
      } else {
        clearTimeout(timer);
        finish();
      }
    });
  }

  broadcast(event: DomainEvent, exceptSocket?: Socket): void {
    const message: LocalNodeMessage = {
      type: "event",
      id: generateUUID(),
      payload: event,
    };
    const data = JSON.stringify(message) + "\n";

    let sent = 0;
    for (const [socket, meta] of this.sockets) {
      if (socket === exceptSocket) continue;
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
        rejectUnauthorized: false,
        connectTimeout: 5000,
      } as never,
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

    if (message.type === "relay_event") {
      // Client-originated notification event (e.g. reference_data.changed):
      // rebroadcast to every other authenticated terminal and let the node
      // apply it locally. Exclude the origin so it does not double-process.
      if (!meta?.authenticated) {
        syncLogger.warn("LocalNodeServer", "Rejected relay from unauthenticated socket", {
          deviceId: meta?.deviceId,
        });
        return;
      }

      const event = message.payload as DomainEvent;
      syncLogger.info("LocalNodeServer", "Relaying event from client", {
        event_type: event.event_type,
        device_id: meta.deviceId,
      });
      this.broadcast(event, socket);
      this.options.onRelayEvent?.(event, socket);
      return;
    }

    if (message.type === "reference_fetch") {
      // Client asks for cached reference data so a no-internet terminal can
      // converge after a reference_data.changed event. Serve from the node's
      // durable SQLite cache (NOT the cloud) so this works on a fully dark LAN.
      if (!meta?.authenticated) {
        syncLogger.warn("LocalNodeServer", "Rejected reference fetch from unauthenticated socket", {
          deviceId: meta?.deviceId,
        });
        return;
      }

      const payload = message.payload as {
        businessId: string;
        keys?: ReferenceDataKey[];
      };
      const keys = payload.keys ?? [];
      syncLogger.info("LocalNodeServer", "Serving cached reference data", {
        keys,
        business_id: payload.businessId,
        device_id: meta.deviceId,
      });

      const data: Partial<Record<ReferenceDataKey, ReferenceDataRecord | null>> = {};
      try {
        const db = await openSyncDatabase();
        for (const key of keys) {
          data[key] = await getReferenceData<never>(db, payload.businessId, key);
        }
      } catch (error) {
        syncLogger.error("LocalNodeServer", "Failed to read reference cache", {
          error: String(error),
        });
      }

      this.send(socket, {
        type: "reference_response",
        id: message.id,
        payload: { data },
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
