import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";
import type { SellerSetupStepId } from "@/constants/seller-setup";

export interface SellerSetupProgress {
  startedAt?: string;
  welcomeSeenAt?: string;
  completedAt?: string;
  dismissedAt?: string;
  profileReviewedAt?: string;
  onlineOrderingDeclinedAt?: string;
  completedStepIds: SellerSetupStepId[];
  skippedStepIds: SellerSetupStepId[];
}

interface SellerSetupState {
  byBusiness: Record<string, SellerSetupProgress>;
  isHydrated: boolean;

  startGuide: (businessId: string) => void;
  markWelcomeSeen: (businessId: string) => void;
  markStepComplete: (businessId: string, stepId: SellerSetupStepId) => void;
  markProfileReviewed: (businessId: string) => void;
  markPlanSelected: (businessId: string) => void;
  skipStep: (businessId: string, stepId: SellerSetupStepId) => void;
  declineOnlineOrdering: (businessId: string) => void;
  completeGuide: (businessId: string) => void;
  dismissGuide: (businessId: string) => void;
  resetGuide: (businessId: string) => void;
  clearAll: () => void;
  getProgress: (businessId?: string | null) => SellerSetupProgress;
  setHydrated: (hydrated: boolean) => void;
}

const EMPTY_PROGRESS: SellerSetupProgress = {
  completedStepIds: [],
  skippedStepIds: [],
};

function now() {
  return new Date().toISOString();
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export const useSellerSetupStore = create<SellerSetupState>()(
  persist(
    (set, get) => ({
      byBusiness: {},
      isHydrated: false,

      startGuide: (businessId) =>
        set((state) => {
          if (!businessId) return state;
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: { ...current, startedAt: now() },
            },
          };
        }),

      markWelcomeSeen: (businessId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                startedAt: current.startedAt ?? now(),
                welcomeSeenAt: current.welcomeSeenAt ?? now(),
              },
            },
          };
        }),

      markStepComplete: (businessId, stepId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (!current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                startedAt: current.startedAt ?? now(),
                completedStepIds: unique([...current.completedStepIds, stepId]),
                skippedStepIds: current.skippedStepIds.filter((id) => id !== stepId),
              },
            },
          };
        }),

      markProfileReviewed: (businessId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (!current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                startedAt: current.startedAt ?? now(),
                profileReviewedAt: current.profileReviewedAt ?? now(),
                completedStepIds: unique([...current.completedStepIds, "profile"]),
              },
            },
          };
        }),

      markPlanSelected: (businessId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (!current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                startedAt: current.startedAt ?? now(),
                completedStepIds: unique([...current.completedStepIds, "plan"]),
              },
            },
          };
        }),

      skipStep: (businessId, stepId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (!current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                startedAt: current.startedAt ?? now(),
                skippedStepIds: unique([...current.skippedStepIds, stepId]),
              },
            },
          };
        }),

      declineOnlineOrdering: (businessId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (!current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                startedAt: current.startedAt ?? now(),
                onlineOrderingDeclinedAt: now(),
                skippedStepIds: unique([...current.skippedStepIds, "online_ordering"]),
              },
            },
          };
        }),

      completeGuide: (businessId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (!current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                completedAt: current.completedAt ?? now(),
              },
            },
          };
        }),

      dismissGuide: (businessId) =>
        set((state) => {
          const current = state.byBusiness[businessId] ?? EMPTY_PROGRESS;
          if (!current.startedAt) return state;
          return {
            byBusiness: {
              ...state.byBusiness,
              [businessId]: {
                ...current,
                dismissedAt: now(),
              },
            },
          };
        }),

      resetGuide: (businessId) =>
        set((state) => {
          const next = { ...state.byBusiness };
          delete next[businessId];
          return { byBusiness: next };
        }),

      clearAll: () => set({ byBusiness: {} }),

      getProgress: (businessId) => {
        if (!businessId) return EMPTY_PROGRESS;
        return get().byBusiness[businessId] ?? EMPTY_PROGRESS;
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "seller_setup_guide",
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({ byBusiness: state.byBusiness }),
    },
  ),
);
