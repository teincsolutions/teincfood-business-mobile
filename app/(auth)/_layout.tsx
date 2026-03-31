// @ts-nocheck
import { Stack } from 'expo-router';
import { useTheme } from 'tamagui';

/**
 * Auth route group layout.
 * No tab bar visible — full-screen stack navigation for auth flow.
 */
export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.background.val as string },
      }}
    />
  );
}
