import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import {
  activateOfflineLicense,
  copyOfflineDeviceDataForAccount,
  getOfflinePinLockState,
  sendOfflineDeviceHeartbeat,
  setAccountScope,
  setOfflineMemberPin,
  verifyOfflineLogin,
} from "@teincfood/core";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useOfflineAuthStore } from "@/stores/offlineAuth.store";
import {
  clearOfflineDeviceContext,
  getOfflineDeviceContext,
  setOfflineDeviceContext,
} from "@/utils/storage";
import type { Business } from "@/types/business.model";
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
    roles: ["seller", member.role],
    email_verified_at: null,
    phone_verified_at: null,
    kyc_status: "none",
    has_completed_kyc: false,
    inserted_at: now,
    updated_at: now,
  };
}

export function useOfflineAuth() {
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const authUser = useAuthStore((s) => s.user);
  // Only pre-auth offline login may use the device pointer. A signed-in
  // account always uses its own active business.
  const deviceContext = authUser ? null : getOfflineDeviceContext();
  const businessId =
    activeBusiness?.id ?? deviceContext?.business.id ?? undefined;
  const state = useOfflineAuthStore();
  const refreshStore = state.refresh;
  const hasDevice = state.hasDevice;

  useEffect(() => {
    // Reading account-scoped offline credentials before login requires the
    // device's owning account scope. No app account is marked active, so no
    // user store can persist into that scope.
    if (!authUser?.id && deviceContext?.accountId) {
      setAccountScope(deviceContext.accountId);
    }
    void refreshStore(businessId);
  }, [authUser?.id, deviceContext?.accountId, businessId, refreshStore]);

  useEffect(() => {
    if (!authUser || !businessId || !hasDevice) return;
    void sendOfflineDeviceHeartbeat(businessId);
    const timer = setInterval(() => {
      void sendOfflineDeviceHeartbeat(businessId);
    }, 60_000);
    return () => clearInterval(timer);
  }, [authUser, businessId, hasDevice]);

  // Remember the last licensed business while a real account is signed in.
  // The pointer is device-level and used only by the pre-auth offline login.
  useEffect(() => {
    if (!authUser?.id || !activeBusiness?.id || !hasDevice) return;
    setOfflineDeviceContext({
      accountId: authUser.id,
      business: activeBusiness,
    });
  }, [authUser?.id, activeBusiness, hasDevice]);

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

      // The device license/member directory lives in the activating account's
      // scope. Copy just this business's credentials into the member's own
      // scope before starting their offline session.
      if (deviceContext && businessId === deviceContext.business.id) {
        await copyOfflineDeviceDataForAccount({
          fromAccountId: deviceContext.accountId,
          toAccountId: member.user_id,
          businessId,
        });
      }

      const loginBusiness: Business | null =
        deviceContext?.business ?? activeBusiness ?? null;
      useAuthStore
        .getState()
        .setOfflineSession(
          memberAsUser(member),
          member.user_id,
          loginBusiness,
        );
      return member;
    },
    [activeBusiness, businessId, deviceContext],
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

  const activateLicense = useCallback(async () => {
    if (!businessId) throw new Error("Select a business first");
    const result = await activateOfflineLicense({
      businessId,
      platform: Platform.OS,
    });
    await state.refresh(businessId);
    return result;
  }, [businessId, state.refresh]);

  const setOfflinePin = useCallback(
    async (args: {
      userId: string;
      newPin: string;
      currentPin?: string;
      member?: {
        fullName: string;
        email?: string | null;
        role: string;
        capabilities: string[];
      };
    }) => {
      if (!businessId) throw new Error("Select a business first");
      const result = await setOfflineMemberPin({ businessId, ...args });
      await state.refresh(businessId);
      return result;
    },
    [businessId, state.refresh],
  );

  const removeDevice = useCallback(async () => {
    if (!businessId) throw new Error("Select a business first");
    await state.removeDevice(businessId);
    if (deviceContext?.business.id === businessId) {
      clearOfflineDeviceContext();
    }
  }, [businessId, deviceContext?.business.id, state.removeDevice]);

  return {
    loading: state.loading,
    hasDevice: state.hasDevice,
    members: state.members,
    evaluation: state.evaluation,
    error: state.error,
    refresh: () => state.refresh(businessId),
    login,
    activate,
    activateLicense,
    setOfflinePin,
    removeDevice,
  };
}
