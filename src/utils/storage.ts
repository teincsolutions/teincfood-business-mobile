import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Global shared MMKV instance
export const mmkvStorage = new MMKV();

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
