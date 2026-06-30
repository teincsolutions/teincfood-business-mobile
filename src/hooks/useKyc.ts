import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import * as businessService from '@/services/business.service';

const KYC_KEYS = {
  user: (userId?: string) => ['kyc', 'user', userId] as const,
  business: (businessId?: string) => ['kyc', 'business', businessId] as const,
};

export function useUserKycQuery(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: KYC_KEYS.user(userId),
    queryFn: async () => {
      const res = await api.get<any>(`/users/me/kyc`);
      return res.data || {};
    },
    enabled: enabled && !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
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
    refetchOnMount: 'always',
  });
}

export function useSubmitUserKycMutation() {
  return useMutation({
    mutationFn: async ({ documents, userType, partial }: { documents: Record<string, any>; userType: string; partial?: boolean }) => {
      return api.post('/users/me/kyc', { documents, user_type: userType, partial: !!partial });
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
