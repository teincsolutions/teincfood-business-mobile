import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import type { KeepAliveAdapter } from "@teincfood/core";

export class ExpoKeepAlive implements KeepAliveAdapter {
  activate(tag: string): Promise<void> {
    return activateKeepAwakeAsync(tag);
  }
  deactivate(tag: string): Promise<void> {
    return deactivateKeepAwake(tag);
  }
}
