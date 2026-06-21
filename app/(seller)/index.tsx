// @ts-nocheck
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useActiveBusiness } from '@/hooks/useActiveBusiness';

export default function SellerIndex() {
  const { businesses, hasBusiness, switchBusiness } = useActiveBusiness();

  useEffect(() => {
    if (!hasBusiness) {
      router.replace('/(seller)/select-business');
    } else if (businesses.length === 1) {
      switchBusiness(businesses[0].id);
      router.replace('/(seller)/(drawer)/dashboard');
    } else {
      router.replace('/(seller)/select-business');
    }
  }, []);

  return null;
}
