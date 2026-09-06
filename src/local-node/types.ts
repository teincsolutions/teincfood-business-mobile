/**
 * Types for the Local Node / multi-terminal LAN layer.
 */

import type { Command, DomainEvent } from "@teincfood/core";
import type {
  ReferenceDataKey,
  ReferenceDataRecord,
} from "@teincfood/core";

export type LocalNodeMessageType =
  | "command"
  | "command_response"
  | "event"
  | "relay_event"
  | "ping"
  | "pong"
  | "hello"
  | "challenge"
  | "auth"
  | "auth_ok"
  | "auth_fail"
  | "register"
  | "register_ack"
  | "reference_fetch"
  | "reference_response";

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

/**
 * Client-originated notification event (e.g. `reference_data.changed`) sent to
 * the node so it can be rebroadcast to every connected terminal. The node
 * treats it like a locally-published event but does not echo it back to the
 * origin socket.
 */
export interface LocalNodeRelayEventMessage extends LocalNodeMessage {
  type: "relay_event";
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

/**
 * Client → node: request cached reference data (menus, tax rules, members,
 * etc.) so an internet-less terminal can still converge on fresh reference
 * data after a `reference_data.changed` event. The node serves from its own
 * durable SQLite cache (local origin) — not the cloud — so this works with no
 * internet on either side of the LAN.
 */
export interface LocalNodeReferenceFetchMessage extends LocalNodeMessage {
  type: "reference_fetch";
  payload: {
    businessId: string;
    keys: ReferenceDataKey[];
  };
}

/** Node → client: cached reference data for the requested keys. */
export interface LocalNodeReferenceResponseMessage extends LocalNodeMessage {
  type: "reference_response";
  payload: {
    data: Partial<Record<ReferenceDataKey, ReferenceDataRecord | null>>;
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
