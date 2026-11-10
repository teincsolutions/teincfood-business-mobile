import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/user.model';
import type { Business } from '@/types/business.model';
import { rootZustandStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import { setLocalSessionActive } from '@teincfood/core';
import {
  adoptPersistedAccountScope,
  beginAccountScope,
  endAccountScope,
} from '@/services/account-scope.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  offlineMemberId: string | null;
  isHydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setOfflineSession: (
    user: User,
    offlineMemberId: string,
    business?: Business | null,
  ) => void;
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
        // Set the new identity before switching scopes: store rehydration and
        // LAN/query side-effects must observe the new account, never the old
        // token while the new business list is already in memory.
        setLocalSessionActive(false);
        set({ user, accessToken, refreshToken, offlineMemberId: null });
        beginAccountScope(user.id);
      },

      setTokens: (accessToken, refreshToken) => {
        setLocalSessionActive(false);
        set({ accessToken, refreshToken, offlineMemberId: null });
      },

      setOfflineSession: (user, offlineMemberId, business) => {
        setLocalSessionActive(true);
        set({ user, accessToken: null, refreshToken: null, offlineMemberId });
        beginAccountScope(user.id, business ? { business } : undefined);
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
        setLocalSessionActive(false);
        set({ user: null, accessToken: null, refreshToken: null, offlineMemberId: null });
        endAccountScope();
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE, // Name in storage
      storage: createJSONStorage(() => rootZustandStorage),
      onRehydrateStorage: () => (state) => {
        // Adopt the persisted account before any store performs a scoped read
        // or core opens SQLite for the first time.
        adoptPersistedAccountScope(state?.user?.id ?? null);
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
