import { create } from "zustand";

/**
 * Small hand-off used by the shared menu detail screen: the detail screen is a
 * separate stack route, so asking it to navigate straight back into the menu
 * edit sheet can leave the sheet mounted behind the detail route. Instead the
 * detail screen records the id and pops back; the already-mounted menu screen
 * consumes the id on focus and opens the sheet in the visible screen.
 */
interface MenuEditState {
  pendingItemId: string | null;
  requestEdit: (id: string) => void;
  consumeEdit: () => string | null;
}

export const useMenuEditStore = create<MenuEditState>((set, get) => ({
  pendingItemId: null,
  requestEdit: (id) => set({ pendingItemId: id }),
  consumeEdit: () => {
    const id = get().pendingItemId;
    if (id) set({ pendingItemId: null });
    return id;
  },
}));
