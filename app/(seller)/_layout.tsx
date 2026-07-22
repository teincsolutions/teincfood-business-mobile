import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useDisplayStore } from '@/stores/display.store';

export default function SellerLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const displayStore = useDisplayStore.getState();
    const currentPath = segments.join('/');
    if (displayStore.calloutDisplayEnabled && !currentPath.includes('display')) {
      router.replace('/(seller)/display');
    } else if (displayStore.kitchenDisplayEnabled && !currentPath.includes('kitchen')) {
      router.replace('/(seller)/kitchen');
    }
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
