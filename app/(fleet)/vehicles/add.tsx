// @ts-nocheck
import { useState } from "react";
import { KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
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
import { useAddVehicleMutation, useFleetRidersQuery } from "@/hooks/useFleet";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@/utils/error";
import {
  Car,
  Hash,
  Palette,
  Calendar,
  User,
  ChevronDown,
  Check,
} from "@tamagui/lucide-icons";

export default function AddVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addVehicleMutation = useAddVehicleMutation();
  const { data: ridersRes } = useFleetRidersQuery();
  const riders = ridersRes?.data ?? [];

  const [form, setForm] = useState({
    type: "",
    plate_number: "",
    model: "",
    brand: "",
    color: "",
    year: "",
    rider_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [riderPickerOpen, setRiderPickerOpen] = useState(false);

  const selectedRider = riders.find((r) => r.id === form.rider_id);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.type) newErrors.type = "Vehicle type is required";
    if (!form.plate_number.trim()) newErrors.plate_number = "Plate number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVehicle = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        type: form.type,
        plate_number: form.plate_number.trim().toUpperCase(),
      };
      if (form.brand.trim()) payload.brand = form.brand.trim();
      if (form.model.trim()) payload.model = form.model.trim();
      if (form.color.trim()) payload.color = form.color.trim();
      if (form.year) payload.year = parseInt(form.year, 10);
      if (form.rider_id) payload.rider_id = form.rider_id;

      await addVehicleMutation.mutateAsync(payload);
      toast.success("Vehicle added successfully");
      router.back();
    } catch (e: any) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingTop={Math.max(insets.top + 8, 24)}
      >
        <XStack mb="$4" paddingHorizontal="$4" justifyContent="space-between" alignItems="center">
          <BackButton />
          <Button
            variant="primary"
            height="$10"
            $lg={{ height: "$10" }}
            paddingHorizontal="$4"
            onPress={handleAddVehicle}
            loading={isLoading}
          >
            Save
          </Button>
        </XStack>
        <ScrollView
          backgroundColor="$background"
          paddingBottom={Math.max(insets.bottom + 24, 24)}
        >
          <YStack
            padding="$4"
            gap="$4"
            $gtSm={{ padding: "$6", maxWidth: 600 }}
            alignSelf="center"
            width="100%"
          >
            <YStack gap="$2">
              <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color" $gtSm={{ fontSize: "$10" }}>
                Add Vehicle
              </Text>
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Add a new vehicle to your fleet
              </Text>
            </YStack>

            <Form onSubmit={handleAddVehicle} gap="$4">
              <YStack gap="$2">
                <Label htmlFor="type" fontSize="$4" fontWeight="500" fontFamily="$body" color="$color">
                  Vehicle Type *
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => updateField("type", value)}
                  disablePreventBodyScroll
                >
                  <Select.Trigger
                    iconAfter={Car}
                    borderRadius="$4"
                    backgroundColor="$background"
                    borderColor={errors.type ? "$error" : "$borderColor"}
                    focusStyle={{ borderColor: errors.type ? "$error" : "$primary" }}
                  >
                    <Select.Value placeholder="Select vehicle type" />
                  </Select.Trigger>

                  <Adapt platform="touch">
                    <Sheet native modal dismissOnSnapToBottom animation="medium">
                      <Sheet.Frame>
                        <Sheet.ScrollView>
                          <Adapt.Contents />
                        </Sheet.ScrollView>
                      </Sheet.Frame>
                      <Sheet.Overlay bg="$shadowColor" animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                    </Sheet>
                  </Adapt>

                  <Select.Content style={{ display: 'none' }}>
                    <Select.Viewport bg="$background">
                      <Select.Group>
                        {[
                          { value: 'motorcycle', label: 'Motorcycle' },
                          { value: 'car', label: 'Car' },
                          { value: 'bicycle', label: 'Bicycle' },
                        ].map((item, i) => (
                          <Select.Item key={item.value} index={i} value={item.value}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Group>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
                {errors.type && (
                  <Text fontSize="$2" color="$red10" fontFamily="$body">{errors.type}</Text>
                )}
              </YStack>

              <FormInput
                label="Plate Number"
                placeholder="GR-1234-20"
                value={form.plate_number}
                onChangeText={(value) => updateField("plate_number", value)}
                icon={<Hash size={20} color="$colorMuted" />}
                error={errors.plate_number}
                autoCapitalize="characters"
                required
              />

              <YStack gap="$2">
                <Label fontSize="$4" fontWeight="500" fontFamily="$body" color="$color">
                  Assign Rider (optional)
                </Label>
                <TouchableOpacity
                  onPress={() => setRiderPickerOpen(true)}
                  style={{
                    height: 48,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: "#f3f4f6",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <XStack gap="$2" alignItems="center" flex={1}>
                    <User size={20} color="$colorMuted" />
                    <Text fontFamily="$body" fontSize="$3" color={selectedRider ? "$color" : "$colorMuted"}>
                      {selectedRider ? selectedRider.user?.full_name || selectedRider.rider_number : "Select a rider"}
                    </Text>
                  </XStack>
                  <ChevronDown size={16} color="$colorMuted" />
                </TouchableOpacity>
                {form.rider_id && (
                  <TouchableOpacity onPress={() => updateField("rider_id", "")}>
                    <Text fontSize="$2" color="$red10" fontFamily="$body">Clear selection</Text>
                  </TouchableOpacity>
                )}
              </YStack>

              <YStack gap="$2">
                <Label fontSize="$4" fontWeight="500" fontFamily="$body" color="$color">
                  Brand
                </Label>
                <XStack position="relative" alignItems="center">
                  <TamaguiInput
                    flex={1}
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
                <Label fontSize="$4" fontWeight="500" fontFamily="$body" color="$color">
                  Model
                </Label>
                <XStack position="relative" alignItems="center">
                  <TamaguiInput
                    flex={1}
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
                  <Label fontSize="$4" fontWeight="500" fontFamily="$body" color="$color">
                    Color
                  </Label>
                  <XStack position="relative" alignItems="center">
                    <TamaguiInput
                      flex={1}
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
                  <Label fontSize="$4" fontWeight="500" fontFamily="$body" color="$color">
                    Year
                  </Label>
                  <XStack position="relative" alignItems="center">
                    <TamaguiInput
                      flex={1}
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
                  <Text color="$red10" fontSize="$3" fontFamily="$body">{errors.form}</Text>
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
                <Button variant="outline" width="100%" onPress={() => router.back()} disabled={isLoading}>
                  Cancel
                </Button>
              </YStack>
            </Form>
          </YStack>
        </ScrollView>
      </YStack>

      {/* Rider picker sheet */}
      <Sheet
        modal
        open={riderPickerOpen}
        onOpenChange={setRiderPickerOpen}
        snapPoints={[50]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack px="$5" pt="$3" pb="$4" gap="$2">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading">Select Rider</Text>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Choose a rider to assign this vehicle to</Text>
          </YStack>
          <ScrollView px="$5" pb="$6">
            {riders.length === 0 ? (
              <Text fontSize="$3" color="$colorMuted" fontFamily="$body" textAlign="center" py="$4">
                No riders available
              </Text>
            ) : (
              riders.map((rider) => (
                <TouchableOpacity
                  key={rider.id}
                  onPress={() => {
                    updateField("rider_id", rider.id);
                    setRiderPickerOpen(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <XStack gap="$3" alignItems="center" flex={1}>
                    <User size={20} color="$colorMuted" />
                    <YStack flex={1}>
                      <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">
                        {rider.user?.full_name || rider.rider_number}
                      </Text>
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                        {rider.rider_number} · {rider.status}
                      </Text>
                    </YStack>
                  </XStack>
                  {form.rider_id === rider.id && <Check size={18} color="$primary" />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
