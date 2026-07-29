/**
 * Local Node discovery via mDNS/Bonjour (zeroconf).
 *
 * The Local Node publishes a service; other terminals scan for it.
 */

import Zeroconf from "react-native-zeroconf";
import { syncLogger } from "@/utils/sync-logger";
import type { DiscoveredNode } from "@/stores/local-node.store";

const SERVICE_TYPE = "teincfood-local-node";
const SERVICE_PROTOCOL = "tcp";
const SERVICE_DOMAIN = "local.";

export interface DiscoveryOptions {
  deviceId: string;
  port: number;
  businessId?: string;
  onNodeFound?: (node: DiscoveredNode) => void;
  onNodeLost?: (deviceId: string) => void;
}

export class LocalNodeDiscovery {
  private zeroconf = new Zeroconf();
  private options: DiscoveryOptions | null = null;

  startPublishing(options: DiscoveryOptions): void {
    this.options = options;

    this.zeroconf.publishService(
      SERVICE_TYPE,
      SERVICE_PROTOCOL,
      SERVICE_DOMAIN,
      `${options.deviceId}.${SERVICE_DOMAIN}`,
      options.port,
      {
        deviceId: options.deviceId,
        businessId: options.businessId ?? "",
      },
    );

    syncLogger.info("LocalNodeDiscovery", "Publishing service", {
      type: SERVICE_TYPE,
      port: options.port,
    });
  }

  startScanning(): void {
    this.zeroconf.on("resolved", (service) => {
      const txt = service.txt ?? {};
      const deviceId = txt.deviceId ?? service.name;
      const businessId = txt.businessId;
      const host = service.host ?? service.addresses?.[0];
      const port = service.port;

      if (!host || !port) return;

      const node: DiscoveredNode = {
        deviceId,
        name: service.name,
        host,
        port,
        lastSeenAt: new Date().toISOString(),
      };

      syncLogger.debug("LocalNodeDiscovery", "Node found", { node });
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

  stop(): void {
    try {
      this.zeroconf.stop();
      if (this.options) {
        this.zeroconf.unpublishService(
          `${this.options.deviceId}.${SERVICE_DOMAIN}`,
        );
      }
    } catch (error) {
      syncLogger.warn("LocalNodeDiscovery", "Error stopping discovery", {
        error: String(error),
      });
    }
  }
}

export const localNodeDiscovery = new LocalNodeDiscovery();
