import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';

type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  /** Current theme mode preference */
  themeMode: ThemeMode;
  /** Whether the menu drawer is visible */
  isMenuOpen: boolean;

  // ─── Actions ───
  setThemeMode: (mode: ThemeMode) => void;
  toggleMenu: () => void;
  closeMenu: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      isMenuOpen: false,

      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
      closeMenu: () => set({ isMenuOpen: false }),
    }),
    {
      name: STORAGE_KEYS.THEME_PREFERENCE,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
    }
  )
);
