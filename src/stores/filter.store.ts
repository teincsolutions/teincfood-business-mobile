import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

interface FilterState {
  ordersActiveChips: string[];
  ordersSearchQuery: string;
  ordersDatePreset: string;
  ordersDateFrom: string;
  ordersDateTo: string;
  ordersOrderType: string;
  ordersPaymentStatus: string;
  deliveriesActiveFilter: string;
  deliveriesActiveChips: string[];
  deliveriesSearchQuery: string;
  deliveriesDatePreset: string;
  deliveriesDateFrom: string;
  deliveriesDateTo: string;
  deliveriesOrderType: string;
  deliveriesPaymentStatus: string;
  menuActiveCategory: string;
  isHydrated: boolean;
  setOrdersActiveChips: (chips: string[]) => void;
  setOrdersSearchQuery: (q: string) => void;
  setOrdersDatePreset: (v: string) => void;
  setOrdersDateFrom: (v: string) => void;
  setOrdersDateTo: (v: string) => void;
  setOrdersOrderType: (v: string) => void;
  setOrdersPaymentStatus: (v: string) => void;
  setDeliveriesActiveFilter: (f: string) => void;
  setDeliveriesActiveChips: (chips: string[]) => void;
  setDeliveriesSearchQuery: (q: string) => void;
  setDeliveriesDatePreset: (v: string) => void;
  setDeliveriesDateFrom: (v: string) => void;
  setDeliveriesDateTo: (v: string) => void;
  setDeliveriesOrderType: (v: string) => void;
  setDeliveriesPaymentStatus: (v: string) => void;
  setMenuActiveCategory: (cat: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const FILTER_DEFAULTS = {
  ordersActiveChips: [] as string[],
  ordersSearchQuery: "",
  ordersDatePreset: "all",
  ordersDateFrom: "",
  ordersDateTo: "",
  ordersOrderType: "",
  ordersPaymentStatus: "",
  deliveriesActiveFilter: "all",
  deliveriesActiveChips: [] as string[],
  deliveriesSearchQuery: "",
  deliveriesDatePreset: "all",
  deliveriesDateFrom: "",
  deliveriesDateTo: "",
  deliveriesOrderType: "",
  deliveriesPaymentStatus: "",
  menuActiveCategory: "",
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ...FILTER_DEFAULTS,
      isHydrated: false,
      setOrdersActiveChips: (chips) => set({ ordersActiveChips: chips }),
      setOrdersSearchQuery: (q) => set({ ordersSearchQuery: q }),
      setOrdersDatePreset: (v) => set({ ordersDatePreset: v }),
      setOrdersDateFrom: (v) => set({ ordersDateFrom: v }),
      setOrdersDateTo: (v) => set({ ordersDateTo: v }),
      setOrdersOrderType: (v) => set({ ordersOrderType: v }),
      setOrdersPaymentStatus: (v) => set({ ordersPaymentStatus: v }),
      setDeliveriesActiveFilter: (f) => set({ deliveriesActiveFilter: f }),
      setDeliveriesActiveChips: (chips) => set({ deliveriesActiveChips: chips }),
      setDeliveriesSearchQuery: (q) => set({ deliveriesSearchQuery: q }),
      setDeliveriesDatePreset: (v) => set({ deliveriesDatePreset: v }),
      setDeliveriesDateFrom: (v) => set({ deliveriesDateFrom: v }),
      setDeliveriesDateTo: (v) => set({ deliveriesDateTo: v }),
      setDeliveriesOrderType: (v) => set({ deliveriesOrderType: v }),
      setDeliveriesPaymentStatus: (v) => set({ deliveriesPaymentStatus: v }),
      setMenuActiveCategory: (cat) => set({ menuActiveCategory: cat }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'teinc-filter-storage',
      version: 2,
      storage: createJSONStorage(() => zustandStorage),
      // One-time upgrade reset: existing installs had status chips persisted as
      // defaults (e.g. ["pending","accepted",...]); the new contract is "no
      // filters by default", so v1 → v2 clears all saved filters.
      migrate: (persisted, version) => {
        if ((version ?? 0) < 2) return { ...FILTER_DEFAULTS };
        return persisted as Partial<FilterState>;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        ordersActiveChips: state.ordersActiveChips,
        ordersSearchQuery: state.ordersSearchQuery,
        ordersDatePreset: state.ordersDatePreset,
        ordersDateFrom: state.ordersDateFrom,
        ordersDateTo: state.ordersDateTo,
        ordersOrderType: state.ordersOrderType,
        ordersPaymentStatus: state.ordersPaymentStatus,
        deliveriesActiveFilter: state.deliveriesActiveFilter,
        deliveriesActiveChips: state.deliveriesActiveChips,
        deliveriesSearchQuery: state.deliveriesSearchQuery,
        deliveriesDatePreset: state.deliveriesDatePreset,
        deliveriesDateFrom: state.deliveriesDateFrom,
        deliveriesDateTo: state.deliveriesDateTo,
        deliveriesOrderType: state.deliveriesOrderType,
        deliveriesPaymentStatus: state.deliveriesPaymentStatus,
        menuActiveCategory: state.menuActiveCategory,
      }),
    }
  )
);
