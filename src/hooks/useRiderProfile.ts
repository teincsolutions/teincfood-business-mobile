import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RIDER_KEYS, extractApiErrorMessage } from "@teincfood/core";
import {
  createRiderProfile,
  updateRiderProfile,
  submitRiderJoinRequest,
  fetchMyJoinRequests,
} from "@/services/rider.service";

export interface RiderProfileForm {
  phone: string;
  license_number: string;
}

function invalidateRider(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: RIDER_KEYS.profile() });
  void queryClient.invalidateQueries({ queryKey: RIDER_KEYS.metrics() });
}

/** POST /riders/profile — creates the rider row + assigns the rider role. */
export function useCreateRiderProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RiderProfileForm) =>
      createRiderProfile(data as unknown as Record<string, unknown>),
    onSuccess: () => invalidateRider(queryClient),
    onError: (error) => {
      console.debug("[useCreateRiderProfileMutation] error", error);
    },
  });
}

/** PATCH /riders/profile — blocked by backend when is_fleet_managed. */
export function useUpdateRiderProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiderProfileForm>) =>
      updateRiderProfile(data as unknown as Record<string, unknown>),
    onSuccess: () => invalidateRider(queryClient),
    onError: (error) => {
      console.debug("[useUpdateRiderProfileMutation] error", error);
    },
  });
}

/** POST /riders/join {business_number} — request to work for a fleet. */
export function useSubmitJoinRequestMutation() {
  return useMutation({
    mutationFn: (businessNumber: string) =>
      submitRiderJoinRequest({ business_number: businessNumber }),
    onError: (error) => {
      console.debug("[useSubmitJoinRequestMutation] error", error);
    },
  });
}

/** GET /riders/join-requests — rider's own fleet join requests. */
export function useMyJoinRequestsQuery(enabled = true) {
  return useQuery({
    queryKey: [...RIDER_KEYS.all, "join-requests"],
    queryFn: async () => {
      const res = await fetchMyJoinRequests();
      return res.data ?? [];
    },
    enabled,
    staleTime: 30000,
    retry: false,
  });
}

export { extractApiErrorMessage };
