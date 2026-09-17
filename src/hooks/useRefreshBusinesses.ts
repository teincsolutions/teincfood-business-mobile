import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as businessService from "@/services/business.service";
import { useBusinessStore } from "@/stores/business.store";
import { BUSINESSES_QUERY_KEY } from "./useBusinessesQuery";

/**
 * Refresh every business list after membership changes (invite accept/leave).
 * Syncs the store directly so select-business updates even where the list
 * queries aren't mounted, then invalidates query caches. When no business is
 * active, auto-selects the given (just-joined) business.
 */
export function useRefreshBusinesses() {
  const queryClient = useQueryClient();
  return useCallback(
    async (preferBusinessId?: string | null) => {
      try {
        const res = await businessService.fetchMyBusinesses();
        const list = res.data ?? [];
        useBusinessStore.getState().setBusinesses(list);
        const state = useBusinessStore.getState();
        if (!state.activeBusiness && preferBusinessId) {
          const found = list.find((b) => b.id === preferBusinessId);
          if (found) state.setActiveBusiness(found as any);
        }
      } catch (e) {
        console.debug("[useRefreshBusinesses] store sync failed", e);
      }
      await queryClient.invalidateQueries({ queryKey: BUSINESSES_QUERY_KEY });
      await queryClient.invalidateQueries({
        queryKey: ["businesses", "relationships"],
      });
    },
    [queryClient],
  );
}
