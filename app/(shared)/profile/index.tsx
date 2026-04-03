// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator, Avatar } from 'tamagui';
import { User, Mail, Phone, MapPin, Building, LogOut, HelpCircle, FileText, Shield, Palette } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Seller Profile Screen
 */
export default function SharedProfile() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  const profileItems = [
    { icon: User, label: 'Edit Profile', description: 'Update your personal information', route: '/(shared)/profile/edit' },
    { icon: Shield, label: 'Security', description: 'Password, biometrics, 2FA', route: '/(shared)/profile/security' },
    { icon: Palette, label: 'Theme', description: 'Light, dark, or system', route: '/(shared)/profile/theme' },
    { icon: FileText, label: 'Terms of Service', description: 'Read our terms', route: '/(shared)/profile/terms' },
    { icon: Shield, label: 'Privacy Policy', description: 'How we handle your data', route: '/(shared)/profile/privacy-policy' },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          {/* Profile Header */}
          <Card padding="$4" bordered backgroundColor="$background">
            <XStack gap="$4" alignItems="center">
              <Avatar circular size="$12">
                <Avatar.Image
                  src={user?.avatarUrl}
                />
                <Avatar.Fallback backgroundColor="$primary" justifyContent="center" alignItems="center">
                  <Text color="$background" fontWeight="bold" fontSize="$7">
                    {user?.fullName?.charAt(0) || 'S'}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <YStack flex={1} gap="$1">
                <Text fontSize="$5" fontWeight="bold" color="$color">
                  {user?.businessName || user?.fullName || 'Seller'}
                </Text>
                <Text color="$colorMuted" fontSize="$3">
                  {user?.email || 'seller@example.com'}
                </Text>
                <Text color="$colorMuted" fontSize="$3">
                  {user?.phone || '+233 XX XXX XXXX'}
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Business Info */}
          {user?.businessName && (
            <Card padding="$4" bordered backgroundColor="$background">
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Building size={20} color="$primary" />
                  <Text fontWeight="bold" color="$color">Business Information</Text>
                </XStack>
                <Separator backgroundColor="$borderColor" />
                <YStack gap="$2">
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Business Name</Text>
                    <Text color="$color">{user.businessName}</Text>
                  </XStack>
                  {user.businessType && (
                    <XStack justifyContent="space-between">
                      <Text color="$colorMuted">Type</Text>
                      <Text color="$color">{user.businessType}</Text>
                    </XStack>
                  )}
                  {user.businessAddress && (
                    <XStack justifyContent="space-between">
                      <Text color="$colorMuted">Address</Text>
                      <Text color="$color" flex={1} textAlign="right">{user.businessAddress}</Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </Card>
          )}

          {/* Menu Items */}
          <Card padding="$4" bordered backgroundColor="$background">
            <YStack gap="$1">
              {profileItems.map((item, index) => (
                <YStack key={index}>
                  <Button
                    unstyled
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    pressStyle={{ backgroundColor: "$backgroundHover" }}
                    onPress={() => router.push(item.route)}
                  >
                    <item.icon size={20} color="$colorMuted" />
                    <YStack flex={1} alignItems="flex-start">
                      <Text fontWeight="bold" color="$color">{item.label}</Text>
                      <Text color="$colorMuted" fontSize="$2">{item.description}</Text>
                    </YStack>
                  </Button>
                  {index < profileItems.length - 1 && <Separator backgroundColor="$borderColor" />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* App Version */}
          <YStack alignItems="center" padding="$4">
            <Text color="$colorMuted" fontSize="$2">TeincFoodBusiness v1.0.0</Text>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}