import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FleetManager, FleetVehicle, FleetRider, FleetDashboard } from '@/models/fleet.model';
import { zustandStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';

interface FleetState {
  // Fleet profile
  fleet: FleetManager | null;
  
  // Vehicles
  vehicles: FleetVehicle[];
  
  // Riders
  riders: FleetRider[];
  
  // Dashboard data
  dashboard: FleetDashboard | null;
  
  // Hydration state
  isHydrated: boolean;

  // Actions - Fleet
  setFleet: (fleet: FleetManager | null) => void;
  updateFleet: (updates: Partial<FleetManager>) => void;
  clearFleet: () => void;
  
  // Actions - Vehicles
  setVehicles: (vehicles: FleetVehicle[]) => void;
  addVehicle: (vehicle: FleetVehicle) => void;
  updateVehicle: (id: string, updates: Partial<FleetVehicle>) => void;
  removeVehicle: (id: string) => void;
  
  // Actions - Riders
  setRiders: (riders: FleetRider[]) => void;
  addRider: (rider: FleetRider) => void;
  updateRider: (id: string, updates: Partial<FleetRider>) => void;
  removeRider: (id: string) => void;
  
  // Actions - Dashboard
  setDashboard: (dashboard: FleetDashboard | null) => void;
  
  // Actions - Hydration
  setHydrated: (hydrated: boolean) => void;
  
  // Computed
  getVehicleById: (id: string) => FleetVehicle | undefined;
  getRiderById: (id: string) => FleetRider | undefined;
  getAvailableVehicles: () => FleetVehicle[];
  getOnlineRiders: () => FleetRider[];
  getActiveRiders: () => FleetRider[];
}

export const useFleetStore = create<FleetState>()(
  persist(
    (set, get) => ({
      fleet: null,
      vehicles: [],
      riders: [],
      dashboard: null,
      isHydrated: false,

      // Fleet actions
      setFleet: (fleet) => set({ fleet }),

      updateFleet: (updates) =>
        set((state) => ({
          fleet: state.fleet ? { ...state.fleet, ...updates } : null,
        })),

      clearFleet: () => set({ fleet: null, vehicles: [], riders: [], dashboard: null }),

      // Vehicle actions
      setVehicles: (vehicles) => set({ vehicles }),

      addVehicle: (vehicle) =>
        set((state) => ({
          vehicles: [...state.vehicles, vehicle],
        })),

      updateVehicle: (id, updates) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),

      removeVehicle: (id) =>
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
        })),

      // Rider actions
      setRiders: (riders) => set({ riders }),

      addRider: (rider) =>
        set((state) => ({
          riders: [...state.riders, rider],
        })),

      updateRider: (id, updates) =>
        set((state) => ({
          riders: state.riders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      removeRider: (id) =>
        set((state) => ({
          riders: state.riders.filter((r) => r.id !== id),
        })),

      // Dashboard actions
      setDashboard: (dashboard) => set({ dashboard }),

      // Hydration
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      // Computed
      getVehicleById: (id) => get().vehicles.find((v) => v.id === id),

      getRiderById: (id) => get().riders.find((r) => r.id === id),

      getAvailableVehicles: () => get().vehicles.filter((v) => v.isActive && !v.assignedRiderId),

      getOnlineRiders: () => get().riders.filter((r) => r.status === 'active'),

      getActiveRiders: () => get().riders.filter((r) => r.status === 'active'),
    }),
    {
      name: STORAGE_KEYS.FLEET_DATA,
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        fleet: state.fleet,
        vehicles: state.vehicles,
        riders: state.riders,
        dashboard: state.dashboard,
      }),
    }
  )
);