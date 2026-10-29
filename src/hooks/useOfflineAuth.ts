import { useCallback, useEffect } from "react";
import {
  sendOfflineDeviceHeartbeat,
  verifyOfflineLogin,
  getOfflinePinLockState,
} from "@teincfood/core";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useOfflineAuthStore } from "@/stores/offlineAuth.store";
import type { User } from "@/types/user.model";

function memberAsUser(member: {
  user_id: string;
  email?: string | null;
  full_name: string;
  role: string;
}): User {
  const now = new Date().toISOString();
  return {
    id: member.user_id,
    email: member.email ?? null,
    full_name: member.full_name,
    phone: null,
    avatar_url: null,
    has_password: false,
    roles: [member.role],
    email_verified_at: null,
    phone_verified_at: null,
    kyc_status: "none",
    has_completed_kyc: false,
    inserted_at: now,
    updated_at: now,
  };
}

export function useOfflineAuth() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const state = useOfflineAuthStore();
  const refreshStore = state.refresh;
  const hasDevice = state.hasDevice;

  useEffect(() => {
    void refreshStore(businessId);
  }, [businessId, refreshStore]);

  useEffect(() => {
    if (!businessId || !hasDevice) return;
    void sendOfflineDeviceHeartbeat(businessId);
    const timer = setInterval(() => {
      void sendOfflineDeviceHeartbeat(businessId);
    }, 60_000);
    return () => clearInterval(timer);
  }, [businessId, hasDevice]);

  const login = useCallback(
    async (memberId: string, pin: string) => {
      const member = await verifyOfflineLogin(memberId, pin, businessId);
      if (!member) {
        const lock = await getOfflinePinLockState(memberId, businessId);
        if (lock.locked) {
          const until = lock.lockedUntil
            ? new Date(lock.lockedUntil).toLocaleTimeString()
            : "later";
          throw new Error(`Too many attempts. Try again at ${until}.`);
        }
        const suffix =
          lock.remainingAttempts > 0 && lock.remainingAttempts <= 2
            ? ` ${lock.remainingAttempts} attempt${lock.remainingAttempts === 1 ? "" : "s"} left.`
            : "";
        throw new Error(`Incorrect PIN.${suffix}`);
      }
      useAuthStore
        .getState()
        .setOfflineSession(memberAsUser(member), member.user_id);
      return member;
    },
    [businessId],
  );

  const activate = useCallback(
    async (args: {
      member: {
        userId: string;
        fullName: string;
        email?: string | null;
        role: string;
        capabilities: string[];
      };
      pin: string;
      platform?: string;
    }) => {
      if (!businessId) throw new Error("Select a business first");
      return state.activate({ businessId, ...args });
    },
    [businessId, state.activate],
  );

  const removeDevice = useCallback(async () => {
    if (!businessId) throw new Error("Select a business first");
    await state.removeDevice(businessId);
  }, [businessId, state.removeDevice]);

  return {
    loading: state.loading,
    hasDevice: state.hasDevice,
    members: state.members,
    evaluation: state.evaluation,
    error: state.error,
    refresh: () => state.refresh(businessId),
    login,
    activate,
    removeDevice,
  };
}
