import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

interface FavoritesState {
  savedFoodIds: string[];
  savedRestaurantIds: string[];
  toggleFood: (id: string) => void;
  toggleRestaurant: (id: string) => void;
  isFoodSaved: (id: string) => boolean;
  isRestaurantSaved: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      savedFoodIds: [],
      savedRestaurantIds: [],
      toggleFood: (id: string) =>
        set((state) => ({
          savedFoodIds: state.savedFoodIds.includes(id)
            ? state.savedFoodIds.filter((fid) => fid !== id)
            : [...state.savedFoodIds, id],
        })),
      toggleRestaurant: (id: string) =>
        set((state) => ({
          savedRestaurantIds: state.savedRestaurantIds.includes(id)
            ? state.savedRestaurantIds.filter((rid) => rid !== id)
            : [...state.savedRestaurantIds, id],
        })),
      isFoodSaved: (id: string) => get().savedFoodIds.includes(id),
      isRestaurantSaved: (id: string) => get().savedRestaurantIds.includes(id),
    }),
    {
      name: 'teinc-favorites-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
