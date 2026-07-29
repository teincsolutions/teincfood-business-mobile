/**
 * Types for the Local Node / multi-terminal LAN layer.
 */

import type { Command, DomainEvent } from "@/sync/types";

export type LocalNodeMessageType =
  | "command"
  | "event"
  | "ping"
  | "pong"
  | "hello";

export interface LocalNodeMessage {
  type: LocalNodeMessageType;
  /** Unique message identifier. */
  id: string;
  payload: unknown;
}

export interface LocalNodeCommandMessage extends LocalNodeMessage {
  type: "command";
  payload: Command;
}

export interface LocalNodeEventMessage extends LocalNodeMessage {
  type: "event";
  payload: DomainEvent;
}

export interface LocalNodeHelloMessage extends LocalNodeMessage {
  type: "hello";
  payload: {
    deviceId: string;
    businessId?: string;
  };
}

export type LocalNodeConnectionState =
  | "disconnected"
  | "connecting"
  | "connected";

export interface LocalNodeInfo {
  deviceId: string;
  host: string;
  port: number;
  businessId?: string;
}
