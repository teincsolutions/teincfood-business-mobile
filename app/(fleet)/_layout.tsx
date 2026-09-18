import { Stack } from 'expo-router';

export default function FleetLayout() {
  // Fleet managers are fully online: no offline reference-cache sync.
  // (Seller offline machinery lives in app/(seller)/_layout.tsx only.)
  return <Stack screenOptions={{ headerShown: false }} />;
}