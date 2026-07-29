/**
 * Client-side UUID generation for offline-first commands and events.
 *
 * Uses expo-crypto for deterministic cross-platform behavior.
 */

import { randomUUID } from "expo-crypto";

export function generateUUID(): string {
  return randomUUID();
}

export function generateCommandId(): string {
  return `cmd_${randomUUID()}`;
}

export function generateEventId(): string {
  return `evt_${randomUUID()}`;
}

export function generateEntityId(): string {
  return randomUUID();
}
