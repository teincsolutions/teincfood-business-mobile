// @ts-nocheck
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { YStack, Text, Spinner } from "tamagui";
import { toast } from "sonner-native";
import { routeCapabilities } from "@/constants/route-capabilities";
import { useMyBusinessCapabilities } from "@/hooks/useMyBusinessCapabilities";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";

/**
 * Route-level capability guard. Matches the full segment path against
 * routeCapabilities (exact first, then longest-prefix); without the required
 * capability the user is toasted + redirected. While membership is loading,
 * renders nothing (never flash-redirect). Backend remains the real enforcer.
 */
export function useCapabilityGuard(fallback = "/(shared)/select-business") {
  const router = useRouter();
  const segments = useSegments();
  const { data: membership, isLoading } = useMyBusinessCapabilities();
  const { activeBusinessId } = useActiveBusiness();

  useEffect(() => {
    if (isLoading || !membership?.capabilities || segments.length < 1) return;
    // No active business (e.g. rider personal wallet): nothing business-scoped
    // to protect here; backend enforces per request.
    if (!activeBusinessId) return;
    const path = `/${segments.join("/")}`;
    const requiredCap =
      routeCapabilities[path] ??
      Object.keys(routeCapabilities)
        .filter((route) => path === route || path.startsWith(`${route}/`))
        .sort((a, b) => b.length - a.length)
        .map((route) => routeCapabilities[route])[0];
    if (!requiredCap) return;
    if (!membership.capabilities.includes(requiredCap)) {
      toast.error("You don't have permission to access this screen");
      router.replace(fallback);
    }
  }, [segments, membership, isLoading, activeBusinessId, router, fallback]);

  return { membership, isLoading };
}

export function RequireCapability({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: string;
}) {
  const { membership, isLoading } = useCapabilityGuard(fallback);
  if (isLoading || !membership?.capabilities) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    );
  }
  return <>{children}</>;
}
