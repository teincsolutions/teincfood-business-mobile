import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Seller Index - Always navigates to drawer dashboard.
 * Prerequisite check is handled in-app (dismissable banner).
 */
export default function SellerIndex() {
  useEffect(() => {
    router.replace('/(seller)/(drawer)/dashboard');
  }, []);

  return null;
}
