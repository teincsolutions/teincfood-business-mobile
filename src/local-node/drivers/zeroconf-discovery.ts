/**
 * Zeroconf discovery driver — RN Business side.
 * Implements core DiscoveryAdapter with listener-leak fix and proper logging.
 */

import Zeroconf from "react-native-zeroconf";
import { syncLogger } from "@teincfood/core";
import { getDeviceDisplayName } from "@/services/devices.service";
import type { DiscoveredNode } from "@teincfood/core";
import type { DiscoveryAdapter } from "@teincfood/core";
import { TcpSweepRunner, NODE_PROBE_PORT } from "./tcp-sweep";

const SERVICE_TYPE = "teincnode";
const SERVICE_PROTOCOL = "tcp";
const SERVICE_DOMAIN = "local.";

interface Opts {
  deviceId: string;
  deviceName?: string;
  onNodeFound: (node: DiscoveredNode) => void;
  onNodeLost: (deviceId: string) => void;
}

export class ZeroconfDiscovery implements DiscoveryAdapter {
  private zeroconf = new Zeroconf();
  private options: Opts | null = null;
  private publishOpts: (Opts & { port: number }) | null = null;
  private scanning = false;
  private published = false;
  /**
   * Pending loss reports by deviceId. mDNS browse flaps: a peer missing from
   * one browse window (record refresh gap) is usually still there, and the
   * mesh must not drop a discovered entry on a single miss — sockets (not
   * discovery) drive teardown. Mirrors the Node harness 8s grace. Cancelled
   * if the peer is re-resolved before the timer fires.
   */
  private pendingDown = new Map<string, ReturnType<typeof setTimeout>>();
  /**
   * Unicast sweep fallback (mirrors desktop tcp_sweep): mDNS browse is
   * best-effort cross-platform, so an empty browse window must not mean an
   * invisible peer. Runs only while scanning; core dedups sweep hits
   * against mDNS records by host:port.
   */
  private sweep: TcpSweepRunner | null = null;

  setOptions(opts: Opts): void {
    this.options = opts;
  }

  startPublishing(opts: Opts & { port: number }): void {
    if (!opts.port) throw new Error("ZeroconfDiscovery: publish requires port");
    this.publishOpts = opts;
    this.options = opts;
    this.published = true;
    try {
      this.zeroconf.publishService(
        SERVICE_TYPE,
        SERVICE_PROTOCOL,
        SERVICE_DOMAIN,
        opts.deviceId,
        opts.port,
        {
          deviceId: opts.deviceId,
          deviceName: opts.deviceName ?? getDeviceDisplayName(),
        },
      );
      syncLogger.info("LocalNodeDiscovery", "Publishing service", { type: SERVICE_TYPE, port: opts.port });
    } catch (error) {
      const errStr = String(error);
      if (errStr.includes("-72000") || errStr.includes("NSNetServicesErrorDomain")) {
        syncLogger.warn("LocalNodeDiscovery", "Publish skipped (simulator/mDNS unavailable)", { error: errStr });
        this.published = false;
      } else {
        syncLogger.error("LocalNodeDiscovery", "Publish failed", { error: errStr });
        this.published = false;
        throw error;
      }
    }
  }

  startScanning(): void {
    if (this.scanning) return;
    this.scanning = true;

    // FIX: remove old listeners to avoid leak on stop->start cycles
    try {
      const z = this.zeroconf as unknown as { removeAllListeners?: (e?: string) => void; removeListener?: (e: string, fn: unknown) => void };
      z.removeAllListeners?.("resolved");
      z.removeAllListeners?.("remove");
      z.removeAllListeners?.("error");
    } catch {}

    (this.zeroconf as unknown as { on: (e: string, fn: (s: unknown) => void) => void }).on("resolved", (service: unknown) => {
      const s = service as { txt?: Record<string, string>; name: string; host?: string | null; port: number; addresses?: string[] | null };
      const txt = s.txt ?? {};
      const deviceId = txt.deviceId ?? s.name;
      // Never discover self — the mDNS daemon sees its own publication on loopback
      if (deviceId === this.options?.deviceId) return;
      const deviceName = txt.deviceName;
      const port = s.port;
      const addresses = s.addresses ?? [];
      const rawHost = s.host;
      // Prefer IPv4 (dot, no colon, not fe80). If none, use mDNS hostname (rawHost) which
      // resolves via multicast and matches *.local in the pinned cert. Never use bare fe80
      // link-local without scope id — it always fails No route to host.
      const ipv4 = addresses.find((a) => a.includes(".") && !a.includes(":") && !a.startsWith("fe80"));
      const connectHost = ipv4 ?? (rawHost && !rawHost.startsWith("fe80") ? rawHost : null);
      if (!connectHost || !port) return;
      const node: DiscoveredNode = {
        deviceId,
        name: s.name,
        host: connectHost,
        port,
        deviceName,
        lastSeenAt: new Date().toISOString(),
      };
      syncLogger.debug("LocalNodeDiscovery", "Node found", { node, addresses: addresses ?? [] });
      // Re-resolved: cancel any pending loss report for this peer.
      const pending = this.pendingDown.get(deviceId);
      if (pending) {
        clearTimeout(pending);
        this.pendingDown.delete(deviceId);
      }
      this.options?.onNodeFound?.(node);
    });

    (this.zeroconf as unknown as { on: (e: string, fn: (s: unknown) => void) => void }).on("remove", (service: unknown) => {
      const s = service as { txt?: Record<string, string>; name: string };
      const txt = s.txt ?? {};
      const deviceId = txt.deviceId ?? s.name;
      syncLogger.debug("LocalNodeDiscovery", "Node lost (8s grace before report)", { deviceId });
      if (this.pendingDown.has(deviceId)) return;
      const t = setTimeout(() => {
        this.pendingDown.delete(deviceId);
        this.options?.onNodeLost?.(deviceId);
      }, 8000);
      this.pendingDown.set(deviceId, t);
    });

    (this.zeroconf as unknown as { on: (e: string, fn: (s: unknown) => void) => void }).on("error", (error: unknown) => {
      const errStr = String(error);
      if (errStr.includes("-72000") || errStr.includes("NSNetServicesErrorDomain")) return;
      syncLogger.error("LocalNodeDiscovery", "Discovery error", { error: errStr });
    });

    this.zeroconf.scan(SERVICE_TYPE, SERVICE_PROTOCOL, SERVICE_DOMAIN);
    syncLogger.info("LocalNodeDiscovery", "Scanning for nodes", { scanning: true });
    try {
      this.sweep?.stop();
      this.sweep = new TcpSweepRunner(NODE_PROBE_PORT, {
        onNodeFound: (node) => this.options?.onNodeFound?.(node),
      });
      this.sweep.start();
    } catch {}
  }

  stopScanning(): void {
    if (!this.scanning) return;
    this.scanning = false;
    try {
      this.sweep?.stop();
      this.sweep = null;
    } catch {}
    try {
      this.zeroconf.stop();
      // FIX: remove listeners after stop to prevent duplicates on next start
      try {
        const z = this.zeroconf as unknown as { removeAllListeners?: (e?: string) => void };
        z.removeAllListeners?.("resolved");
        z.removeAllListeners?.("remove");
        z.removeAllListeners?.("error");
      } catch {}
      syncLogger.info("LocalNodeDiscovery", "Stopped scanning for nodes", { scanning: false });
    } catch (error) {
      syncLogger.warn("LocalNodeDiscovery", "Error stopping scan", { error: String(error) });
    }
  }

  stop(): void {
    try {
      this.sweep?.stop();
      this.sweep = null;
    } catch {}
    for (const t of this.pendingDown.values()) {
      try { clearTimeout(t); } catch {}
    }
    this.pendingDown.clear();
    try {
      this.stopScanning();
      if (this.published && this.publishOpts) {
        this.zeroconf.unpublishService(this.publishOpts.deviceId);
      }
      this.published = false;
    } catch (error) {
      syncLogger.warn("LocalNodeDiscovery", "Error stopping discovery", { error: String(error) });
    }
  }
}
