/**
 * Local Node discovery via mDNS/Bonjour (zeroconf).
 *
 * The Local Node publishes a service; other terminals scan for it.
 */

import Zeroconf from "react-native-zeroconf";
import { syncLogger } from "@teincfood/core";
import { getDeviceDisplayName } from "@/services/devices.service";
import type { DiscoveredNode } from "@/stores/local-node.store";

const SERVICE_TYPE = "teincnode";
const SERVICE_PROTOCOL = "tcp";
const SERVICE_DOMAIN = "local.";

export interface DiscoveryOptions {
  deviceId: string;
  port?: number;
  deviceName?: string;
  onNodeFound?: (node: DiscoveredNode) => void;
  onNodeLost?: (deviceId: string) => void;
}

export class LocalNodeDiscovery {
  private zeroconf = new Zeroconf();
  private options: DiscoveryOptions | null = null;
  private scanning = false;
  private published = false;

  startPublishing(options: DiscoveryOptions): void {
    if (!options.port) {
      throw new Error("LocalNodeDiscovery: publishService requires a port");
    }
    this.options = options;
    this.published = true;

    this.zeroconf.publishService(
      SERVICE_TYPE,
      SERVICE_PROTOCOL,
      SERVICE_DOMAIN,
      `${options.deviceId}.${SERVICE_DOMAIN}`,
      options.port,
      {
        deviceId: options.deviceId,
        deviceName: options.deviceName ?? getDeviceDisplayName(),
      },
    );

    syncLogger.info("LocalNodeDiscovery", "Publishing service", {
      type: SERVICE_TYPE,
      port: options.port,
    });
  }

  /** Register options for scan callbacks without publishing a service. */
  setOptions(options: DiscoveryOptions): void {
    this.options = options;
  }

  startScanning(): void {
    if (this.scanning) {
      return;
    }
    this.scanning = true;

    this.zeroconf.on("resolved", (service) => {
      const txt = service.txt ?? {};
      const deviceId = txt.deviceId ?? service.name;
      const deviceName = txt.deviceName;
      const port = service.port;

      // Prefer an IPv4 address for connecting. On iOS the mDNS hostname
      // (e.g. "iPhone.local.") can resolve to a link-local IPv6 address that
      // is unreachable without a scope id, which makes the TCP connect hang.
      const addresses = service.addresses ?? [];
      const connectHost =
        addresses.find((a) => !a.includes(":") && !a.startsWith("fe80")) ??
        addresses[0] ??
        service.host;

      if (!connectHost || !port) return;

      const node: DiscoveredNode = {
        deviceId,
        name: service.name,
        host: connectHost,
        port,
        deviceName,
        lastSeenAt: new Date().toISOString(),
      };

      syncLogger.debug("LocalNodeDiscovery", "Node found", {
        node,
        addresses,
      });
      this.options?.onNodeFound?.(node);
    });

    this.zeroconf.on("remove", (service) => {
      const txt = service.txt ?? {};
      const deviceId = txt.deviceId ?? service.name;
      syncLogger.debug("LocalNodeDiscovery", "Node removed", { deviceId });
      this.options?.onNodeLost?.(deviceId);
    });

    this.zeroconf.on("error", (error) => {
      syncLogger.error("LocalNodeDiscovery", "Discovery error", {
        error: String(error),
      });
    });

    this.zeroconf.scan(SERVICE_TYPE, SERVICE_PROTOCOL, SERVICE_DOMAIN);

    syncLogger.info("LocalNodeDiscovery", "Scanning for nodes");
  }

  stopScanning(): void {
    if (!this.scanning) {
      return;
    }
    this.scanning = false;

    try {
      this.zeroconf.stop();
      syncLogger.info("LocalNodeDiscovery", "Stopped scanning for nodes");
    } catch (error) {
      syncLogger.warn("LocalNodeDiscovery", "Error stopping scan", {
        error: String(error),
      });
    }
  }

  stop(): void {
    try {
      this.stopScanning();
      if (this.published && this.options) {
        this.zeroconf.unpublishService(
          `${this.options.deviceId}.${SERVICE_DOMAIN}`,
        );
      }
      this.published = false;
    } catch (error) {
      syncLogger.warn("LocalNodeDiscovery", "Error stopping discovery", {
        error: String(error),
      });
    }
  }
}

export const localNodeDiscovery = new LocalNodeDiscovery();
