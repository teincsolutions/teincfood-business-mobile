// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
} from 'tamagui';
import {
  ArrowLeft,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Theme Settings Screen
 */
export default function ThemeSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedTheme, setSelectedTheme] = useState('system');

  const themes = [
    {
      id: 'light',
      icon: Sun,
      title: 'Light',
      description: 'Light theme for daytime use',
      preview: { bg: '#FFFFFF', text: '#1A1A1A', accent: '#E91E63' },
    },
    {
      id: 'dark',
      icon: Moon,
      title: 'Dark',
      description: 'Dark theme for nighttime use',
      preview: { bg: '#1A1A1A', text: '#FFFFFF', accent: '#E91E63' },
    },
    {
      id: 'system',
      icon: Monitor,
      title: 'System',
      description: 'Follow system settings',
      preview: null,
    },
  ];

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    // In a real app, you would apply the theme here
    Alert.alert('Theme Changed', `Theme set to ${themeId}`);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <Button
            size="$3"
            circular
            backgroundColor="$gray3"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Theme</Text>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Theme Info */}
          <Card padding="$4" bordered backgroundColor="$purple2">
            <XStack gap="$3" alignItems="center">
              <Palette size={24} color="$purple10" />
              <YStack flex={1}>
                <Text fontWeight="bold" color="$purple10">
                  Choose Your Theme
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Select a theme that suits your preference
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Theme Options */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Appearance
              </Text>
              <Separator />

              {themes.map((theme, index) => (
                <YStack key={theme.id}>
                  <Button
                    unstyled
                    padding="$3"
                    backgroundColor={
                      selectedTheme === theme.id ? '$primaryLight' : 'transparent'
                    }
                    borderWidth={2}
                    borderColor={
                      selectedTheme === theme.id ? '$primary' : '$borderColor'
                    }
                    borderRadius="$4"
                    onPress={() => handleThemeChange(theme.id)}
                  >
                    <XStack gap="$3" alignItems="center">
                      <YStack
                        width={48}
                        height={48}
                        backgroundColor={
                          theme.id === 'system'
                            ? '$gray3'
                            : theme.preview?.bg || '$gray3'
                        }
                        borderRadius="$3"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={1}
                        borderColor="$borderColor"
                      >
                        <theme.icon
                          size={24}
                          color={
                            theme.id === 'light'
                              ? '#1A1A1A'
                              : theme.id === 'dark'
                              ? '#FFFFFF'
                              : '$colorMuted'
                          }
                        />
                      </YStack>
                      <YStack flex={1}>
                        <Text fontWeight="bold">{theme.title}</Text>
                        <Text color="$colorMuted" fontSize="$2">
                          {theme.description}
                        </Text>
                      </YStack>
                      {selectedTheme === theme.id && (
                        <YStack
                          width={24}
                          height={24}
                          borderRadius="$10"
                          backgroundColor="$primary"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Check size={16} color="$background" />
                        </YStack>
                      )}
                    </XStack>
                  </Button>
                  {index < themes.length - 1 && <Separator marginTop="$2" />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Preview */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Preview
              </Text>
              <Separator />

              <YStack
                padding="$4"
                borderRadius="$4"
                backgroundColor={
                  selectedTheme === 'light'
                    ? '#FFFFFF'
                    : selectedTheme === 'dark'
                    ? '#1A1A1A'
                    : '$background'
                }
                borderWidth={1}
                borderColor="$borderColor"
              >
                <YStack gap="$3">
                  <Text
                    fontWeight="bold"
                    color={
                      selectedTheme === 'light'
                        ? '#1A1A1A'
                        : selectedTheme === 'dark'
                        ? '#FFFFFF'
                        : '$color'
                    }
                  >
                    Sample Heading
                  </Text>
                  <Text
                    color={
                      selectedTheme === 'light'
                        ? '#666666'
                        : selectedTheme === 'dark'
                        ? '#AAAAAA'
                        : '$colorMuted'
                    }
                    fontSize="$3"
                  >
                    This is how your app will look with the selected theme.
                  </Text>
                  <Button
                    size="$3"
                    backgroundColor={
                      selectedTheme === 'light' || selectedTheme === 'dark'
                        ? '#E91E63'
                        : '$primary'
                    }
                    width={120}
                  >
                    <Text color="$background" fontWeight="bold">
                      Button
                    </Text>
                  </Button>
                </YStack>
              </YStack>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}