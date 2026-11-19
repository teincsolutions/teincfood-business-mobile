import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { rootZustandStorage } from "@/utils/storage";

export type CountrySource = "manual" | "device" | "locale" | "fallback";

export interface AppLocation {
  latitude: number;
  longitude: number;
  city: string;
  area: string;
  fullAddress: string;
  countryCode?: string;
  /**
   * How `countryCode` was chosen. Older app versions did not write this, so a
   * missing source means the value is legacy and should not win over fresh
   * device detection.
   */
  countrySource?: CountrySource;
}

interface LocationState {
  currentLocation: AppLocation | null;
  isHydrated: boolean;

  setCurrentLocation: (location: AppLocation) => void;
  clearLocation: () => void;
  hasLocation: () => boolean;
  setHydrated: (hydrated: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      isHydrated: false,

      setCurrentLocation: (location) => set({ currentLocation: location }),
      clearLocation: () => set({ currentLocation: null }),
      hasLocation: () => {
        const location = get().currentLocation;
        return Boolean(location && location.countryCode);
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "Teinc Food Business-location",
      storage: createJSONStorage(() => rootZustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({ currentLocation: state.currentLocation }),
    },
  ),
);
