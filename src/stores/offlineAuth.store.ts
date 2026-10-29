import { create } from "zustand";
import {
  activateOfflineDevice,
  getOfflineSessionState,
  removeOfflineDevice,
  type OfflineActivationResult,
  type OfflineLicenseEvaluation,
  type OfflineMemberCredential,
  type OfflineSessionState,
} from "@teincfood/core";
import { useOfflineSetupStore } from "@/stores/offlineSetup.store";

export interface OfflineAuthState {
  loading: boolean;
  hasDevice: boolean;
  members: OfflineMemberCredential[];
  evaluation: OfflineLicenseEvaluation | null;
  error: string | null;
}

interface OfflineAuthStore extends OfflineAuthState {
  businessId: string | null;
  refresh: (businessId?: string | null) => Promise<OfflineSessionState | null>;
  activate: (args: {
    businessId: string;
    member: {
      userId: string;
      fullName: string;
      email?: string | null;
      role: string;
      capabilities: string[];
    };
    pin: string;
    platform?: string;
  }) => Promise<OfflineActivationResult>;
  removeDevice: (businessId: string) => Promise<void>;
}

const initialState: OfflineAuthState = {
  loading: true,
  hasDevice: false,
  members: [],
  evaluation: null,
  error: null,
};

export const useOfflineAuthStore = create<OfflineAuthStore>((set, get) => ({
  ...initialState,
  businessId: null,

  refresh: async (businessId) => {
    set({ loading: true, error: null, businessId: businessId ?? null });
    try {
      const result = await getOfflineSessionState(businessId ?? undefined);
      set({
        loading: false,
        hasDevice: result.hasDevice,
        members: result.members,
        evaluation: result.evaluation,
        error: null,
        businessId: businessId ?? null,
      });
      return result;
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not read offline access",
      });
      return null;
    }
  },

  activate: async (args) => {
    const { businessId, ...activation } = args;
    const result = await activateOfflineDevice({ businessId, ...activation });
    useOfflineSetupStore.getState().clear(businessId);

    // Read the just-saved license into the shared store before the screen
    // navigates, so the seller layout gate cannot bounce back to setup.
    const session = await getOfflineSessionState(businessId);
    set({
      loading: false,
      hasDevice: session.hasDevice,
      members: session.members,
      evaluation: session.evaluation,
      error: null,
      businessId,
    });
    return result;
  },

  removeDevice: async (businessId) => {
    await removeOfflineDevice(businessId);
    useOfflineSetupStore.getState().clear(businessId);
    const session = await getOfflineSessionState(businessId).catch(() => null);
    if (session) {
      set({
        loading: false,
        hasDevice: session.hasDevice,
        members: session.members,
        evaluation: session.evaluation,
        error: null,
        businessId,
      });
    } else {
      set({
        loading: false,
        hasDevice: false,
        members: [],
        evaluation: null,
        error: null,
        businessId,
      });
    }
  },
}));
