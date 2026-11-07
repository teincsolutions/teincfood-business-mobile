/**
 * TCP transport driver — wraps existing RN LocalNodeServer / LocalNodeClient
 * to satisfy core TransportAdapter.
 */

import { LocalNodeServer } from "../server";
import { LocalNodeClient } from "../client";
import type { TransportAdapter, LocalNodeServer as CoreServer, LocalNodeClient as CoreClient } from "@teincfood/core";
import type { Command, DomainEvent } from "@teincfood/core";

export class TcpTransport implements TransportAdapter {
  createServer(opts: {
    port: number;
    businessId: string;
    secret: string;
    onCommand: (command: Command) => Promise<DomainEvent[]>;
    onRelayEvent: (event: DomainEvent) => void;
    onClientConnected: (info: { deviceId: string; deviceName?: string; host?: string }) => void;
    onClientDisconnected: (deviceId: string) => void;
  }): CoreServer {
    const server = new LocalNodeServer({
      port: opts.port,
      businessId: opts.businessId,
      secret: opts.secret,
      onCommand: opts.onCommand,
      onRelayEvent: opts.onRelayEvent,
      onClientConnected: opts.onClientConnected,
      onClientDisconnected: opts.onClientDisconnected,
    });
    return {
      start: () => server.start(),
      stop: () => server.stop(),
      isListening: () => server.isListening(),
      broadcast: (event: DomainEvent) => server.broadcast(event),
    };
  }

  createClient(opts: {
    node: { deviceId: string; host: string; port: number };
    businessId: string;
    secret: string;
    onEvent: (event: DomainEvent) => void;
    onConnected: () => void;
    onDisconnected: () => void;
    onError: (error: unknown) => void;
  }): CoreClient {
    const client = new LocalNodeClient({
      node: opts.node as unknown as import("../types").LocalNodeInfo,
      businessId: opts.businessId,
      secret: opts.secret,
      onEvent: opts.onEvent,
      onConnected: opts.onConnected,
      onDisconnected: opts.onDisconnected,
      onError: opts.onError,
    });
    return {
      connect: () => client.connect(),
      disconnect: () => client.disconnect(),
      isConnected: () => client.isConnected(),
      execute: (cmd: Command) => client.execute(cmd),
      requestReferenceData: (businessId: string, keys: import("@teincfood/core").ReferenceDataKey[]) =>
        client.requestReferenceData(businessId, keys),
      requestAsset: (businessId: string, url: string) => client.requestAsset(businessId, url),
      putAsset: (businessId: string, url: string, base64: string) =>
        client.putAsset(businessId, url, base64),
      publishEvent: (event: DomainEvent) => client.publishEvent(event),
    };
  }
}
