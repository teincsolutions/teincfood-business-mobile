import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";

interface DisplayStore {
  calloutDisplayEnabled: boolean;
  kitchenDisplayEnabled: boolean;
  toggleCalloutDisplay: () => void;
  enableCalloutDisplay: () => void;
  disableCalloutDisplay: () => void;
  toggleKitchenDisplay: () => void;
  enableKitchenDisplay: () => void;
  disableKitchenDisplay: () => void;
}

export const useDisplayStore = create<DisplayStore>()(
  persist(
    (set) => ({
      calloutDisplayEnabled: false,
      kitchenDisplayEnabled: false,
      toggleCalloutDisplay: () =>
        set((state) => ({
          calloutDisplayEnabled: !state.calloutDisplayEnabled,
        })),
      enableCalloutDisplay: () => set({ calloutDisplayEnabled: true }),
      disableCalloutDisplay: () => set({ calloutDisplayEnabled: false }),
      toggleKitchenDisplay: () =>
        set((state) => ({
          kitchenDisplayEnabled: !state.kitchenDisplayEnabled,
        })),
      enableKitchenDisplay: () => set({ kitchenDisplayEnabled: true }),
      disableKitchenDisplay: () => set({ kitchenDisplayEnabled: false }),
    }),
    {
      name: "TeincFood-display-settings",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
