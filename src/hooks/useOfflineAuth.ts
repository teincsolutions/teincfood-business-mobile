import { useCallback, useEffect, useState } from 'react';
import {
  activateOfflineDevice,
  getOfflineSessionState,
  removeOfflineDevice,
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

  const login = useCallback(async (memberId: string, pin: string) => {
    const member = await verifyOfflineLogin(memberId, pin);
    if (!member) throw new Error('Incorrect PIN');
    useAuthStore.getState().setOfflineSession(memberAsUser(member), member.user_id);
    return member;
  }, []);

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
