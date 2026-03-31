// @ts-nocheck
import { Stack } from 'expo-router';

/**
 * Shared Screens Layout
 * Contains notifications and profile screens accessible by both sellers and riders
 */
export default function SharedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="profile/privacy-policy" />
      <Stack.Screen name="profile/security" />
      <Stack.Screen name="profile/terms" />
      <Stack.Screen name="profile/theme" />
    </Stack>
  );
}
