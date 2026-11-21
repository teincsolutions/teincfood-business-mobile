import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { AppState } from "react-native";
import {
  clearRevokedBusinessAccess,
  useMembershipGuard,
  type MembershipRevokedError,
} from "@teincfood/core";
import { queryClient } from "@/providers/QueryProvider";
import type { Business } from "@/types/business.model";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useConnectivityStore } from "@/stores/connectivity.store";

let handlingRevocation = false;

/**
 * Shared revocation handler. Safe to call from the online membership guard or
 * from offline-license failures. It is mounted at the root so a removed member
 * loses access on every route, not just seller screens.
 */
export async function handleMembershipRevoked(
  businessId: string,
  _error?: MembershipRevokedError,
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || handlingRevocation) return;
  handlingRevocation = true;
  try {
    // Wipe offline member credentials, this terminal's license and the
    // cached business reference data. Queued orders are left untouched.
    await clearRevokedBusinessAccess({
      businessId,
      userId,
      clearDeviceLicense: true,
    });

    const businessState = useBusinessStore.getState();
    const remaining = businessState.businesses.filter(
      (business) => business.id !== businessId,
    );
    businessState.setBusinesses(remaining);
    if (businessState.activeBusiness?.id === businessId) {
      businessState.setActiveBusiness(
        (remaining[0] as unknown as Business | undefined) ?? null,
      );
    }

    queryClient.removeQueries({ queryKey: ["businesses"] });
    queryClient.removeQueries({ queryKey: ["business-members"] });
    queryClient.invalidateQueries();

    useAuthStore.getState().clearAuth();
    router.replace("/(auth)/login");
  } finally {
    handlingRevocation = false;
  }
}

/**
 * Enforces membership online without weakening the 30-day offline session.
 * The guard only runs while the cloud is reachable; a removed member is logged
 * out as soon as the app reconnects or returns to the foreground.
 */
export function useMembershipRevocation() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id ?? null);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const cloudReachable = useConnectivityStore((s) => s.isCloudReachable);
  const checkRef = useRef<() => void>(() => undefined);

  const enabled = Boolean(
    userId && activeBusinessId && isOnline && cloudReachable === "reachable",
  );

  const { checkNow } = useMembershipGuard({
    businessId: activeBusinessId,
    userId,
    enabled,
    onRevoked: handleMembershipRevoked,
  });

  checkRef.current = checkNow;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") checkRef.current();
    });
    return () => subscription.remove();
  }, []);

  useEffect(
    () =>
      useConnectivityStore.subscribe((state, previous) => {
        if (
          state.isCloudReachable === "reachable" &&
          previous.isCloudReachable !== "reachable"
        ) {
          checkRef.current();
        }
      }),
    [],
  );

  return { checkNow, handleRevoked: handleMembershipRevoked };
}
