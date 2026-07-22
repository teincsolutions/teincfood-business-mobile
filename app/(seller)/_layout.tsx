import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useDisplayStore } from '@/stores/display.store';
import { useMyBusinessCapabilities } from '@/hooks/useMyBusinessCapabilities';
import { routeCapabilities } from '@/constants/route-capabilities';
import { toast } from 'sonner-native';

const capabilityRouteMap: Record<string, string> = {};
for (const [route, cap] of Object.entries(routeCapabilities)) {
  const parts = route.split('/').filter(Boolean);
  const key = parts[parts.length - 1];
  capabilityRouteMap[key] = cap;
}

export default function SellerLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { data: membership } = useMyBusinessCapabilities();

  useEffect(() => {
    const displayStore = useDisplayStore.getState();
    const currentPath = segments.join('/');
    if (displayStore.calloutDisplayEnabled && !currentPath.includes('display')) {
      router.replace('/(seller)/display' as any);
    } else if (displayStore.kitchenDisplayEnabled && !currentPath.includes('kitchen')) {
      router.replace('/(seller)/kitchen' as any);
    }
  }, []);

  useEffect(() => {
    if (!membership?.capabilities || segments.length < 1) return;

    const lastSegment = segments[segments.length - 1];
    const requiredCap = capabilityRouteMap[lastSegment];
    if (!requiredCap) return;

    if (!membership.capabilities.includes(requiredCap)) {
      toast.error("You don't have permission to access this screen");
      router.replace('/(seller)/dashboard' as any);
    }
  }, [segments, membership]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
