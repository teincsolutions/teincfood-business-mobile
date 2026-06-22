// @ts-nocheck

import { Stack } from 'expo-router';

/**
 * Shared Screens Layout
 * Contains notifications and profile screens accessible by both sellers and riders
 * Group folders (businesses/, wallet/) have their own _layout.tsx — parent only declares entry points
 */
export default function SharedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="select-business" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/documents" />
      <Stack.Screen name="profile/help" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/privacy-policy" />
      <Stack.Screen name="profile/security" />
      <Stack.Screen name="profile/terms" />
      <Stack.Screen name="profile/theme" />
      <Stack.Screen name="settings/operating-hours" />
    </Stack>
  );
}
