import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Rider Index - Redirects to Home
 */
export default function RiderIndex() {
  useEffect(() => {
    router.replace('/(rider)/home');
  }, []);

  return null;
}