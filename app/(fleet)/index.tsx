import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Fleet Index - Redirects to Dashboard
 */
export default function FleetIndex() {
  useEffect(() => {
    router.replace('/(fleet)/(drawer)/dashboard');
  }, []);

  return null;
}