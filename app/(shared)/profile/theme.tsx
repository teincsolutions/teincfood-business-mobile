// @ts-nocheck

import { ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
} from 'tamagui';
import {
  Sun,
  Moon,
  Monitor,
  Check,
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BackButton } from '@/components/ui';

/**
 * Theme Settings Screen
 */
export default function ThemeSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeMode, resolvedTheme, setThemeMode } = useAppTheme();

  const themes = [
    {
      id: 'light',
      icon: Sun,
      title: 'Light',
      description: 'Light theme for daytime use',
      iconBg: '#F5F5F5',
      iconColor: '#F97316',
    },
    {
      id: 'dark',
      icon: Moon,
      title: 'Dark',
      description: 'Dark theme for nighttime use',
      iconBg: '#1A1A1A',
      iconColor: '#F97316',
    },
    {
      id: 'system',
      icon: Monitor,
      title: 'System',
      description: 'Follow system settings',
      iconBg: '#E5E7EB',
      iconColor: '#6B7280',
    },
  ];

  const previewBg = themeMode === 'light' ? '#FFFFFF' : themeMode === 'dark' ? '#1A1A1A' : undefined;
  const previewText = themeMode === 'light' ? '#1A1A1A' : themeMode === 'dark' ? '#FFFFFF' : undefined;
  const previewSub = themeMode === 'light' ? '#6B7280' : themeMode === 'dark' ? '#9CA3AF' : undefined;

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        paddingBottom="$3"
        gap="$3"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Theme
        </Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack paddingHorizontal="$4" paddingTop="$4" paddingBottom={insets.bottom + 24} gap="$4">

          {/* Appearance options */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">
                Appearance
              </Text>
              <Separator />

              {themes.map((theme, index) => {
                const active = themeMode === theme.id;
                return (
                  <YStack key={theme.id}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => setThemeMode(theme.id as any)}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: active ? '#F97316' : 'transparent',
                        backgroundColor: active ? 'rgba(249,115,22,0.06)' : 'transparent',
                      }}
                    >
                      <XStack gap="$3" alignItems="center">
                        <YStack
                          width={48}
                          height={48}
                          borderRadius="$3"
                          backgroundColor={theme.iconBg}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <theme.icon size={24} color={theme.iconColor} />
                        </YStack>
                        <YStack flex={1}>
                          <Text fontSize="$4" fontWeight="700" fontFamily="$body" color="$color">
                            {theme.title}
                          </Text>
                          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                            {theme.description}
                          </Text>
                        </YStack>
                        {active && (
                          <YStack
                            width={26}
                            height={26}
                            borderRadius={13}
                            backgroundColor="#F97316"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Check size={15} color="white" />
                          </YStack>
                        )}
                      </XStack>
                    </TouchableOpacity>
                    {index < themes.length - 1 && <Separator marginVertical="$1" />}
                  </YStack>
                );
              })}
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}