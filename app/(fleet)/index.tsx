// @ts-nocheck
import { useEffect } from 'react';
import { router } from 'expo-router';
import { YStack, Spinner, Text } from 'tamagui';
import { useBusinessesQuery } from '@/hooks/useBusinessesQuery';
import { useBusinessStore } from '@/stores/business.store';

export default function FleetIndex() {
  const { isFetched } = useBusinessesQuery();
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);

  useEffect(() => {
    if (!isFetched) return;
    if (activeBusiness) {
      router.replace('/(fleet)/(drawer)/dashboard');
    } else {
      router.replace('/(shared)/select-business');
    }
  }, [isFetched, activeBusiness]);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Spinner size="large" color="$primary" />
      <Text marginTop="$3" fontSize="$4" color="$colorSecondary">Loading...</Text>
    </YStack>
  );
}
