import { Redirect } from 'expo-router';

/**
 * Universal-link entry for https://teincfood.com/reset-password.
 *
 * The native app does not take reset tokens directly; land on the
 * forgot-password screen so the user can request a fresh link.
 */
export default function ResetPasswordDeepLink() {
  return <Redirect href="/(auth)/forgot-password" />;
}
