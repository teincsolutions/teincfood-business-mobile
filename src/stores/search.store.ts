import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

interface SearchState {
  recentSearches: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: [],
      addSearch: (query: string) =>
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase());
          return {
            recentSearches: [query, ...filtered].slice(0, 10), // Keep last 10
          };
        }),
      removeSearch: (query: string) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase()),
        })),
      clearSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'teinc-search-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
