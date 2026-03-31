// @ts-nocheck
import { YStack, Text, Card, XStack, Separator, Switch } from 'tamagui';
import { Building, Clock, MapPin, CreditCard, Palette, ChevronRight } from '@tamagui/lucide-icons';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { AppAlertDialog } from '@/components/ui/AlertDialog';

/**
 * Seller Settings Screen
 */
export default function SellerSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const settingsItems = [
    { icon: Building, label: 'Business Profile', description: 'Update business name, logo, description', route: '/(seller)/settings/business-profile' },
    { icon: Clock, label: 'Operating Hours', description: 'Set your business hours', route: '/(seller)/settings/operating-hours' },
    { icon: MapPin, label: 'Delivery Settings', description: 'Delivery radius, fees, minimum order', route: '/(seller)/settings/delivery-settings' },
    { icon: CreditCard, label: 'Payment Settings', description: 'Bank account, payout schedule', route: '/(seller)/settings/payment-settings' },
    { icon: Palette, label: 'Theme', description: 'Light, dark, or system', route: '/(shared)/profile/theme' },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack
          paddingHorizontal="$4"
          paddingBottom={insets.bottom + 24}
          gap="$4"
        >
          {/* Store Status */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center" gap="$3">
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="700" fontFamily="$body" color="$color">
                  Store Status
                </Text>
                <Text color="$colorSecondary" fontSize="$3" fontFamily="$body">
                  {isOpen ? 'Your store is open and accepting orders' : 'Your store is closed'}
                </Text>
              </YStack>
              <Switch
                size="$3"
                checked={isOpen}
                onCheckedChange={setIsOpen}
                backgroundColor={isOpen ? '#27ae60' : '$gray8'}
              >
                <Switch.Thumb animation="quick" backgroundColor="white" />
              </Switch>
            </XStack>
          </Card>

          {/* Notifications */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center" gap="$3">
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="700" fontFamily="$body" color="$color">
                  Order Notifications
                </Text>
                <Text color="$colorSecondary" fontSize="$3" fontFamily="$body">
                  Receive alerts for new orders and updates
                </Text>
              </YStack>
              <Switch
                size="$3"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                backgroundColor={notificationsEnabled ? '$primary' : '$gray8'}
              >
                <Switch.Thumb animation="quick" backgroundColor="white" />
              </Switch>
            </XStack>
          </Card>

          {/* Settings Menu */}
          <Card padding="$2" bordered>
            {settingsItems.map((item, index) => (
              <YStack key={item.route}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(item.route)}
                  style={{ paddingHorizontal: 12, paddingVertical: 14 }}
                >
                  <XStack alignItems="center" gap="$3">
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={10}
                      backgroundColor="$backgroundSoft"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <item.icon size={20} color="$colorSecondary" />
                    </YStack>
                    <YStack flex={1}>
                      <Text fontSize="$4" fontWeight="700" fontFamily="$body" color="$color">
                        {item.label}
                      </Text>
                      <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                        {item.description}
                      </Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorSecondary" />
                  </XStack>
                </TouchableOpacity>
                {index < settingsItems.length - 1 && (
                  <Separator marginHorizontal="$3" />
                )}
              </YStack>
            ))}
          </Card>

          {/* Danger Zone */}
          <Card padding="$4" bordered borderColor="#fca5a5">
            <YStack gap="$3">
              <Text fontSize="$3" fontWeight="700" fontFamily="$body" color="#ef4444"
                textTransform="uppercase" letterSpacing={0.5}>
                Danger Zone
              </Text>
              <Button
                variant="outline"
                height={48}
                onPress={() => setShowCloseDialog(true)}
              >
                <Text fontFamily="$body" fontWeight="700" color="#ef4444">
                  Close Store Temporarily
                </Text>
              </Button>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>

      <AppAlertDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        title="Close Store"
        description="This will temporarily close your store and stop accepting new orders. You can reopen at any time."
        confirmText="CLOSE STORE"
        isDestructive
        onConfirm={() => {
          setIsOpen(false);
          setShowCloseDialog(false);
        }}
      />
    </YStack>
  );
}