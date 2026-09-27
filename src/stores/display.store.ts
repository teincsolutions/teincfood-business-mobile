import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";

interface DisplayStore {
  calloutDisplayEnabled: boolean;
  kitchenDisplayEnabled: boolean;
  /** Customer-facing secondary display (dual-screen POS). */
  customerDisplayEnabled: boolean;
  toggleCalloutDisplay: () => void;
  enableCalloutDisplay: () => void;
  disableCalloutDisplay: () => void;
  toggleKitchenDisplay: () => void;
  enableKitchenDisplay: () => void;
  disableKitchenDisplay: () => void;
  toggleCustomerDisplay: () => void;
  enableCustomerDisplay: () => void;
  disableCustomerDisplay: () => void;
}

export const useDisplayStore = create<DisplayStore>()(
  persist(
    (set) => ({
      calloutDisplayEnabled: false,
      kitchenDisplayEnabled: false,
      customerDisplayEnabled: false,
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
      toggleCustomerDisplay: () =>
        set((state) => ({
          customerDisplayEnabled: !state.customerDisplayEnabled,
        })),
      enableCustomerDisplay: () => set({ customerDisplayEnabled: true }),
      disableCustomerDisplay: () => set({ customerDisplayEnabled: false }),
    }),
    {
      name: "Teinc Food-display-settings",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
