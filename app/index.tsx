import { Redirect } from 'expo-router';

/**
 * App entry point.
 * We immediately redirect to the splash screen. The splash screen
 * will safely wait for Zustand stores to hydrate from MMKV before
 * performing the actual navigation routing.
 */
export default function Index() {
  return <Redirect href="/(auth)/splash" />;
}
