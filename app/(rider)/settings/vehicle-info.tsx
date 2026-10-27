// @ts-nocheck
import { useState } from "react";
import { YStack, XStack, Text, Card } from "tamagui";
import { Pressable } from "react-native";
import { Save, Check } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { BackButton, Button, FormInput } from "@/components/ui";
import { FormActions, FormScreen } from "@/components/layout";
import {
  useVehicleInfoQuery,
  useCreateVehicleMutation,
} from "@teincfood/core";
import type { RiderVehicleRequest } from "@teincfood/core";
import { extractApiErrorMessage } from "@teincfood/core";
import { toast } from "sonner-native";

const VEHICLE_TYPES: { value: string; label: string }[] = [
  { value: "bicycle", label: "Bicycle" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "car", label: "Car" },
];

export default function VehicleInfo() {
  const router = useRouter();

  const { data: vehicleInfo } = useVehicleInfoQuery();
  const vehicle = vehicleInfo?.data;
  const createVehicle = useCreateVehicleMutation();

  const [vehicleType, setVehicleType] = useState(vehicle?.type || "motorcycle");
  const [plateNumber, setPlateNumber] = useState(vehicle?.plate_number || "");
  const [vehicleColor, setVehicleColor] = useState(vehicle?.color || "");
  const [vehicleBrand, setVehicleBrand] = useState(vehicle?.brand || "");
  const [vehicleModel, setVehicleModel] = useState(vehicle?.model || "");
  const [vehicleYear, setVehicleYear] = useState(
    vehicle?.year ? String(vehicle.year) : "",
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!plateNumber.trim()) newErrors.plateNumber = "Plate number is required";
    if (!vehicleColor.trim()) newErrors.color = "Color is required";
    if (!vehicleBrand.trim()) newErrors.brand = "Brand is required";
    if (!vehicleModel.trim()) newErrors.model = "Model is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const payload: RiderVehicleRequest = {
      type: vehicleType,
      plate_number: plateNumber.trim(),
      brand: vehicleBrand.trim(),
      model: vehicleModel.trim(),
      color: vehicleColor.trim(),
    };

    const parsedYear = parseInt(vehicleYear, 10);
    if (vehicleYear.trim() && !isNaN(parsedYear)) {
      payload.year = parsedYear;
    }

    createVehicle.mutate(payload, {
      onSuccess: () => {
        toast.success("Vehicle information saved");
        router.back();
      },
      onError: (error: unknown) => {
        console.debug("[VehicleInfo] save error", error);

        // Extract field-level validation errors from API response
        const apiError = error as { data?: { error?: { details?: Record<string, string[]> } } };
        const details = apiError?.data?.error?.details;
        if (details && typeof details === "object") {
          const fieldErrors: Record<string, string> = {};
          const fieldMap: Record<string, string> = {
            plate_number: "plateNumber",
            type: "vehicleType",
            brand: "brand",
            model: "model",
            color: "color",
            year: "year",
          };
          for (const [field, messages] of Object.entries(details)) {
            const formField = fieldMap[field] || field;
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[formField] = messages[0];
            }
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
          }
        }

        toast.error(extractApiErrorMessage(error));
      },
    });
  };

  return (
    <FormScreen>
      <XStack
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Vehicle Information
        </Text>
        <Button
          height="$10"
          variant="primary"
          onPress={handleSave}
          disabled={createVehicle.isPending}
        >
          {createVehicle.isPending ? "Saving..." : "Save"}
        </Button>
      </XStack>

        <YStack gap="$4">
          {/* Vehicle Type */}
          <Card padding="$4" bordered>
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold" paddingBottom="$2">
                Vehicle Type
              </Text>
              {VEHICLE_TYPES.map((type) => (
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

              <FormInput
                label="Year"
                placeholder="e.g., 2020"
                value={vehicleYear}
                onChangeText={(v) => {
                  setVehicleYear(v);
                  setErrors((e) => ({ ...e, year: undefined }));
                }}
                keyboardType="number-pad"
                maxLength={4}
                error={errors.year}
              />
            </YStack>
          </Card>

          {/* Save Button */}
          <FormActions marginTop="$2">
            <Button
              size="$5"
              variant="primary"
              icon={<Save size={18} />}
              onPress={handleSave}
              disabled={createVehicle.isPending}
              opacity={createVehicle.isPending ? 0.7 : 1}
            >
              {createVehicle.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </FormActions>
        </YStack>
    </FormScreen>
  );
}
