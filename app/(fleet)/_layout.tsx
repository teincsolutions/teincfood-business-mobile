import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { useHasBusiness } from '@/hooks/usePrerequisiteCheck';

export default function FleetLayout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: hasBusiness, isLoading, isError } = useHasBusiness();

  useEffect(() => {
    if (isLoading || isError) return;
    if (user && !hasBusiness) {
      router.replace('/(seller)/businesses/add');
    }
  }, [hasBusiness, isLoading, isError, user, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
