import { Redirect } from 'expo-router';

/**
 * Universal-link entry for https://teincfood.com/business.
 *
 * The seller index reads the persisted active business and routes to the
 * dashboard (or business selection when none is active yet).
 */
export default function BusinessDeepLink() {
  return <Redirect href="/(seller)" />;
}
