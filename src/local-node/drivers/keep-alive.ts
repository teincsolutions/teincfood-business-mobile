import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import type { KeepAliveAdapter } from "@teincfood/core";

export class ExpoKeepAlive implements KeepAliveAdapter {
  activate(tag: string): Promise<void> { return activateKeepAwake(tag).catch(() => undefined) as Promise<void>; }
  deactivate(tag: string): Promise<void> { return deactivateKeepAwake(tag).catch(() => undefined) as Promise<void>; }
}
