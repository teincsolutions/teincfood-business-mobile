import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import * as businessService from '@/services/business.service';
import * as riderService from '@/services/rider.service';

const KYC_KEYS = {
  user: (userId?: string) => ['kyc', 'user', userId] as const,
  rider: (userId?: string) => ['kyc', 'rider', userId] as const,
  business: (businessId?: string) => ['kyc', 'business', businessId] as const,
};

/** The user endpoint returns `documents` as an array; the UI works with a
 * document map keyed by document type. Normalize both shapes. */
function normalizeUserKyc(data: any) {
  const list = Array.isArray(data?.documents) ? data.documents : [];
  const fromList = Object.fromEntries(
    list
      .filter((doc: any) => doc && doc.type)
      .map((doc: any) => [String(doc.type), doc]),
  );
  return {
    ...data,
    kyc_status: data?.kyc_status ?? 'pending',
    kyc_documents: data?.kyc_documents ?? fromList,
  };
}

export function useUserKycQuery(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: KYC_KEYS.user(userId),
    queryFn: async () => {
      const res = await api.get<any>(`/users/me/kyc`);
      return normalizeUserKyc(res.data || {});
    },
    enabled: enabled && !!userId,
    staleTime: 0,
    // A 404 here just means the user has not submitted KYC yet.
    retry: false,
  });
}

/** Rider KYC lives on the `dispatch.riders` row — the same row admins review —
 * so the rider flow must read/write `/riders/kyc` instead of `/users/me/kyc`. */
export function useRiderKycQuery(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: KYC_KEYS.rider(userId),
    queryFn: async () => {
      const res = await riderService.fetchRiderKycStatus();
      const data: any = (res as any)?.data || {};
      return {
        ...data,
        kyc_status: data.kyc_status ?? 'pending',
        kyc_documents: data.kyc_documents ?? {},
      };
    },
    enabled: enabled && !!userId,
    staleTime: 0,
    retry: false,
  });
}

export function useBusinessKycQuery(businessId?: string, enabled = true) {
  return useQuery({
    queryKey: KYC_KEYS.business(businessId),
    queryFn: async () => {
      const res = await api.get<any>(`/businesses/${businessId}/kyc`);
      return res.data || {};
    },
    enabled: enabled && !!businessId,
    staleTime: 0,
  });
}

export function useSubmitUserKycMutation() {
  return useMutation({
    mutationFn: async ({ documents, userType, partial }: { documents: Record<string, any>; userType: string; partial?: boolean }) => {
      return api.post('/users/me/kyc', { documents, user_type: userType, partial: !!partial });
    },
  });
}

export function useSubmitRiderKycMutation() {
  return useMutation({
    mutationFn: async ({ documents, partial }: { documents: Record<string, any>; partial?: boolean }) => {
      return riderService.submitRiderKyc({ documents, partial: !!partial });
    },
  });
}

export function useSubmitBusinessKycMutation() {
  return useMutation({
    mutationFn: async ({ businessId, documents, partial }: { businessId: string; documents: Record<string, any>; partial?: boolean }) => {
      return businessService.submitBusinessKyc(businessId, { documents, user_type: 'business_owner', partial: !!partial });
    },
  });
}
