import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/models/user.model';
import { zustandStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import { useRoleStore } from './role.store';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  completeKyc: () => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,



  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      completeKyc: () =>
        set((state) => ({
          user: state.user ? { ...state.user, hasCompletedKyc: true } : null,
        })),

      clearAuth: () => {
        useRoleStore.getState().clearRole();
        set({ user: null, accessToken: null, refreshToken: null });
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE, // Name in storage
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        // Run after hydration completes
        state?.setHydrated(true);
      },
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken 
      }),
    }
  )
);
