import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Seller Index - Redirects to Dashboard
 */
export default function SellerIndex() {
  useEffect(() => {
    router.replace('/(seller)/dashboard');
  }, []);

  return null;
}