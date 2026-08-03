/**
 * Types for the Local Node / multi-terminal LAN layer.
 */

import type { Command, DomainEvent } from "@/sync/types";

export type LocalNodeMessageType =
  | "command"
  | "command_response"
  | "event"
  | "ping"
  | "pong"
  | "hello"
  | "challenge"
  | "auth"
  | "auth_ok"
  | "auth_fail"
  | "register"
  | "register_ack";

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

export interface LocalNodeCommandResponseMessage extends LocalNodeMessage {
  type: "command_response";
  payload: DomainEvent[];
}

export interface LocalNodeEventMessage extends LocalNodeMessage {
  type: "event";
  payload: DomainEvent;
}

export interface LocalNodeHelloMessage extends LocalNodeMessage {
  type: "hello";
  payload: {
    deviceId: string;
    deviceName?: string;
    businessId?: string;
  };
}

export interface LocalNodeChallengeMessage extends LocalNodeMessage {
  type: "challenge";
  payload: {
    nonce: string;
  };
}

export interface LocalNodeAuthMessage extends LocalNodeMessage {
  type: "auth";
  payload: {
    nonce: string;
    proof: string;
  };
}

export interface LocalNodeAuthOkMessage extends LocalNodeMessage {
  type: "auth_ok";
  payload: Record<string, never>;
}

export interface LocalNodeAuthFailMessage extends LocalNodeMessage {
  type: "auth_fail";
  payload: {
    reason?: string;
  };
}

/**
 * Client self-report sent right after `auth_ok`. The client announces itself
 * to the node so the node records it as a connected terminal.
 */
export interface LocalNodeRegisterMessage extends LocalNodeMessage {
  type: "register";
  payload: {
    deviceId: string;
    deviceName?: string;
    businessId?: string;
    connectedAt: string;
  };
}

export interface LocalNodeRegisterAckMessage extends LocalNodeMessage {
  type: "register_ack";
  payload: Record<string, never>;
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
