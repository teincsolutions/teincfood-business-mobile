import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

interface FilterState {
  ordersActiveChips: string[];
  ordersSearchQuery: string;
  deliveriesActiveFilter: string;
  deliveriesSearchQuery: string;
  menuActiveCategory: string;
  setOrdersActiveChips: (chips: string[]) => void;
  setOrdersSearchQuery: (q: string) => void;
  setDeliveriesActiveFilter: (f: string) => void;
  setDeliveriesSearchQuery: (q: string) => void;
  setMenuActiveCategory: (cat: string) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ordersActiveChips: [],
      ordersSearchQuery: "",
      deliveriesActiveFilter: "all",
      deliveriesSearchQuery: "",
      menuActiveCategory: "",
      setOrdersActiveChips: (chips) => set({ ordersActiveChips: chips }),
      setOrdersSearchQuery: (q) => set({ ordersSearchQuery: q }),
      setDeliveriesActiveFilter: (f) => set({ deliveriesActiveFilter: f }),
      setDeliveriesSearchQuery: (q) => set({ deliveriesSearchQuery: q }),
      setMenuActiveCategory: (cat) => set({ menuActiveCategory: cat }),
    }),
    {
      name: 'teinc-filter-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
