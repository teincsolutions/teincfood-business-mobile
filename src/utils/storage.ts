/**
 * Storage shim — delegates pure logic to @teincfood/core but keeps
 * MMKV-backed sync API for backwards compat with existing consumers
 * (places.service, chat-service, order-number). Re-exports core async helpers.
 */
import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

// Real MMKV instance — satisfies @teincfood/chat-client MMKVStorage (needs clearAll etc.)
export const mmkvStorage = new MMKV();

export function getItem<T>(key: string): T | null {
  const value = mmkvStorage.getString(key);
  if (value == null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  mmkvStorage.set(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  mmkvStorage.delete(key);
}

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return mmkvStorage.set(name, value);
  },
  getItem: (name) => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return mmkvStorage.delete(name);
  },
};

// Re-export core async/KV helpers for new code (avoid name clash on sync getItem/setItem/removeItem)
export {
  kvGetItem,
  kvSetItem,
  kvRemoveItem,
  setKVDriver,
  getKVDriver,
} from "@teincfood/core/dist/adapters/kv";
export {
  getItemAsync,
  setItemAsync,
  removeItemAsync,
} from "@teincfood/core/dist/utils/storage";
export { getItemSync, setItemSync, removeItemSync } from "@teincfood/core/dist/adapters/kv";
