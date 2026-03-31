// @ts-nocheck
import { useState } from "react";
import { ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  Card,
  TextArea,
  Separator,
  Avatar,
   Button as TamaguiButton,
} from "tamagui";
import { ArrowLeft, Camera, Save, Building } from "@tamagui/lucide-icons";
import { Button, FormInput } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Business Profile Settings Screen
 */
export default function BusinessProfileSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [businessDescription, setBusinessDescription] = useState(
    user?.businessDescription || "",
  );
  const [businessAddress, setBusinessAddress] = useState(
    user?.businessAddress || "",
  );
  const [businessPhone, setBusinessPhone] = useState(user?.phone || "");
  const [businessEmail, setBusinessEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [logoUri, setLogoUri] = useState<string | undefined>(
    user?.businessLogoUrl,
  );

  const handleChangeLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library to change your business logo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert("Error", "Business name is required");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateUser({
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        businessAddress: businessAddress.trim(),
        phone: businessPhone.trim(),
        email: businessEmail.trim(),
        ...(logoUri ? { businessLogoUrl: logoUri } : {}),
      });

      Alert.alert("Success", "Business profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update business profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 24)}
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
          <Text fontSize="$6" fontWeight="bold">
            Business Profile
          </Text>
        </XStack>
        <Button
          variant="primary"
          width="auto"
          height={40}
          paddingHorizontal="$4"
          loading={isSaving}
          onPress={handleSave}
          icon={<Save size={18} color="white" />}
        >
          Save
        </Button>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Business Logo */}
          <Card padding="$4" bordered alignItems="center">
            <YStack alignItems="center" gap="$3">
              <Avatar circular size="$16">
                <Avatar.Image src={logoUri} />
                <Avatar.Fallback
                  size="$16"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="$primary"
                >
                  <Building size="$10" color="$background" />
                </Avatar.Fallback>
              </Avatar>
              <Button
                variant="outline"
                width="auto"
                height={40}
                paddingHorizontal="$4"
                icon={<Camera size={18} />}
                onPress={handleChangeLogo}
              >
                Change Logo
              </Button>
            </YStack>
          </Card>

          {/* Business Information */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Business Information
              </Text>
              <Separator />

              <FormInput
                label="Business Name"
                placeholder="Enter your business name"
                value={businessName}
                onChangeText={setBusinessName}
                required
              />

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Description
                </Text>
                <TextArea
                  placeholder="Describe your business..."
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                  numberOfLines={4}
                  backgroundColor="$backgroundSoft"
                  borderWidth={0}
                  borderRadius="$3"
                  fontFamily="$body"
                  fontSize="$4"
                  color="$color"
                  paddingHorizontal="$4"
                  placeholderTextColor="$colorPlaceholder"
                />
              </YStack>

              <FormInput
                label="Business Address"
                placeholder="Enter your business address"
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
            </YStack>
          </Card>

          {/* Contact Information */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Contact Information
              </Text>
              <Separator />

              <FormInput
                label="Phone Number"
                placeholder="+233 XX XXX XXXX"
                value={businessPhone}
                onChangeText={setBusinessPhone}
                keyboardType="phone-pad"
              />

              <FormInput
                label="Email Address"
                placeholder="business@example.com"
                value={businessEmail}
                onChangeText={setBusinessEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </YStack>
          </Card>

          {/* Save Button */}
          <Button variant="primary" loading={isSaving} onPress={handleSave}>
            Save Changes
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
