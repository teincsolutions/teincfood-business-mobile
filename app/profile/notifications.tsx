// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Switch } from 'react-native';
import { YStack, XStack, Text, Separator } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Mail, Smartphone } from '@tamagui/lucide-icons';
import { BackButton } from '@/components/ui';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  
  const [preferences, setPreferences] = useState({
    pushOrders: true,
    pushPromos: false,
    emailAlerts: true,
  });

  const toggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      
      {/* Header */}
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Notifications
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
          <YStack padding="$5" gap="$6">
            
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
                Push Notifications
              </Text>

              <YStack backgroundColor="$backgroundStrong" borderRadius="$5" overflow="hidden">
                <XStack alignItems="center" padding="$4" justifyContent="space-between" gap="$4">
                  <XStack gap="$3" alignItems="center" flex={1}>
                    <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                      <ShoppingBag size={20} color="$primary" />
                    </YStack>
                    <YStack gap="$1" flex={1}>
                      <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Order Updates</Text>
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Track order delivery status real-time</Text>
                    </YStack>
                  </XStack>
                  <Switch value={preferences.pushOrders} onValueChange={() => toggle('pushOrders')} trackColor={{ true: '#FF9633' }} />
                </XStack>

                <Separator borderColor="$borderColor" />

                <XStack alignItems="center" padding="$4" justifyContent="space-between" gap="$4">
                  <XStack gap="$3" alignItems="center" flex={1}>
                    <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                      <Smartphone size={20} color="$primary" />
                    </YStack>
                    <YStack gap="$1" flex={1}>
                      <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Promotional Alerts</Text>
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Get special offers and discounts</Text>
                    </YStack>
                  </XStack>
                  <Switch value={preferences.pushPromos} onValueChange={() => toggle('pushPromos')} trackColor={{ true: '#FF9633' }} />
                </XStack>
              </YStack>

            </YStack>

            <YStack gap="$2" marginTop="$2">
              <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
                Email
              </Text>

              <YStack backgroundColor="$backgroundStrong" borderRadius="$5" overflow="hidden">
                <XStack alignItems="center" padding="$4" justifyContent="space-between" gap="$4">
                  <XStack gap="$3" alignItems="center" flex={1}>
                    <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                      <Mail size={20} color="$primary" />
                    </YStack>
                    <YStack gap="$1" flex={1}>
                      <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Weekly Newsletter</Text>
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Chef features and top recipes</Text>
                    </YStack>
                  </XStack>
                  <Switch value={preferences.emailAlerts} onValueChange={() => toggle('emailAlerts')} trackColor={{ true: '#FF9633' }} />
                </XStack>
              </YStack>

            </YStack>

          </YStack>
      </ScrollView>
    </YStack>
  );
}
