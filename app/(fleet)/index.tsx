// @ts-nocheck
import { useEffect } from 'react';
import { router } from 'expo-router';
import { YStack, Spinner, Text } from 'tamagui';
import { useActiveBusiness } from '@/hooks/useActiveBusiness';

export default function FleetIndex() {
  const { businesses, hasBusiness, switchBusiness } = useActiveBusiness();

  useEffect(() => {
    if (!hasBusiness) {
      router.push('/(shared)/select-business');
    } else if (businesses.length === 1) {
      switchBusiness(businesses[0].id);
      router.replace('/(fleet)/(drawer)/dashboard');
    } else {
      router.replace('/(shared)/select-business');
    }
  }, []);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <Spinner size="large" color="$primary" />
      <Text marginTop="$3" fontSize="$4" color="$colorSecondary">Loading...</Text>
    </YStack>
  );
}