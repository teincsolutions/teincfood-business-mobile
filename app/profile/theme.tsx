// @ts-nocheck
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';
import { Sun, Moon, Smartphone, Check } from '@tamagui/lucide-icons';
import { useUIStore } from '@/stores/ui.store';

const THEME_OPTIONS = [
  {
    key: 'light',
    label: 'Light',
    description: 'Use the bright interface across the app.',
    icon: Sun,
  },
  {
    key: 'dark',
    label: 'Dark',
    description: 'Use a darker interface for low-light environments.',
    icon: Moon,
  },
  {
    key: 'system',
    label: 'System',
    description: 'Match your device appearance automatically.',
    icon: Smartphone,
  },
];

export default function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const themeMode = useUIStore((state) => state.themeMode);
  const setThemeMode = useUIStore((state) => state.setThemeMode);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Theme
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" gap="$6">
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
              Appearance
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" lineHeight={22}>
              Choose how TeincFoods should look across the app.
            </Text>
          </YStack>

          <YStack gap="$4">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = themeMode === option.key;

              return (
                <XStack
                  key={option.key}
                  alignItems="center"
                  gap="$4"
                  backgroundColor="$backgroundStrong"
                  padding="$4"
                  borderRadius="$5"
                  borderWidth={isActive ? 2 : 1}
                  borderColor={isActive ? '$primary' : '$borderColor'}
                  pressStyle={{ backgroundColor: '$backgroundSoft' }}
                  onPress={() => setThemeMode(option.key as any)}
                >
                  <YStack
                    width={44}
                    height={44}
                    borderRadius="$full"
                    backgroundColor={isActive ? 'rgba(255,145,0,0.12)' : '$backgroundSoft'}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Icon size={20} color={isActive ? '$primary' : '$colorSecondary'} />
                  </YStack>

                  <YStack flex={1} gap="$1">
                    <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                      {option.label}
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" lineHeight={20}>
                      {option.description}
                    </Text>
                  </YStack>

                  {isActive && (
                    <YStack
                      width={28}
                      height={28}
                      borderRadius="$full"
                      backgroundColor="$primary"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Check size={16} color="white" />
                    </YStack>
                  )}
                </XStack>
              );
            })}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
