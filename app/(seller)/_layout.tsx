import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useDisplayStore } from '@/stores/display.store';
import { useMyBusinessCapabilities } from '@/hooks/useMyBusinessCapabilities';
import { useBusinessReferenceDataSync } from '@teincfood/core';
import { useOfflineOrderHydration } from '@teincfood/core';
import { routeCapabilities } from '@/constants/route-capabilities';
import { StartupReadinessGate } from '@/components/StartupReadinessGate';
import { toast } from 'sonner-native';
import { useAuthStore } from '@/stores/auth.store';
import { useBusinessStore } from '@/stores/business.store';
import { useOfflineAuth } from '@/hooks/useOfflineAuth';
import { useOfflineSetupStore } from '@/stores/offlineSetup.store';

/** Route groups like `(drawer)` are URL-transparent — drop them for matching. */
function normalizeSegments(segments: string[]): string[] {
  return segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
}

function requiredCapabilityFor(segments: string[]): string | null {
  const path = `/${normalizeSegments(segments).join('/')}`;
  if (routeCapabilities[path]) return routeCapabilities[path];
  const prefix = Object.keys(routeCapabilities)
    .filter((route) => path.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? routeCapabilities[prefix] : null;
}

export default function SellerLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { data: membership } = useMyBusinessCapabilities();
  const accessToken = useAuthStore((s) => s.accessToken);
  const offlineMemberId = useAuthStore((s) => s.offlineMemberId);
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const { loading: offlineLoading, hasDevice, evaluation: offlineEvaluation } = useOfflineAuth();
  const setupSkipped = useOfflineSetupStore((s) =>
    activeBusinessId ? Boolean(s.skipped[activeBusinessId]) : false,
  );

  // Keep the offline reference cache (menus, roles, members, taxes, business
  // profile, operating hours) in sync while the restaurant is online.
  useBusinessReferenceDataSync();

  // Seed order screens from the durable offline read model so they render
  // current + recent orders immediately after a cold start (even offline).
  useOfflineOrderHydration();

  useEffect(() => {
    // First online setup: require a device license before offline work starts.
    // An offline member session already has one and skips this gate.
    if (
      accessToken &&
      !offlineMemberId &&
      activeBusinessId &&
      !offlineLoading &&
      !setupSkipped &&
      (!hasDevice || (offlineEvaluation != null && !offlineEvaluation.valid))
    ) {
      router.replace('/(auth)/offline-setup' as any);
      return;
    }

    const displayStore = useDisplayStore.getState();
    const currentPath = segments.join('/');
    if (displayStore.calloutDisplayEnabled && !currentPath.includes('display')) {
      router.replace('/(seller)/display' as any);
    } else if (displayStore.kitchenDisplayEnabled && !currentPath.includes('kitchen')) {
      router.replace('/(seller)/kitchen' as any);
    }
  }, [accessToken, offlineMemberId, activeBusinessId, offlineLoading, hasDevice, offlineEvaluation, setupSkipped, router, segments]);

  useEffect(() => {
    if (!membership?.capabilities || segments.length < 1) return;

    const requiredCap = requiredCapabilityFor(segments as unknown as string[]);
    if (!requiredCap) return;

    if (!membership.capabilities.includes(requiredCap)) {
      toast.error("You don't have permission to access this screen");
      router.replace('/(seller)/dashboard' as any);
    }
  }, [segments, membership]);

  return (
    <StartupReadinessGate>
      <Stack screenOptions={{ headerShown: false }} />
    </StartupReadinessGate>
  );
}
