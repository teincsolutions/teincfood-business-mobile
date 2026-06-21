import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { UserRole } from '@/models/user.model';

interface RoleState {
  role: UserRole | null;
  isHydrated: boolean;

  setRole: (role: UserRole) => void;
  clearRole: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: null,
      isHydrated: false,

      setRole: (role) => set({ role }),
      clearRole: () => set({ role: null }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'teincfoods-role',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({ role: state.role }),
    }
  )
);
