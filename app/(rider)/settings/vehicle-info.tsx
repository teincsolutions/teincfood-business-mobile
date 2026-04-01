// @ts-nocheck
import { useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { YStack, XStack, Text, Card, Separator } from "tamagui";
import { Save, Check, ArrowLeft } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, FormInput } from "@/components/ui";

/**
 * Rider Vehicle Information Screen
 */
export default function VehicleInfo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  const [vehicleType, setVehicleType] = useState("motorcycle");
  const [plateNumber, setPlateNumber] = useState("GR-1234-20");
  const [vehicleColor, setVehicleColor] = useState("Black");
  const [vehicleBrand, setVehicleBrand] = useState("Honda");
  const [vehicleModel, setVehicleModel] = useState("CBR 150");

  const [errors, setErrors] = useState<{
    plateNumber?: string;
    color?: string;
    brand?: string;
    model?: string;
  }>({});

  const vehicleTypes = [
    { value: "motorcycle", label: "Motorcycle" },
    { value: "bicycle", label: "Bicycle" },
    { value: "scooter", label: "Scooter" },
    { value: "car", label: "Car" },
  ];

  const handleSave = () => {
    const newErrors: typeof errors = {};

    if (!plateNumber.trim()) newErrors.plateNumber = "Plate number is required";
    if (!vehicleColor.trim()) newErrors.color = "Color is required";
    if (!vehicleBrand.trim()) newErrors.brand = "Brand is required";
    if (!vehicleModel.trim()) newErrors.model = "Model is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
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
        <Button
          variant="outline"
          width={44}
          height={44}
          borderRadius={22}
          paddingHorizontal={0}
          onPress={() => router.back()}
          icon={<ArrowLeft size={20} />}
        />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Vehicle Information
        </Text>
        <Pressable onPress={handleSave} disabled={isSaving}>
          <Text fontSize="$4" color="$primary" fontWeight="bold">
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Vehicle Type */}
          <Card padding="$4" bordered>
            <YStack gap="$2">
              {vehicleTypes.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setVehicleType(type.value)}
                >
                  <XStack
                    padding="$3"
                    borderRadius="$10"
                    backgroundColor={
                      vehicleType === type.value ? "$primary" : "transparent"
                    }
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text
                      color={vehicleType === type.value ? "white" : "$color"}
                      fontWeight={
                        vehicleType === type.value ? "bold" : "normal"
                      }
                    >
                      {type.label}
                    </Text>
                    {vehicleType === type.value && (
                      <Check size={20} color="white" />
                    )}
                  </XStack>
                </Pressable>
              ))}
            </YStack>
          </Card>

          {/* Plate Number */}
          <Card padding="$4" bordered>
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Plate Number
              </Text>
              <FormInput
                placeholder="e.g., GR-1234-20"
                value={plateNumber}
                onChangeText={(v) => {
                  setPlateNumber(v);
                  setErrors((e) => ({ ...e, plateNumber: undefined }));
                }}
                autoCapitalize="characters"
                error={errors.plateNumber}
              />
              <Text fontSize="$2" color="$colorMuted">
                Enter your vehicle's registration plate number
              </Text>
            </YStack>
          </Card>

          {/* Vehicle Details */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontSize="$5" fontWeight="bold">
                Vehicle Details
              </Text>

              <FormInput
                label="Color"
                placeholder="e.g., Black, Red, Blue"
                value={vehicleColor}
                onChangeText={(v) => {
                  setVehicleColor(v);
                  setErrors((e) => ({ ...e, color: undefined }));
                }}
                error={errors.color}
              />

              <FormInput
                label="Brand"
                placeholder="e.g., Honda, Yamaha, Toyota"
                value={vehicleBrand}
                onChangeText={(v) => {
                  setVehicleBrand(v);
                  setErrors((e) => ({ ...e, brand: undefined }));
                }}
                error={errors.brand}
              />

              <FormInput
                label="Model"
                placeholder="e.g., CBR 150, Corolla"
                value={vehicleModel}
                onChangeText={(v) => {
                  setVehicleModel(v);
                  setErrors((e) => ({ ...e, model: undefined }));
                }}
                error={errors.model}
              />
            </YStack>
          </Card>

          {/* Verification Status */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Verification Status
              </Text>
              <Separator />
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$colorMuted">Vehicle Verified</Text>
                <YStack
                  backgroundColor="$yellow10"
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius="$10"
                >
                  <Text color="white" fontSize="$2" fontWeight="bold">
                    Pending
                  </Text>
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
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
