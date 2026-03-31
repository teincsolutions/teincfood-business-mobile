// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator, Avatar } from 'tamagui';
import { User, Mail, Phone, Truck, LogOut, HelpCircle, FileText, Shield, Palette } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Rider Profile Screen
 */
export default function RiderProfile() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.replace('/(auth)/login');
  };

  const profileItems = [
    { icon: User, label: 'Edit Profile', description: 'Update your personal information', route: '/(shared)/profile/edit' },
    { icon: FileText, label: 'Documents', description: 'Upload ID, license, insurance', route: '/(shared)/profile/documents' },
    { icon: Shield, label: 'Security', description: 'Password, biometrics, 2FA', route: '/(shared)/profile/security' },
    { icon: FileText, label: 'Terms of Service', description: 'Read our terms', route: '/(shared)/profile/terms' },
    { icon: Shield, label: 'Privacy Policy', description: 'How we handle your data', route: '/(shared)/profile/privacy-policy' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get help with the app', route: '/(shared)/profile/help' },
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
                  src={user?.avatarUrl}
                />
                <Avatar.Fallback backgroundColor="$primary">
                  <Text color="$background" fontWeight="bold" fontSize="$6">
                    {user?.fullName?.charAt(0) || 'R'}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <YStack flex={1} gap="$1">
                <Text fontSize="$6" fontWeight="bold">
                  {user?.fullName || 'Rider'}
                </Text>
                <Text color="$colorMuted" fontSize="$3">
                  {user?.email || 'rider@example.com'}
                </Text>
                <Text color="$colorMuted" fontSize="$3">
                  {user?.phone || '+233 XX XXX XXXX'}
                </Text>
                <XStack gap="$2" alignItems="center" marginTop="$1">
                  <YStack
                    width={8}
                    height={8}
                    borderRadius="$10"
                    backgroundColor={user?.isOnline ? '$green10' : '$gray8'}
                  />
                  <Text color="$colorMuted" fontSize="$2">
                    {user?.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </XStack>
              </YStack>
            </XStack>
          </Card>

          {/* Vehicle Info */}
          {user?.vehicleType && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Truck size={20} color="$primary" />
                  <Text fontWeight="bold">Vehicle Information</Text>
                </XStack>
                <Separator />
                <YStack gap="$2">
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Vehicle Type</Text>
                    <Text textTransform="capitalize">{user.vehicleType}</Text>
                  </XStack>
                  {user.vehiclePlateNumber && (
                    <XStack justifyContent="space-between">
                      <Text color="$colorMuted">Plate Number</Text>
                      <Text>{user.vehiclePlateNumber}</Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>
            </Card>
          )}

          {/* Stats */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontWeight="bold">Your Statistics</Text>
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Total Deliveries</Text>
                <Text fontWeight="bold">156</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Acceptance Rate</Text>
                <Text fontWeight="bold">94%</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Average Rating</Text>
                <Text fontWeight="bold">4.8 ★</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Total Earnings</Text>
                <Text fontWeight="bold">GHS 5,680.00</Text>
              </XStack>
            </YStack>
          </Card>

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