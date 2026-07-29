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
import { localNodeTransport } from "@/sync/transport-local-node";
import { commandQueueService } from "@/sync/command-queue.service";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { syncLogger } from "@/utils/sync-logger";

interface SyncEngineOptions {
  /** Ordered list of transports the engine may use. */
  transports: Transport[];
}

export class SyncEngine {
  private transports: Transport[];
  private eventSubscribers: Array<(event: DomainEvent) => void> = [];

  constructor(options: SyncEngineOptions) {
    this.transports = options.transports;
  }

  /**
   * Execute a command through the appropriate transport.
   *
   * Transport selection:
   *   - Cloud reachable and REST transport available → REST
   *   - Local Node enabled and available → LocalNodeTransport
   *   - Otherwise queue locally and return an optimistic event
   */
  async execute(command: Command): Promise<DomainEvent[]> {
    syncLogger.command(command, "issued");

    const strategy = this.resolveStrategy(command);

    if (strategy === "queue") {
      const event = await commandQueueService.enqueue(command);
      this.broadcast(event);
      return [event];
    }

    const transport = this.selectTransport(command, strategy);
    const events = await transport.execute(command);

    for (const event of events) {
      this.broadcast(event);
    }

    syncLogger.command(command, "completed", {
      event_count: events.length,
    });

    return events;
  }

  /**
   * Trigger replay of queued commands when connectivity returns.
   */
  async replayQueuedCommands(): Promise<void> {
    await commandQueueService.replay();
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

  private resolveStrategy(command: Command): "cloud" | "local_node" | "queue" {
    const { isCloudReachable, isOnline } = useConnectivityStore.getState();

    // Cloud-first when we believe it is reachable.
    if (isCloudReachable === "reachable" && restTransport.isAvailable()) {
      return "cloud";
    }

    // Local Node fallback when enabled and connected.
    if (localNodeTransport.isAvailable()) {
      return "local_node";
    }

    // No network at all: queue immediately.
    if (!isOnline) {
      return "queue";
    }

    // Network present but cloud status unknown or unreachable. Try cloud first;
    // a failed HTTP call will bubble up and the caller (e.g. queue replay) can
    // decide to retry. New commands issued while cloud is unknown are queued to
    // avoid blocking the UI on a flaky connection.
    if (isCloudReachable === "unreachable") {
      return "queue";
    }

    return "cloud";
  }

  private selectTransport(
    _command: Command,
    strategy: "cloud" | "local_node" | "queue",
  ): Transport {
    if (strategy === "local_node" && localNodeTransport.isAvailable()) {
      return localNodeTransport;
    }

    if (strategy === "cloud" && restTransport.isAvailable()) {
      return restTransport;
    }

    const transport = this.transports.find((t) => t.isAvailable()) ?? this.transports[0];
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
  transports: [restTransport, localNodeTransport],
});

commandQueueService.setSyncEngine(syncEngine);
