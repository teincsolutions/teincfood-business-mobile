import { useCallback, useEffect, useState } from 'react';
import {
  activateOfflineDevice,
  getOfflinePinLockState,
  getOfflineSessionState,
  removeOfflineDevice,
  sendOfflineDeviceHeartbeat,
  verifyOfflineLogin,
  type OfflineLicenseEvaluation,
  type OfflineMemberCredential,
} from '@teincfood/core';
import { useAuthStore } from '@/stores/auth.store';
import { useBusinessStore } from '@/stores/business.store';
import type { User } from '@/types/user.model';

export interface OfflineAuthState {
  loading: boolean;
  hasDevice: boolean;
  members: OfflineMemberCredential[];
  evaluation: OfflineLicenseEvaluation | null;
  error: string | null;
}

function memberAsUser(member: OfflineMemberCredential): User {
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
    kyc_status: 'none',
    has_completed_kyc: false,
    inserted_at: now,
    updated_at: now,
  };
}

export function useOfflineAuth() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const [state, setState] = useState<OfflineAuthState>({
    loading: true,
    hasDevice: false,
    members: [],
    evaluation: null,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await getOfflineSessionState(businessId);
      setState({
        loading: false,
        hasDevice: result.hasDevice,
        members: result.members,
        evaluation: result.evaluation,
        error: null,
      });
      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Could not read offline access',
      }));
      return null;
    }
  }, [businessId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!businessId || !state.hasDevice) return;
    void sendOfflineDeviceHeartbeat(businessId);
    const timer = setInterval(() => {
      void sendOfflineDeviceHeartbeat(businessId);
    }, 60_000);
    return () => clearInterval(timer);
  }, [businessId, state.hasDevice]);

  const login = useCallback(async (memberId: string, pin: string) => {
    const member = await verifyOfflineLogin(memberId, pin, businessId);
    if (!member) {
      const lock = await getOfflinePinLockState(memberId, businessId);
      if (lock.locked) {
        const until = lock.lockedUntil
          ? new Date(lock.lockedUntil).toLocaleTimeString()
          : 'later';
        throw new Error(`Too many attempts. Try again at ${until}.`);
      }
      const suffix =
        lock.remainingAttempts > 0 && lock.remainingAttempts <= 2
          ? ` ${lock.remainingAttempts} attempt${lock.remainingAttempts === 1 ? '' : 's'} left.`
          : '';
      throw new Error(`Incorrect PIN.${suffix}`);
    }
    useAuthStore.getState().setOfflineSession(memberAsUser(member), member.user_id);
    return member;
  }, [businessId]);

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
      if (!businessId) throw new Error('Select a business first');
      const result = await activateOfflineDevice({ businessId, ...args });
      await refresh();
      return result;
    },
    [businessId, refresh],
  );

  const removeDevice = useCallback(async () => {
    if (!businessId) throw new Error('Select a business first');
    await removeOfflineDevice(businessId);
    await refresh();
  }, [businessId, refresh]);

  return { ...state, refresh, login, activate, removeDevice };
}
