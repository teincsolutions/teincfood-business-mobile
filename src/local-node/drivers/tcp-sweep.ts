/**
 * TCP-sweep fallback for LAN discovery (mirrors desktop discovery.rs
 * tcp_sweep). mDNS browse/publish is best-effort cross-platform — when a
 * browse window yields nothing, unicast-probe the local /24 for the
 * well-known node port. Hits are reported as synthetic `lan-{ip}` nodes;
 * core dedups by host:port and promotes to the real deviceId on handshake.
 *
 * Runs only while the owning discovery driver is scanning. Quiet by design:
 * misses log nothing, hits log once.
 */

import TcpSocket from "react-native-tcp-socket";
import * as Network from "expo-network";
import { syncLogger } from "@teincfood/core";
import type { DiscoveredNode } from "@teincfood/core";

export const NODE_PROBE_PORT = 44621;
const SWEEP_INTERVAL_MS = 20_000;
const SWEEP_INITIAL_DELAY_MS = 5_000;
const PROBE_TIMEOUT_MS = 600;
const PROBE_CONCURRENCY = 48;

function probe(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    let socket: ReturnType<typeof TcpSocket.createConnection> | null = null;
    const finish = (hit: boolean) => {
      if (!socket) return;
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      socket = null;
      resolve(hit);
    };
    const timer = setTimeout(() => finish(false), PROBE_TIMEOUT_MS);
    try {
      socket = TcpSocket.createConnection(
        { host, port, connectTimeout: PROBE_TIMEOUT_MS },
        () => {
          clearTimeout(timer);
          finish(true);
        },
      );
      socket.on("error", () => {
        clearTimeout(timer);
        finish(false);
      });
      socket.on("close", () => {
        clearTimeout(timer);
        finish(false);
      });
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });
}

async function localSubnet(): Promise<{ base: string; ownIp: string } | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    const m = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})$/);
    if (!m) return null;
    if (m[1].startsWith("127.")) return null;
    return { base: m[1], ownIp: ip };
  } catch {
    return null;
  }
}

export interface SweepCallbacks {
  onNodeFound: (node: DiscoveredNode) => void;
}

/**
 * One sweep pass over the local /24. Resolves when done; reports hits.
 */
export async function sweepOnce(
  port: number,
  cbs: SweepCallbacks,
): Promise<number> {
  const subnet = await localSubnet();
  if (!subnet) return 0;
  const { base, ownIp } = subnet;
  const hosts: string[] = [];
  for (let i = 1; i <= 254; i++) {
    const h = `${base}.${i}`;
    // Never report self: core dedups by deviceId, and a synthetic lan-{ip}
    // entry for our own address would make us dial our own server.
    if (h === ownIp) continue;
    hosts.push(h);
  }
  let hits = 0;
  for (let i = 0; i < hosts.length; i += PROBE_CONCURRENCY) {
    const batch = hosts.slice(i, i + PROBE_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (host) => ({ host, hit: await probe(host, port) })),
    );
    for (const r of results) {
      if (!r.hit) continue;
      hits++;
      syncLogger.info("LocalNodeSweep", "Node port open", { host: r.host, port });
      try {
        cbs.onNodeFound({
          deviceId: `lan-${r.host}`,
          name: `lan-${r.host}`,
          host: r.host,
          port,
          lastSeenAt: new Date().toISOString(),
        });
      } catch {}
    }
  }
  return hits;
}

/**
 * Periodic sweep runner. Start/stop with the owning driver's scanning
 * lifecycle. First pass is delayed so mDNS gets the first chance.
 */
export class TcpSweepRunner {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private inFlight = false;

  constructor(
    private readonly port: number,
    private readonly cbs: SweepCallbacks,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    const tick = async () => {
      this.timer = null;
      if (!this.running) return;
      if (!this.inFlight) {
        this.inFlight = true;
        try {
          await sweepOnce(this.port, this.cbs);
        } catch {}
        this.inFlight = false;
      }
      if (this.running) {
        this.timer = setTimeout(tick, SWEEP_INTERVAL_MS);
      }
    };
    this.timer = setTimeout(tick, SWEEP_INITIAL_DELAY_MS);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
