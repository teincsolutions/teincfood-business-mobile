import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Global shared MMKV instance
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

/**
 * Custom storage engine for Zustand's `persist` middleware using react-native-mmkv
 * for extremely fast synchronous storage.
 */
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
