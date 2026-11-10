import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as businessService from "@/services/business.service";
import type { SellerSetupStepId } from "@/constants/seller-setup";
import { SELLER_SETUP_STEPS } from "@/constants/seller-setup";
import type { SellerSetupStatus } from "@/types/seller-setup";
import { useBusinessStore } from "@/stores/business.store";
import {
  useSellerSetupStore,
  type SellerSetupProgress,
} from "@/stores/seller-setup.store";

export type { SellerSetupStatus } from "@/types/seller-setup";

export type SellerSetupStepState = "complete" | "skipped" | "pending";

export function sellerSetupQueryKey(businessId?: string | null) {
  return ["seller-setup", businessId ?? "none"] as const;
}

export function useSellerSetupStatus(
  businessId?: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: sellerSetupQueryKey(businessId),
    queryFn: async () => {
      const response = await businessService.fetchSetupStatus(
        businessId as string,
      );
      return response.data;
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 15_000,
  });
}

export function useInvalidateSellerSetup() {
  const queryClient = useQueryClient();
  return (businessId?: string | null) => {
    void queryClient.invalidateQueries({
      queryKey: sellerSetupQueryKey(businessId),
    });
  };
}

export function stepState(
  stepId: SellerSetupStepId,
  status: SellerSetupStatus | undefined,
  progress: SellerSetupProgress,
): SellerSetupStepState {
  if (progress.skippedStepIds.includes(stepId)) return "skipped";
  if (progress.completedStepIds.includes(stepId)) return "complete";

  switch (stepId) {
    case "profile":
      return progress.profileReviewedAt ? "complete" : "pending";
    case "hours":
      return status?.operating_hours_set ? "complete" : "pending";
    case "plan":
      return status?.plan.slug ? "complete" : "pending";
    case "payments":
      return status?.payment_methods_set ? "complete" : "pending";
    case "menu":
      return (status?.menu_items_count ?? 0) > 0 ? "complete" : "pending";
    case "cash_sale":
      return status?.first_cash_order_completed ? "complete" : "pending";
    case "online_ordering":
      return status?.online_ordering_enabled ? "complete" : "pending";
    default:
      return "pending";
  }
}

export interface SellerSetupGuide {
  progress: SellerSetupProgress;
  status?: SellerSetupStatus;
  stepStates: Record<SellerSetupStepId, SellerSetupStepState>;
  nextStepId?: SellerSetupStepId;
  completedCount: number;
  totalCount: number;
  percent: number;
  allAnswered: boolean;
  active: boolean;
  hidden: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export function deriveSellerSetupGuide(
  status: SellerSetupStatus | undefined,
  progress: SellerSetupProgress,
  isLoading = false,
  refetch: () => void = () => {},
): SellerSetupGuide {
  const stepStates = {} as Record<SellerSetupStepId, SellerSetupStepState>;

  for (const step of SELLER_SETUP_STEPS) {
    stepStates[step.id] = stepState(step.id, status, progress);
  }

  const handledCount = SELLER_SETUP_STEPS.filter(
    (step) => stepStates[step.id] !== "pending",
  ).length;
  const nextStep = SELLER_SETUP_STEPS.find(
    (step) => stepStates[step.id] === "pending",
  );
  const allAnswered = !nextStep;
  const active = Boolean(progress.startedAt) && !progress.completedAt && !progress.dismissedAt;
  const hidden = !active;

  return {
    progress,
    status,
    stepStates,
    nextStepId: nextStep?.id,
    completedCount: handledCount,
    totalCount: SELLER_SETUP_STEPS.length,
    percent: Math.round((handledCount / SELLER_SETUP_STEPS.length) * 100),
    allAnswered,
    active,
    hidden,
    isLoading,
    refetch,
  };
}

export function useSellerSetupGuide(businessId?: string | null, enabled = true) {
  const progress = useSellerSetupStore((s) => s.getProgress(businessId));
  const isHydrated = useSellerSetupStore((s) => s.isHydrated);
  const query = useSellerSetupStatus(businessId, enabled);
  return {
    ...deriveSellerSetupGuide(
      query.data,
      progress,
      !isHydrated || query.isLoading,
      query.refetch,
    ),
    isHydrated,
  };
}

/** Enables online ordering and records the guide step. Screens call this hook
 * instead of importing the business service directly. */
export function useEnableOnlineOrdering(businessId?: string | null) {
  const queryClient = useQueryClient();
  const markStepComplete = useSellerSetupStore((s) => s.markStepComplete);
  const completeGuide = useSellerSetupStore((s) => s.completeGuide);

  return useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error("No active business");
      const result = await businessService.toggleBusinessOpen(businessId);
      const updated = result.data;
      const current = useBusinessStore.getState().activeBusiness;
      if (current?.id === businessId) {
        useBusinessStore.getState().setActiveBusiness({
          ...current,
          online_ordering_enabled: true,
          manually_closed: updated.manually_closed ?? false,
          ...(updated.is_open !== undefined ? { is_open: updated.is_open } : {}),
        });
      }
      return updated;
    },
    onSuccess: () => {
      if (!businessId) return;
      markStepComplete(businessId, "online_ordering");
      completeGuide(businessId);
      void queryClient.invalidateQueries({
        queryKey: sellerSetupQueryKey(businessId),
      });
    },
  });
}
