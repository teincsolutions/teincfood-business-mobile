import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useDisplayStore } from '@/stores/display.store';

export default function SellerLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const enabled = useDisplayStore.getState().calloutDisplayEnabled;
    const currentPath = segments.join('/');
    if (enabled && !currentPath.includes('display')) {
      router.replace('/(seller)/display');
    }
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
