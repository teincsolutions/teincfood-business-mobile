import { useEffect } from 'react';
import { router } from 'expo-router';
import { useBusinessStore } from '@/stores/business.store';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Seller Index - Redirects to Dashboard or Select Business
 */
export default function SellerIndex() {
  const { businesses, getDefaultBusiness } = useBusinessStore();

  useEffect(() => {
    if (businesses.length === 0) {
      router.replace('/(seller)/businesses/add');
    } else if (businesses.length === 1) {
      useBusinessStore.getState().setActiveBusiness(businesses[0] as any);
      router.replace('/(seller)/(drawer)/dashboard');
    } else {
      const defaultBusiness = getDefaultBusiness();
      if (defaultBusiness) {
        useBusinessStore.getState().setActiveBusiness(defaultBusiness as any);
        router.replace('/(seller)/(drawer)/dashboard');
      } else {
        router.replace('/(seller)/select-business');
      }
    }
  }, []);

  return null;
}
