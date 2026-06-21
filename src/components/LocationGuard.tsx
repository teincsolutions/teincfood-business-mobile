import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useLocationStore } from '@/stores/location.store';

// Auth routes that don't require location — user sets location during onboarding
const PUBLIC_PREFIXES = [
  '(auth)/',
  'index',
  '+not-found',
];

interface LocationGuardProps {
  children: React.ReactNode;
}

export function LocationGuard({ children }: LocationGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const hasLocation = useLocationStore((state) => state.hasLocation());
  const isHydrated = useLocationStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const currentRoute = segments.join('/');

    // Allow public/auth routes through regardless of location
    const isPublic = PUBLIC_PREFIXES.some((prefix) => currentRoute.startsWith(prefix) || currentRoute === prefix);
    if (isPublic) return;

    // Allow location screen itself
    if (currentRoute.includes('location')) return;

    if (!hasLocation) {
      router.replace('/(auth)/location');
    }
  }, [hasLocation, isHydrated, segments]);

  if (!isHydrated) return null;

  return <>{children}</>;
}