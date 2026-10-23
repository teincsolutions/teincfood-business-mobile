// @ts-nocheck
import { useEffect } from 'react';
import { router } from 'expo-router';
import { YStack, Spinner, Text } from 'tamagui';
import { useBusinessStore } from '@/stores/business.store';

export default function FleetIndex() {
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const hydrated = useBusinessStore((s) => s.isHydrated);

  useEffect(() => {
    // Offline-first: route from the persisted store, never from a network
    // fetch. Fleet surfaces are online-only, but boot routing itself must not
    // depend on /businesses/me resolving.
    if (!hydrated) return;
    router.replace(
      activeBusiness
        ? '/(fleet)/(drawer)/dashboard'
        : '/(shared)/select-business',
    );
  }, [hydrated, activeBusiness]);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Spinner size="large" color="$primary" />
      <Text marginTop="$3" fontSize="$4" color="$colorSecondary">Loading...</Text>
    </YStack>
  );
}
