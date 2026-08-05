import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as businessService from '@/services/business.service';
import type { TaxRuleListResponse } from '@/types/api';
import { useBusinessStore } from '@/stores/business.store';
import { useReferenceData } from '@/reference/hooks';
import { emitReferenceChanged } from '@/reference/events';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

export const TAX_KEYS = {
  all: ['tax-rules'] as const,
  list: (businessId?: string) => [...TAX_KEYS.all, 'list', businessId] as const,
};

export function useBusinessTaxRulesQuery(enabled = true) {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const cached = useReferenceData<TaxRuleListResponse>("tax-rules");

  return useQuery({
    queryKey: TAX_KEYS.list(activeBusinessId),
    queryFn: () => businessService.fetchBusinessTaxRules(activeBusinessId!),
    enabled: enabled && Boolean(activeBusinessId),
    staleTime: 30 * 1000,
    placeholderData: cached.data?.payload,
  });
}

export function useCreateTaxRuleMutation() {
  const queryClient = useQueryClient();
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      businessService.createBusinessTaxRule(activeBusinessId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_KEYS.list(activeBusinessId) });
      toast.success('Tax rule created');
      if (activeBusinessId) {
        emitReferenceChanged(activeBusinessId, ["tax-rules"]);
      }
    },
    onError: (err) => {
      console.debug('[TaxHook] Create failed', err);
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useUpdateTaxRuleMutation() {
  const queryClient = useQueryClient();
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      businessService.updateTaxRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_KEYS.list(activeBusinessId) });
      toast.success('Tax rule updated');
      if (activeBusinessId) {
        emitReferenceChanged(activeBusinessId, ["tax-rules"]);
      }
    },
    onError: (err) => {
      console.debug('[TaxHook] Update failed', err);
      toast.error(extractApiErrorMessage(err));
    },
  });
}

export function useDeleteTaxRuleMutation() {
  const queryClient = useQueryClient();
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (id: string) => businessService.deleteTaxRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_KEYS.list(activeBusinessId) });
      toast.success('Tax rule removed');
      if (activeBusinessId) {
        emitReferenceChanged(activeBusinessId, ["tax-rules"]);
      }
    },
    onError: (err) => {
      console.debug('[TaxHook] Delete failed', err);
      toast.error(extractApiErrorMessage(err));
    },
  });
}
