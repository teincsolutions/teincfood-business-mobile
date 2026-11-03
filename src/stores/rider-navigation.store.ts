import { create } from "zustand";

export interface RiderMapPoint {
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface RiderMapTarget {
  orderId?: string;
  orderNumber?: string;
  status?: string;
  pickup: RiderMapPoint;
  dropoff: RiderMapPoint;
}

export interface RiderNavigationTarget {
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  notes?: string;
  userId?: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  kind?: "pickup" | "dropoff";
}

interface RiderNavigationState {
  mapTarget: RiderMapTarget | null;
  navigationTarget: RiderNavigationTarget | null;
  setMapTarget: (target: RiderMapTarget | null) => void;
  clearMapTarget: () => void;
  setNavigationTarget: (target: RiderNavigationTarget | null) => void;
  clearNavigationTarget: () => void;
}

/**
 * Ephemeral cross-screen state for rider map/navigation flows.
 * Keeps full objects in memory instead of serialising them into route URLs.
 */
export const useRiderNavigationStore = create<RiderNavigationState>((set) => ({
  mapTarget: null,
  navigationTarget: null,
  setMapTarget: (mapTarget) => set({ mapTarget }),
  clearMapTarget: () => set({ mapTarget: null }),
  setNavigationTarget: (navigationTarget) => set({ navigationTarget }),
  clearNavigationTarget: () => set({ navigationTarget: null }),
}));
