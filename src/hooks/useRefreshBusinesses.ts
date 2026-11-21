import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ensureDeviceLease } from "@teincfood/core";
import * as businessService from "@/services/business.service";
import { useBusinessStore } from "@/stores/business.store";
import { BUSINESSES_QUERY_KEY } from "./useBusinessesQuery";

/**
 * Refresh every business list after membership changes (invite accept/leave).
 * Syncs the store directly so select-business updates even where the list
 * queries aren't mounted, then invalidates query caches. When a preferred
 * business is supplied (invite accept), it is selected unconditionally and a
 * device lease is ensured immediately so the member can work offline.
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
        if (preferBusinessId) {
          const found = list.find((b) => b.id === preferBusinessId);
          if (found) {
            state.setActiveBusiness(found as any);
            void ensureDeviceLease(preferBusinessId).catch((error) => {
              console.debug(
                "[useRefreshBusinesses] device lease failed",
                preferBusinessId,
                error,
              );
            });
          }
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
