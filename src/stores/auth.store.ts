import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/user.model';
import { zustandStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import { queryClient } from '@/providers/QueryProvider';
import { useRoleStore } from './role.store';
import { useLocationStore } from './location.store';
import { useBusinessStore } from './business.store';
import { useFleetStore } from './fleet.store';
import { setLocalSessionActive } from '@teincfood/core';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  offlineMemberId: string | null;
  isHydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setOfflineSession: (user: User, offlineMemberId: string) => void;
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
      offlineMemberId: null,
      isHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        setLocalSessionActive(false);
        set({ user, accessToken, refreshToken, offlineMemberId: null });
      },

      setTokens: (accessToken, refreshToken) => {
        setLocalSessionActive(false);
        set({ accessToken, refreshToken, offlineMemberId: null });
      },

      setOfflineSession: (user, offlineMemberId) => {
        setLocalSessionActive(true);
        set({ user, accessToken: null, refreshToken: null, offlineMemberId });
      },

  setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      completeKyc: () =>
        set((state) => ({
          user: state.user ? { ...state.user, has_completed_kyc: true } : null,
        })),

      clearAuth: () => {
        useRoleStore.getState().clearRole();
        useLocationStore.getState().clearLocation();
        useFleetStore.getState().clearFleet();
        queryClient.clear();
        setLocalSessionActive(false);
        set({ user: null, accessToken: null, refreshToken: null, offlineMemberId: null });
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE, // Name in storage
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        // Run after hydration completes. An offline member session survives a
        // restart even though it has no cloud access token.
        setLocalSessionActive(Boolean(state?.offlineMemberId));
        state?.setHydrated(true);
      },
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken,
        offlineMemberId: state.offlineMemberId,
      }),
    }
  )
);
