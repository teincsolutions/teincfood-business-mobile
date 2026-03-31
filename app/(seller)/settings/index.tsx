// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator, Switch } from 'tamagui';
import { Building, Clock, MapPin, CreditCard, Bell, ChevronRight, Palette } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

/**
 * Seller Settings Screen
 */
export default function SellerSettings() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const settingsItems = [
    { icon: Building, label: 'Business Profile', description: 'Update business name, logo, description', route: '/(seller)/settings/business-profile' },
    { icon: Clock, label: 'Operating Hours', description: 'Set your business hours', route: '/(seller)/settings/operating-hours' },
    { icon: MapPin, label: 'Delivery Settings', description: 'Delivery radius, fees, minimum order', route: '/(seller)/settings/delivery-settings' },
    { icon: CreditCard, label: 'Payment Settings', description: 'Bank account, payout schedule', route: '/(seller)/settings/payment-settings' },
    { icon: Palette, label: 'Theme', description: 'Light, dark, or system', route: '/(shared)/profile/theme' },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$6" fontWeight="bold">Settings</Text>

          {/* Store Status */}
          <Card padding="$4" bordered backgroundColor="$background">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="bold" color="$color">Store Status</Text>
                <Text color="$colorMuted" fontSize="$3">
                  {isOpen ? 'Your store is open' : 'Your store is closed'}
                </Text>
              </YStack>
              <Switch
                checked={isOpen}
                onCheckedChange={setIsOpen}
                backgroundColor={isOpen ? '$success' : '$colorDisabled'}
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {/* Notifications */}
          <Card padding="$4" bordered backgroundColor="$background">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="bold" color="$color">Notifications</Text>
                <Text color="$colorMuted" fontSize="$3">
                  Receive order alerts and updates
                </Text>
              </YStack>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                backgroundColor={notificationsEnabled ? '$primary' : '$colorDisabled'}
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {/* Settings Menu */}
          <Card padding="$4" bordered backgroundColor="$background">
            <YStack gap="$1">
              {settingsItems.map((item, index) => (
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
                    <ChevronRight size={16} color="$colorMuted" />
                  </Button>
                  {index < settingsItems.length - 1 && <Separator backgroundColor="$borderColor" />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Danger Zone */}
          <Card padding="$4" bordered borderColor="$error" backgroundColor="$background">
            <YStack gap="$3">
              <Text fontWeight="bold" color="$error">Danger Zone</Text>
              <Button
                backgroundColor="$error"
                color="$background"
                onPress={() => {
                  // Handle close store temporarily
                }}
              >
                Close Store Temporarily
              </Button>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}