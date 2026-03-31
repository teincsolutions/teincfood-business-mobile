import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal', animation: 'slide_from_left' }}>
      <Stack.Screen name="business-profile" options={{ headerShown: false }} />
      <Stack.Screen name="delivery-settings" options={{ headerShown: false }} />
      <Stack.Screen name="operating-hours" options={{ headerShown: false }} />
      <Stack.Screen name="payment-settings" options={{ headerShown: false }} />
    </Stack>
  );
}
