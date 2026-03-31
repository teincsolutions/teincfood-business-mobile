// @ts-nocheck
import { useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Button, Separator, Input, Select } from 'tamagui';
import { Truck, Save, ChevronDown, Check } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Rider Vehicle Information Screen
 */
export default function VehicleInfo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  // Mock current vehicle data
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [plateNumber, setPlateNumber] = useState('GR-1234-20');
  const [vehicleColor, setVehicleColor] = useState('Black');
  const [vehicleBrand, setVehicleBrand] = useState('Honda');
  const [vehicleModel, setVehicleModel] = useState('CBR 150');

  const vehicleTypes = [
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'bicycle', label: 'Bicycle' },
    { value: 'scooter', label: 'Scooter' },
    { value: 'car', label: 'Car' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 1500);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text fontSize="$4" color="$primary">← Back</Text>
        </TouchableOpacity>
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Vehicle Information
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text fontSize="$4" color="$primary" fontWeight="bold">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Current Vehicle Card */}
          <Card padding="$4" bordered>
            <YStack gap="$3" alignItems="center">
              <YStack
                width={80}
                height={80}
                borderRadius="$10"
                backgroundColor="$gray3"
                alignItems="center"
                justifyContent="center"
              >
                <Truck size={40} color="$colorMuted" />
              </YStack>
              <Text fontSize="$5" fontWeight="bold">Current Vehicle</Text>
              <Text color="$colorMuted" fontSize="$3">
                Update your vehicle details below
              </Text>
            </YStack>
          </Card>

          {/* Vehicle Type */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Vehicle Type</Text>
              <Separator />
              <YStack gap="$2">
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setVehicleType(type.value)}
                  >
                    <XStack
                      padding="$3"
                      borderRadius="$4"
                      backgroundColor={vehicleType === type.value ? '$primary' : '$gray2'}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text
                        color={vehicleType === type.value ? 'white' : '$color'}
                        fontWeight={vehicleType === type.value ? 'bold' : 'normal'}
                      >
                        {type.label}
                      </Text>
                      {vehicleType === type.value && (
                        <Check size={20} color="white" />
                      )}
                    </XStack>
                  </TouchableOpacity>
                ))}
              </YStack>
            </YStack>
          </Card>

          {/* Plate Number */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Plate Number</Text>
              <Separator />
              <Input
                size="$4"
                placeholder="e.g., GR-1234-20"
                value={plateNumber}
                onChangeText={setPlateNumber}
                autoCapitalize="characters"
              />
              <Text fontSize="$2" color="$colorMuted">
                Enter your vehicle's registration plate number
              </Text>
            </YStack>
          </Card>

          {/* Vehicle Details */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Vehicle Details</Text>
              <Separator />

              <YStack gap="$2">
                <Text fontWeight="bold">Color</Text>
                <Input
                  size="$4"
                  placeholder="e.g., Black, Red, Blue"
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                />
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="bold">Brand</Text>
                <Input
                  size="$4"
                  placeholder="e.g., Honda, Yamaha, Toyota"
                  value={vehicleBrand}
                  onChangeText={setVehicleBrand}
                />
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="bold">Model</Text>
                <Input
                  size="$4"
                  placeholder="e.g., CBR 150, Corolla"
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                />
              </YStack>
            </YStack>
          </Card>

          {/* Verification Status */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Verification Status</Text>
              <Separator />
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$colorMuted">Vehicle Verified</Text>
                <YStack
                  backgroundColor="$yellow10"
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius="$10"
                >
                  <Text color="white" fontSize="$2" fontWeight="bold">Pending</Text>
                </YStack>
              </XStack>
              <Text fontSize="$3" color="$colorMuted">
                Your vehicle information is pending verification by our team.
              </Text>
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            size="$5"
            backgroundColor="$primary"
            icon={<Save size={18} />}
            onPress={handleSave}
            disabled={isSaving}
            opacity={isSaving ? 0.7 : 1}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}