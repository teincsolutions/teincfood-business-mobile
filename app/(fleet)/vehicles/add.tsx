// @ts-nocheck
import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Select,
  Adapt,
  Sheet,
  Form,
  Label,
  ScrollView,
  Input as TamaguiInput,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BackButton, Button, FormInput } from "@/components/ui";

import { useFleetStore } from "@/stores/fleet.store";
import { Car, Hash, Palette, Calendar, Save } from "@tamagui/lucide-icons";

export default function AddVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addVehicle } = useFleetStore();

  const [form, setForm] = useState({
    vehicleType: "",
    plateNumber: "",
    model: "",
    brand: "",
    color: "",
    year: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.vehicleType) {
      newErrors.vehicleType = "Vehicle type is required";
    }

    if (!form.plateNumber.trim()) {
      newErrors.plateNumber = "Plate number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVehicle = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newVehicle = {
        id: `vehicle_${Date.now()}`,
        fleetId: "fleet_001",
        vehicleType: form.vehicleType as any,
        plateNumber: form.plateNumber.trim().toUpperCase(),
        model: form.model.trim() || undefined,
        brand: form.brand.trim() || undefined,
        color: form.color.trim() || undefined,
        year: form.year ? parseInt(form.year) : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addVehicle(newVehicle);

      router.back();
    } catch (err: any) {
      setErrors({
        form: err?.message || "Failed to add vehicle. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        flex={1}
        paddingTop={Math.max(insets.top + 8, 24)}
        paddingBottom={Math.max(insets.bottom + 20, 24)}
        backgroundColor="$background"
      >
        <YStack
          padding="$4"
          gap="$4"
          $gtSm={{ padding: "$6", maxWidth: 600 }}
          alignSelf="center"
          width="100%"
        >
          <XStack mb="$4" justifyContent="space-between" alignItems="center">
            <BackButton />
            <Button
              variant="primary"
              height="$10"
              $lg={{ height: "$10" }}
              paddingHorizontal="$4"
              onPress={handleAddVehicle}
              loading={isLoading}
              icon={<Save size={18} color="white" />}
            >
              Save
            </Button>
          </XStack>

          <YStack gap="$2">
            <Text
              fontSize="$8"
              fontWeight="bold"
              fontFamily="$heading"
              color="$color"
              $gtSm={{ fontSize: "$10" }}
            >
              Add Vehicle
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Add a new vehicle to your fleet
            </Text>
          </YStack>

          <Form onSubmit={handleAddVehicle} gap="$4">
            <YStack gap="$2">
              <Label
                htmlFor="vehicleType"
                fontSize="$4"
                fontWeight="500"
                fontFamily="$body"
                color="$color"
              >
                Vehicle Type *
              </Label>
              <Select
                value={form.vehicleType}
                onValueChange={(value) => updateField("vehicleType", value)}
                disablePreventBodyScroll
              >
                <Select.Trigger
                  iconAfter={Car}
                  borderRadius="$4"
                  backgroundColor="$background"
                  borderColor={errors.vehicleType ? "$red8" : "$borderColor"}
                  focusStyle={{
                    borderColor: errors.vehicleType ? "$red8" : "$primary",
                  }}
                >
                  <Select.Value placeholder="Select vehicle type" />
                </Select.Trigger>

                <Adapt when="maxSm" platform="touch">
                  <Sheet native modal dismissOnSnapToBottom animation="medium">
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay
                      bg="$shadowColor"
                      animation="lazy"
                      enterStyle={{ opacity: 0 }}
                      exitStyle={{ opacity: 0 }}
                    />
                  </Sheet>
                </Adapt>

                <Select.Content>
                  <Select.ScrollUpButton
                    items="center"
                    justify="center"
                    position="relative"
                    width="100%"
                    height="$3"
                  >
                    <Car size={20} />
                  </Select.ScrollUpButton>

                  <Select.Viewport
                    minW={200}
                    bg="$background"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Select.Group>
                      <Select.Label fontWeight="700">
                        Vehicle Types
                      </Select.Label>
                      <Select.Item index={0} value="motorcycle">
                        <Select.ItemText>Motorcycle</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="car">
                        <Select.ItemText>Car</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="van">
                        <Select.ItemText>Van</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={3} value="bicycle">
                        <Select.ItemText>Bicycle</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={4} value="truck">
                        <Select.ItemText>Truck</Select.ItemText>
                      </Select.Item>
                    </Select.Group>
                  </Select.Viewport>

                  <Select.ScrollDownButton
                    items="center"
                    justify="center"
                    position="relative"
                    width="100%"
                    height="$3"
                  >
                    <Car size={20} />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select>
              {errors.vehicleType && (
                <Text fontSize="$2" color="$red10" fontFamily="$body">
                  {errors.vehicleType}
                </Text>
              )}
            </YStack>

            <FormInput
              label="Plate Number"
              placeholder="GR-1234-20"
              value={form.plateNumber}
              onChangeText={(value) => updateField("plateNumber", value)}
              icon={<Hash size={20} color="$colorMuted" />}
              error={errors.plateNumber}
              autoCapitalize="characters"
              required
            />

            <YStack gap="$2">
              <Label
                htmlFor="brand"
                fontSize="$4"
                fontWeight="500"
                fontFamily="$body"
                color="$color"
              >
                Brand
              </Label>
              <XStack position="relative" alignItems="center">
                <TamaguiInput
                  flex={1}
                  id="brand"
                  placeholder="Toyota, Honda, Yamaha..."
                  value={form.brand}
                  onChangeText={(value) => updateField("brand", value)}
                  paddingLeft="$10"
                />
                <YStack position="absolute" left="$3">
                  <Car size={20} color="$colorMuted" />
                </YStack>
              </XStack>
            </YStack>

            <YStack gap="$2">
              <Label
                htmlFor="model"
                fontSize="$4"
                fontWeight="500"
                fontFamily="$body"
                color="$color"
              >
                Model
              </Label>
              <XStack position="relative" alignItems="center">
                <TamaguiInput
                  flex={1}
                  id="model"
                  placeholder="Corolla, Civic, FZ..."
                  value={form.model}
                  onChangeText={(value) => updateField("model", value)}
                  paddingLeft="$10"
                />
                <YStack position="absolute" left="$3">
                  <Car size={20} color="$colorMuted" />
                </YStack>
              </XStack>
            </YStack>

            <XStack gap="$3" $gtSm={{ gap: "$4" }}>
              <YStack flex={1} gap="$2">
                <Label
                  htmlFor="color"
                  fontSize="$4"
                  fontWeight="500"
                  fontFamily="$body"
                  color="$color"
                >
                  Color
                </Label>
                <XStack position="relative" alignItems="center">
                  <TamaguiInput
                    flex={1}
                    id="color"
                    placeholder="Red, Blue, Black..."
                    value={form.color}
                    onChangeText={(value) => updateField("color", value)}
                    paddingLeft="$10"
                  />
                  <YStack position="absolute" left="$3">
                    <Palette size={20} color="$colorMuted" />
                  </YStack>
                </XStack>
              </YStack>
              <YStack flex={1} gap="$2">
                <Label
                  htmlFor="year"
                  fontSize="$4"
                  fontWeight="500"
                  fontFamily="$body"
                  color="$color"
                >
                  Year
                </Label>
                <XStack position="relative" alignItems="center">
                  <TamaguiInput
                    flex={1}
                    id="year"
                    placeholder="2024"
                    value={form.year}
                    onChangeText={(value) => updateField("year", value)}
                    keyboardType="numeric"
                    paddingLeft="$10"
                  />
                  <YStack position="absolute" left="$3">
                    <Calendar size={20} color="$colorMuted" />
                  </YStack>
                </XStack>
              </YStack>
            </XStack>

            {errors.form ? (
              <Card padding="$3" backgroundColor="$red2" borderColor="$red6">
                <Text color="$red10" fontSize="$3" fontFamily="$body">
                  {errors.form}
                </Text>
              </Card>
            ) : null}

            <YStack gap="$3" mt="$4">
              <Button
                variant="primary"
                width="100%"
                onPress={handleAddVehicle}
                disabled={isLoading}
                opacity={isLoading ? 0.7 : 1}
              >
                {isLoading ? "Adding Vehicle..." : "Add Vehicle"}
              </Button>

              <Button
                variant="outline"
                width="100%"
                onPress={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </YStack>
          </Form>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
