import { Stack } from 'expo-router';
import { useBusinessReferenceDataSync } from '@teincfood/core';

export default function FleetLayout() {
  // Keep the offline reference cache in sync while online.
  useBusinessReferenceDataSync();

  return <Stack screenOptions={{ headerShown: false }} />;
}