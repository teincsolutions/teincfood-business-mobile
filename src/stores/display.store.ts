import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";

interface DisplayStore {
  calloutDisplayEnabled: boolean;
  toggleCalloutDisplay: () => void;
  enableCalloutDisplay: () => void;
  disableCalloutDisplay: () => void;
}

export const useDisplayStore = create<DisplayStore>()(
  persist(
    (set) => ({
      calloutDisplayEnabled: false,
      toggleCalloutDisplay: () =>
        set((state) => ({
          calloutDisplayEnabled: !state.calloutDisplayEnabled,
        })),
      enableCalloutDisplay: () => set({ calloutDisplayEnabled: true }),
      disableCalloutDisplay: () => set({ calloutDisplayEnabled: false }),
    }),
    {
      name: "TeincFood-display-settings",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
