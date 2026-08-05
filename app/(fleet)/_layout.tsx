import { Stack } from 'expo-router';
import { useBusinessReferenceDataSync } from '@/reference/hooks';

export default function FleetLayout() {
  // Keep the offline reference cache in sync while online.
  useBusinessReferenceDataSync();

  return <Stack screenOptions={{ headerShown: false }} />;
}