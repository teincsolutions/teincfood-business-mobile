// @ts-nocheck
import { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
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
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { FormInput, Button, BackButton } from "@/components/ui";

import { useBusinessStore } from "@/stores/business.store";
import { Building, MapPin, Phone, Mail, Hash } from "@tamagui/lucide-icons";

export default function AddBusinessScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addBusiness } = useBusinessStore();

  const [form, setForm] = useState({
    name: "",
    type: "",
    address: "",
    city: "",
    phone: "",
    email: "",
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

    if (!form.name.trim()) {
      newErrors.name = "Business name is required";
    }

    if (!form.type) {
      newErrors.type = "Business type is required";
    }

    if (!form.address.trim()) {
      newErrors.address = "Business address is required";
    }

    if (!form.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateBusinessCode = (name: string, city: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const cityCode = city.substring(0, 3).toUpperCase();
    const seq = Math.floor(Math.random() * 900) + 100;
    return `${prefix}-${cityCode}-${seq}`;
  };

  const handleAddBusiness = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const businessCode = generateBusinessCode(form.name, form.city);

      const newBusiness = {
        id: `business_${Date.now()}`,
        code: businessCode,
        ownerId: "user_001",
        name: form.name.trim(),
        type: form.type as any,
        address: {
          street: form.address.trim(),
          city: form.city.trim(),
          region: form.city.trim(),
          country: "Ghana",
          latitude: 0,
          longitude: 0,
          fullAddress: `${form.address.trim()}, ${form.city.trim()}`,
        },
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        status: "active" as const,
        isDefault: false,
        rating: 5.0,
        reviewCount: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addBusiness(newBusiness as any);

      // Navigate to the new business's detail page so the seller can
      // add a logo, edit details, and upload operational documents immediately
      router.replace(`/(seller)/businesses/${newBusiness.id}`);
    } catch (err: any) {
      setErrors({
        form: err?.message || "Failed to add business. Please try again.",
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
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
      >
        <YStack
          padding="$4"
          paddingTop={Math.max(insets.top + 8, 16)}
          gap="$4"
          $gtSm={{ padding: "$6", maxWidth: 600 }}
          alignSelf="center"
          width="100%"
        >
          <XStack gap="$2" alignItems="center">
            <BackButton />
            <YStack gap="$1" flex={1}>
              <Text
                fontSize="$8"
                fontWeight="bold"
                fontFamily="$heading"
                color="$color"
                $gtSm={{ fontSize: "$10" }}
              >
                Add Business
              </Text>
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Add a new business location to your account
              </Text>
            </YStack>
          </XStack>

          <Form onSubmit={handleAddBusiness} gap="$4">
            <FormInput
              label="Business Name"
              placeholder="My Restaurant"
              value={form.name}
              onChangeText={(value) => updateField("name", value)}
              icon={<Building size={20} color="$colorMuted" />}
              error={errors.name}
              required
            />

            <YStack gap="$2">
              <Label
                htmlFor="businessType"
                fontSize="$4"
                fontWeight="500"
                fontFamily="$body"
                color="$color"
              >
                Business Type *
              </Label>
              <Select
                value={form.type}
                onValueChange={(value) => updateField("type", value)}
                disablePreventBodyScroll
              >
                <Select.Trigger
                  iconAfter={Building}
                  borderRadius="$4"
                  backgroundColor="$background"
                  borderColor={errors.type ? "$error" : "$borderColor"}
                  focusStyle={{
                    borderColor: errors.type ? "$error" : "$primary",
                  }}
                >
                  <Select.Value placeholder="Select business type" />
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
                    <Building size={20} />
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
                        Business Types
                      </Select.Label>
                      <Select.Item index={0} value="restaurant">
                        <Select.ItemText>Restaurant</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="cafe">
                        <Select.ItemText>Cafe</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="bakery">
                        <Select.ItemText>Bakery</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={3} value="food_truck">
                        <Select.ItemText>Food Truck</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={4} value="cloud_kitchen">
                        <Select.ItemText>Cloud Kitchen</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={5} value="catering">
                        <Select.ItemText>Catering</Select.ItemText>
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
                    <Building size={20} />
                  </Select.ScrollDownButton>
                </Select.Content>
              </Select>
              {errors.type && (
                <Text fontSize="$2" color="$red10" fontFamily="$body">
                  {errors.type}
                </Text>
              )}
            </YStack>

            <FormInput
              label="Street Address"
              placeholder="123 Main Street"
              value={form.address}
              onChangeText={(value) => updateField("address", value)}
              icon={<MapPin size={20} color="$colorMuted" />}
              required
            />

            <FormInput
              label="City"
              placeholder="Accra"
              value={form.city}
              onChangeText={(value) => updateField("city", value)}
              icon={<MapPin size={20} color="$colorMuted" />}
              required
            />

            <FormInput
              label="Phone Number"
              placeholder="+233 24 000 0000"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(value) => updateField("phone", value)}
              icon={<Phone size={20} color="$colorMuted" />}
              required
            />

            <FormInput
              label="Email (Optional)"
              placeholder="business@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              icon={<Mail size={20} color="$colorMuted" />}
            />

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
                onPress={handleAddBusiness}
                disabled={isLoading}
                opacity={isLoading ? 0.7 : 1}
              >
                {isLoading ? "Adding Business..." : "Add Business"}
              </Button>

              <Button
                variant="outline"
                size="$5"
                onPress={() =>
                  navigation.canGoBack()
                    ? router.back()
                    : router.replace("/(seller)/businesses")
                }
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
