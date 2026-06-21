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
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { BackButton, Button, FormInput } from "@/components/ui";
import { validation } from "@/utils/validation";
import { useFleetStore } from "@/stores/fleet.store";
import { Mail, Phone, User, Car } from "@tamagui/lucide-icons";

export default function AddRiderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addRider, vehicles } = useFleetStore();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    vehicleId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const availableVehicles = vehicles.filter(
    (v) => v.isActive && !v.assignedRiderId,
  );

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newRider = {
        id: `rider_${Date.now()}`,
        fleetId: "fleet_001",
        riderId: `user_${Date.now()}`,
        riderName: form.fullName.trim(),
        riderEmail: form.email.trim().toLowerCase(),
        riderPhone: form.phone.trim(),
        vehicleId: form.vehicleId || undefined,
        vehiclePlateNumber: form.vehicleId
          ? vehicles.find((v) => v.id === form.vehicleId)?.plateNumber
          : undefined,
        vehicleType: form.vehicleId
          ? vehicles.find((v) => v.id === form.vehicleId)?.vehicleType
          : undefined,
        status: "inactive",
        totalDeliveries: 0,
        totalEarnings: 0,
        rating: 5.0,
        joinedAt: new Date().toISOString(),
      };

      addRider(newRider);

      // Send invitation email (simulated)
      console.log("Invitation sent to:", form.email);

      if (navigation.canGoBack()) {
        router.back();
      } else {
        router.replace("/(fleet)/riders");
      }
    } catch (err: any) {
      setErrors({
        form: err?.message || "Failed to invite rider. Please try again.",
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
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingBottom={Math.max(insets.bottom + 20, 24)}
        paddingTop={Math.max(insets.top + 8, 24)}
      >
        <XStack
          paddingHorizontal="$4"
          justify={"space-between"}
          mb="$4"
          alignItems="center"
        >
          <BackButton />
        </XStack>

        <ScrollView backgroundColor="$background" padding="$4">
          <YStack
            gap="$4"
            $gtSm={{ padding: "$6", maxWidth: 600 }}
            alignSelf="center"
            width="100%"
          >
            <YStack gap="$2">
              <Text
                fontSize="$8"
                fontWeight="bold"
                fontFamily="$heading"
                color="$color"
                $gtSm={{ fontSize: "$10" }}
              >
                Invite Rider
              </Text>
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Send an invitation to a new rider to join your fleet
              </Text>
            </YStack>

            <Form onSubmit={handleInvite} gap="$4">
              <FormInput
                label="Full Name"
                placeholder="John Doe"
                value={form.fullName}
                onChangeText={(value) => updateField("fullName", value)}
                icon={<User size={20} color="$colorMuted" />}
                error={errors.fullName}
                required
              />

              <FormInput
                label="Email"
                placeholder="rider@example.com"
                value={form.email}
                onChangeText={(value) => updateField("email", value)}
                icon={<Mail size={20} color="$colorMuted" />}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />

              <FormInput
                label="Phone Number"
                placeholder="+233 24 000 0000"
                value={form.phone}
                onChangeText={(value) => updateField("phone", value)}
                icon={<Phone size={20} color="$colorMuted" />}
                error={errors.phone}
                keyboardType="phone-pad"
                required
              />

              <YStack gap="$2">
                <Label
                  htmlFor="vehicleId"
                  fontSize="$4"
                  fontWeight="500"
                  fontFamily="$body"
                  color="$color"
                >
                  Assign Vehicle (Optional)
                </Label>
                <Select
                  value={form.vehicleId}
                  onValueChange={(value) => updateField("vehicleId", value)}
                  disablePreventBodyScroll
                >
                  <Select.Trigger
                    iconAfter={Car}
                    borderRadius="$4"
                    backgroundColor="$background"
                  >
                    <Select.Value placeholder="Select a vehicle" />
                  </Select.Trigger>

                  <Adapt when="maxSm" platform="touch">
                    <Sheet
                      native
                      modal
                      dismissOnSnapToBottom
                      animation="medium"
                    >
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
                          Available Vehicles
                        </Select.Label>
                        {availableVehicles.map((vehicle, i) => (
                          <Select.Item
                            key={vehicle.id}
                            value={vehicle.id}
                            index={i}
                          >
                            <Select.ItemText>
                              {vehicle.plateNumber} - {vehicle.vehicleType}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                        {availableVehicles.length === 0 && (
                          <Select.Item value="none" index={0}>
                            <Select.ItemText>
                              No vehicles available
                            </Select.ItemText>
                          </Select.Item>
                        )}
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
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  You can assign a vehicle later if needed
                </Text>
              </YStack>

              {errors.form ? (
                <Card padding="$3" backgroundColor="$red2" borderColor="$red6">
                  <Text color="$red10" fontSize="$3" fontFamily="$body">
                    {errors.form}
                  </Text>
                </Card>
              ) : null}

              <YStack gap="$3" mt="$4">
                <Button
                  size="$5"
                  variant="primary"
                  width="100%"
                  onPress={handleInvite}
                  disabled={isLoading}
                  opacity={isLoading ? 0.7 : 1}
                >
                  {isLoading ? "Sending Invitation..." : "Send Invitation"}
                </Button>

                <Button
                  variant="outline"
                  width="100%"
                  size="$5"
                  onPress={() =>
                    navigation.canGoBack()
                      ? router.back()
                      : router.replace("/(fleet)/riders")
                  }
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </YStack>
            </Form>
          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
