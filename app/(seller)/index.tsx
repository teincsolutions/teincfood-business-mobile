import { useEffect } from 'react';
import { router } from 'expo-router';
import { useBusinessStore } from '@/stores/business.store';

/**
 * Seller Index - Redirects to Dashboard or Select Business
 */
export default function SellerIndex() {
  const { businesses, getDefaultBusiness } = useBusinessStore();

  useEffect(() => {
    // Check if seller has businesses
    if (businesses.length === 0) {
      // No businesses, redirect to add business
      router.replace('/(seller)/businesses/add');
    } else if (businesses.length === 1) {
      // Only one business, set it as active and go to dashboard
      const business = businesses[0];
      useBusinessStore.getState().setActiveBusiness(business as any);
      router.replace('/(seller)/(drawer)/dashboard');
    } else {
      // Multiple businesses, check if there's a default
      const defaultBusiness = getDefaultBusiness();
      if (defaultBusiness) {
        useBusinessStore.getState().setActiveBusiness(defaultBusiness as any);
        router.replace('/(seller)/(drawer)/dashboard');
      } else {
        // No default, show business selection
        router.replace('/(seller)/select-business');
      }
    }
  }, []);

  return null;
}
