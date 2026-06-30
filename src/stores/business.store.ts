import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Business, BusinessSummary } from '@/types/business.model';
import { zustandStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';

interface BusinessState {
  // Business list for this seller
  businesses: BusinessSummary[];
  
  // Currently selected business
  activeBusiness: Business | null;
  
  // Hydration state
  isHydrated: boolean;

  // Actions
  setBusinesses: (businesses: BusinessSummary[]) => void;
  setActiveBusiness: (business: Business | null) => void;
  addBusiness: (business: BusinessSummary) => void;
  updateBusiness: (id: string, updates: Partial<BusinessSummary>) => void;
  removeBusiness: (id: string) => void;
  setDefaultBusiness: (id: string) => void;
  clearBusinesses: () => void;
  setHydrated: (hydrated: boolean) => void;
  
  // Computed
  getDefaultBusiness: () => BusinessSummary | undefined;
  getBusinessById: (id: string) => BusinessSummary | undefined;
  hasMultipleBusinesses: () => boolean;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      businesses: [],
      activeBusiness: null,
      isHydrated: false,

      setBusinesses: (businesses) =>
        set((state) => ({
          businesses,
          activeBusiness:
            state.activeBusiness
              ? state.activeBusiness
              : businesses.length === 1
                ? (businesses[0] as any)
                : null,
        })),

      setActiveBusiness: (business) => set({ activeBusiness: business }),

      addBusiness: (business) =>
        set((state) => ({
          businesses: [...state.businesses, business],
        })),

      updateBusiness: (id, updates) =>
        set((state) => ({
          businesses: state.businesses.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
          // Don't update activeBusiness here since it has a different type (Business vs BusinessSummary)
          // activeBusiness should be refreshed separately via API call when needed
        })),

      removeBusiness: (id) =>
        set((state) => ({
          businesses: state.businesses.filter((b) => b.id !== id),
          activeBusiness: state.activeBusiness?.id === id ? null : state.activeBusiness,
        })),

      setDefaultBusiness: (id) =>
        set((state) => ({
          businesses: state.businesses.map((b) => ({
            ...b,
            isDefault: b.id === id,
          })),
        })),

      clearBusinesses: () => set({ businesses: [], activeBusiness: null }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      getDefaultBusiness: () => get().businesses.find((b) => b.isDefault),

      getBusinessById: (id) => get().businesses.find((b) => b.id === id),

      hasMultipleBusinesses: () => get().businesses.length > 1,
    }),
    {
      name: STORAGE_KEYS.BUSINESS_DATA,
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        businesses: state.businesses,
        activeBusiness: state.activeBusiness,
      }),
    }
  )
);