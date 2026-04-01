import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useLocationStore } from '@/stores/location.store';

interface LocationGuardProps {
  children: React.ReactNode;
}

export function LocationGuard({ children }: LocationGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const hasLocation = useLocationStore((state) => state.hasLocation());
  const isHydrated = useLocationStore((state) => state.isHydrated);

  useEffect(() => {
    // Only check after the store has hydrated
    if (!isHydrated) return;

    const currentRoute = segments.join('/');
    
    // Allow access to location screen itself
    if (currentRoute.includes('(auth)/location')) {
      return;
    }

    // If location is not set, redirect to location screen
    if (!hasLocation) {
      router.replace('/(auth)/location');
    }
  }, [hasLocation, isHydrated, segments]);

  // Don't render children until we've checked location
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}