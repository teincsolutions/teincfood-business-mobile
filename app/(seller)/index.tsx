// @ts-nocheck
import { useEffect } from 'react';
import { router } from 'expo-router';
import { YStack, Spinner, Text } from 'tamagui';
import { useBusinessStore } from '@/stores/business.store';

export default function SellerIndex() {
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const hydrated = useBusinessStore((s) => s.isHydrated);

  useEffect(() => {
    // Offline-first: the persisted business store is the source of truth for
    // "which business am I in". Never wait for GET /businesses/me — on poor
    // internet that request can hang for the whole timeout and strand the
    // seller on a full-screen "Loading..." spinner even though the local
    // store already knows where to go.
    if (!hydrated) return;
    router.replace(
      activeBusiness
        ? '/(seller)/(drawer)/dashboard'
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
