// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button as TamaguiButton,
  Switch,
  Separator,
  Slider,
} from 'tamagui';
import { ArrowLeft, Save, MapPin, Truck, DollarSign } from '@tamagui/lucide-icons';
import { Button, Input } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Delivery Settings Screen
 */
export default function DeliverySettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [deliveryRadius, setDeliveryRadius] = useState(5);
  const [deliveryFee, setDeliveryFee] = useState('5.00');
  const [minimumOrder, setMinimumOrder] = useState('20.00');
  const [freeDeliveryMinimum, setFreeDeliveryMinimum] = useState('50.00');
  const [estimatedTime, setEstimatedTime] = useState('30-45');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Delivery settings updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update delivery settings');
    } finally {
      setIsSaving(false);
    }
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
          <TamaguiButton
            width={40}
            height={40}
            circular
            backgroundColor="$backgroundSoft"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Delivery Settings</Text>
        </XStack>
        <TamaguiButton
          height={44}
          paddingHorizontal="$4"
          backgroundColor="$primary"
          borderRadius="$3"
          onPress={handleSave}
          disabled={isSaving}
          icon={<Save size={18} color="white" />}
        >
          <Text color="white" fontWeight="bold">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TamaguiButton>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Delivery Toggle */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="bold">Enable Delivery</Text>
                <Text color="$colorMuted" fontSize="$3">
                  Allow customers to order for delivery
                </Text>
              </YStack>
              <Switch
                checked={deliveryEnabled}
                onCheckedChange={setDeliveryEnabled}
                backgroundColor={deliveryEnabled ? '$green10' : '$gray8'}
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {deliveryEnabled && (
            <>
              {/* Delivery Radius */}
              <Card padding="$4" bordered>
                <YStack gap="$4">
                  <XStack gap="$3" alignItems="center">
                    <MapPin size={20} color="$primary" />
                    <YStack flex={1}>
                      <Text fontWeight="bold">Delivery Radius</Text>
                      <Text color="$colorMuted" fontSize="$3">
                        Maximum distance for delivery (km)
                      </Text>
                    </YStack>
                    <Text fontWeight="bold" fontSize="$5">
                      {deliveryRadius} km
                    </Text>
                  </XStack>
                  <Slider
                    value={[deliveryRadius]}
                    onValueChange={(values) => setDeliveryRadius(values[0])}
                    min={1}
                    max={20}
                    step={1}
                  >
                    <Slider.Track backgroundColor="$gray4">
                      <Slider.TrackActive backgroundColor="$primary" />
                    </Slider.Track>
                    <Slider.Thumb
                      circular
                      size="$3"
                      backgroundColor="$primary"
                      index={0}
                    />
                  </Slider>
                </YStack>
              </Card>

              {/* Delivery Fee */}
              <Card padding="$4" bordered>
                <YStack gap="$3">
                  <XStack gap="$3" alignItems="center">
                    <Truck size={20} color="$primary" />
                    <YStack flex={1}>
                      <Text fontWeight="bold">Delivery Fee</Text>
                      <Text color="$colorMuted" fontSize="$3">
                        Charge per delivery
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack gap="$2" alignItems="center">
                    <Text>GHS</Text>
                    <Input
                      flex={1}
                      placeholder="0.00"
                      value={deliveryFee}
                      onChangeText={setDeliveryFee}
                      keyboardType="decimal-pad"
                    />
                  </XStack>
                </YStack>
              </Card>

              {/* Minimum Order */}
              <Card padding="$4" bordered>
                <YStack gap="$3">
                  <XStack gap="$3" alignItems="center">
                    <DollarSign size={20} color="$primary" />
                    <YStack flex={1}>
                      <Text fontWeight="bold">Minimum Order</Text>
                      <Text color="$colorMuted" fontSize="$3">
                        Minimum order amount for delivery
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack gap="$2" alignItems="center">
                    <Text>GHS</Text>
                    <Input
                      flex={1}
                      placeholder="0.00"
                      value={minimumOrder}
                      onChangeText={setMinimumOrder}
                      keyboardType="decimal-pad"
                    />
                  </XStack>
                </YStack>
              </Card>

              {/* Free Delivery Minimum */}
              <Card padding="$4" bordered>
                <YStack gap="$3">
                  <XStack gap="$3" alignItems="center">
                    <DollarSign size={20} color="$green10" />
                    <YStack flex={1}>
                      <Text fontWeight="bold">Free Delivery Minimum</Text>
                      <Text color="$colorMuted" fontSize="$3">
                        Order amount for free delivery (0 to disable)
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack gap="$2" alignItems="center">
                    <Text>GHS</Text>
                    <Input
                      flex={1}
                      placeholder="0.00"
                      value={freeDeliveryMinimum}
                      onChangeText={setFreeDeliveryMinimum}
                      keyboardType="decimal-pad"
                    />
                  </XStack>
                </YStack>
              </Card>

              {/* Estimated Time */}
              <Card padding="$4" bordered>
                <YStack gap="$3">
                  <Text fontWeight="bold">Estimated Delivery Time</Text>
                  <Text color="$colorMuted" fontSize="$3">
                    Display time range for customers
                  </Text>
                  <Input
                    placeholder="30-45"
                    value={estimatedTime}
                    onChangeText={setEstimatedTime}
                  />
                  <Text fontSize="$2" color="$colorMuted">
                    Format: min-max (e.g., 30-45 minutes)
                  </Text>
                </YStack>
              </Card>
            </>
          )}

          {/* Save Button */}
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text color="white" fontWeight="bold">
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}