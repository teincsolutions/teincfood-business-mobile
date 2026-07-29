/**
 * Sync Engine orchestrator.
 *
 * Phase 1 responsibility: receive commands from repositories and route them
 * to the active transport (currently REST only).
 *
 * Future phases will add:
 *   - connectivity-aware transport selection
 *   - command outbox persistence
 *   - replay
 *   - Local Node transport
 *   - cloud reconciliation
 */

import type { Command, DomainEvent, Transport } from "@/sync/types";
import { restTransport } from "@/sync/transport-rest";
import { syncLogger } from "@/utils/sync-logger";

interface SyncEngineOptions {
  /** Ordered list of transports the engine may use. */
  transports: Transport[];
}

class SyncEngine {
  private transports: Transport[];
  private eventSubscribers: Array<(event: DomainEvent) => void> = [];

  constructor(options: SyncEngineOptions) {
    this.transports = options.transports;
  }

  /**
   * Execute a command through the appropriate transport.
   *
   * In Phase 1 this always uses the REST transport. Later phases will queue
   * or route to the Local Node based on connectivity.
   */
  async execute(command: Command): Promise<DomainEvent[]> {
    syncLogger.command(command, "issued");

    const transport = this.selectTransport(command);
    const events = await transport.execute(command);

    for (const event of events) {
      this.broadcast(event);
    }

    syncLogger.command(command, "completed", {
      event_count: events.length,
    });

    return events;
  }

  subscribe(handler: (event: DomainEvent) => void): () => void {
    this.eventSubscribers.push(handler);
    return () => {
      const index = this.eventSubscribers.indexOf(handler);
      if (index > -1) {
        this.eventSubscribers.splice(index, 1);
      }
    };
  }

  private selectTransport(_command: Command): Transport {
    // Phase 1: always use REST. Future phases will consider:
    //   - is cloud reachable? → REST
    //   - is local node available? → LocalNodeTransport
    //   - offline? → queue via QueuedTransport
    const transport = this.transports[0];
    if (!transport) {
      throw new Error("SyncEngine: no transports configured");
    }
    return transport;
  }

  private broadcast(event: DomainEvent): void {
    syncLogger.event(event, "broadcast");
    this.eventSubscribers.forEach((handler) => handler(event));
  }
}

export const syncEngine = new SyncEngine({
  transports: [restTransport],
});
