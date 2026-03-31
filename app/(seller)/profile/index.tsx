// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator, Avatar } from 'tamagui';
import { User, Mail, Phone, MapPin, Building, LogOut, HelpCircle, FileText, Shield, Palette } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Seller Profile Screen
 */
export default function SellerProfile() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  const profileItems = [
    { icon: User, label: 'Edit Profile', description: 'Update your personal information', route: '/(seller)/profile/edit' },
    { icon: Shield, label: 'Security', description: 'Password, biometrics, 2FA', route: '/profile/security' },
    { icon: Palette, label: 'Theme', description: 'Light, dark, or system', route: '/profile/theme' },
    { icon: FileText, label: 'Terms of Service', description: 'Read our terms', route: '/profile/terms' },
    { icon: Shield, label: 'Privacy Policy', description: 'How we handle your data', route: '/profile/privacy-policy' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get help with the app', route: '/(seller)/profile/help' },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          {/* Profile Header */}
          <Card padding="$4" bordered>
            <XStack gap="$4" alignItems="center">
              <Avatar circular size="$8">
                <Avatar.Image
                  source={{ uri: user?.avatarUrl || undefined }}
                />
                <Avatar.Fallback backgroundColor="$primary">
                  <Text color="$background" fontWeight="bold" fontSize="$6">
                    {user?.fullName?.charAt(0) || 'S'}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <YStack flex={1} gap="$1">
                <Text fontSize="$6" fontWeight="bold">
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
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Building size={20} color="$primary" />
                  <Text fontWeight="bold">Business Information</Text>
                </XStack>
                <Separator />
                <YStack gap="$2">
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Business Name</Text>
                    <Text>{user.businessName}</Text>
                  </XStack>
                  {user.businessType && (
                    <XStack justifyContent="space-between">
                      <Text color="$colorMuted">Type</Text>
                      <Text>{user.businessType}</Text>
                    </XStack>
                  )}
                  {user.businessAddress && (
                    <XStack justifyContent="space-between">
                      <Text color="$colorMuted">Address</Text>
                      <Text flex={1} textAlign="right">{user.businessAddress}</Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </Card>
          )}

          {/* Menu Items */}
          <Card padding="$4" bordered>
            <YStack gap="$1">
              {profileItems.map((item, index) => (
                <YStack key={index}>
                  <Button
                    unstyled
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    pressStyle={{ backgroundColor: "$gray3" }}
                    onPress={() => router.push(item.route)}
                  >
                    <item.icon size={20} color="$colorMuted" />
                    <YStack flex={1} alignItems="flex-start">
                      <Text fontWeight="bold">{item.label}</Text>
                      <Text color="$colorMuted" fontSize="$2">{item.description}</Text>
                    </YStack>
                  </Button>
                  {index < profileItems.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Logout */}
          <Card padding="$4" bordered>
            <Button
              backgroundColor="$red10"
              onPress={handleLogout}
              icon={<LogOut size={18} color="$background" />}
            >
              <Text color="$background" fontWeight="bold">Logout</Text>
            </Button>
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