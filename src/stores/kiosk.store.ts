/**
 * Kiosk Store
 * Zustand store for kiosk-mode UI preferences
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";

interface KioskState {
  // UI preferences
  soundEnabled: boolean;
  autoRefresh: boolean;

  // Actions
  toggleSound: () => void;
  toggleAutoRefresh: () => void;
  reset: () => void;
}

const initialState = {
  soundEnabled: true,
  autoRefresh: true,
};

export const useKioskStore = create<KioskState>()(
  persist(
    (set) => ({
      ...initialState,

      toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

      toggleAutoRefresh: () =>
        set((state) => ({ autoRefresh: !state.autoRefresh })),

      reset: () => set(initialState),
    }),
    {
      name: "TeincFood Business-kiosk-store",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
