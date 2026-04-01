// @ts-nocheck
import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
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
  Form,
} from "tamagui";
import {
  ArrowLeft,
  Camera,
  Save,
  Building,
  AlertCircle,
  CheckCircle,
} from "@tamagui/lucide-icons";
import { Button, FormInput } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormTextArea } from "@/components/ui/FormTextArea";

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
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [logoUri, setLogoUri] = useState<string | undefined>(
    user?.businessLogoUrl,
  );
  const [logoPermissionError, setLogoPermissionError] = useState<
    string | undefined
  >();
  const [errors, setErrors] = useState<{
    businessName?: string;
    businessEmail?: string;
    businessPhone?: string;
  }>({});

  useEffect(() => {
    if (saveStatus === "idle") return;
    const timer = setTimeout(() => {
      setSaveStatus("idle");
      if (saveStatus === "success") router.back();
    }, 2500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^\+?[\d\s\-()]{7,15}$/;

  const validate = () => {
    const next: typeof errors = {};
    if (!businessName.trim()) next.businessName = "Business name is required";
    if (businessEmail.trim() && !EMAIL_REGEX.test(businessEmail.trim()))
      next.businessEmail = "Enter a valid email address";
    if (businessPhone.trim() && !PHONE_REGEX.test(businessPhone.trim()))
      next.businessPhone = "Enter a valid phone number";
    return next;
  };

  const handleChangeLogo = async () => {
    setLogoPermissionError(undefined);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setLogoPermissionError(
        "Photo library access is required to change your logo",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateUser({
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        businessAddress: businessAddress.trim(),
        phone: businessPhone.trim(),
        email: businessEmail.trim(),
        ...(logoUri ? { businessLogoUrl: logoUri } : {}),
      });
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top + 8, 24)}
      paddingBottom={insets.bottom + 60}
    >
      {/* Header */}
      <Form onSubmit={handleSave}>
        <XStack
          padding="$4"
          justifyContent="space-between"
          alignItems="center"
          backgroundColor="$background"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <XStack gap="$3" alignItems="center">
            <Button
              variant="outline"
              width={44}
              height={44}
              circular
              onPress={() => router.back()}
              icon={<ArrowLeft size={20} />}
            />
            <Text fontSize="$6" fontWeight="bold">
              Business Profile
            </Text>
          </XStack>
          <Form.Trigger asChild>
            <Button
              variant="primary"
              width="auto"
              height={40}
              paddingHorizontal="$4"
              loading={isSaving}
              icon={<Save size={18} color="white" />}
            >
              Save
            </Button>
          </Form.Trigger>
        </XStack>

        {/* Status banner */}
        {saveStatus !== "idle" && (
          <XStack
            backgroundColor={saveStatus === "success" ? "$green2" : "$red2"}
            paddingHorizontal="$4"
            paddingVertical="$3"
            gap="$2"
            alignItems="center"
          >
            {saveStatus === "success" ? (
              <CheckCircle size={16} color="$green10" />
            ) : (
              <AlertCircle size={16} color="$red10" />
            )}
            <Text
              color={saveStatus === "success" ? "$green10" : "$red10"}
              fontSize="$3"
            >
              {saveStatus === "success"
                ? "Business profile updated successfully"
                : "Failed to update business profile. Please try again."}
            </Text>
          </XStack>
        )}
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
                {logoPermissionError && (
                  <XStack gap="$1" alignItems="center">
                    <AlertCircle size={14} color="$red10" />
                    <Text color="$red10" fontSize="$2">
                      {logoPermissionError}
                    </Text>
                  </XStack>
                )}
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
                  onChangeText={(t) => {
                    setBusinessName(t);
                    setErrors((e) => ({ ...e, businessName: undefined }));
                  }}
                  error={errors.businessName}
                  required
                />

                <FormTextArea
                  label="Business Description"
                  placeholder="Tell us about your business"
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                  numberOfLines={4}
                />
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
                  onChangeText={(t) => {
                    setBusinessPhone(t);
                    setErrors((e) => ({ ...e, businessPhone: undefined }));
                  }}
                  error={errors.businessPhone}
                  keyboardType="phone-pad"
                />

                <FormInput
                  label="Email Address"
                  placeholder="business@example.com"
                  value={businessEmail}
                  onChangeText={(t) => {
                    setBusinessEmail(t);
                    setErrors((e) => ({ ...e, businessEmail: undefined }));
                  }}
                  error={errors.businessEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </YStack>
            </Card>

            {/* Save Button */}
            <Form.Trigger asChild>
              <Button variant="primary" loading={isSaving}>
                Save Changes
              </Button>
            </Form.Trigger>
          </YStack>
        </ScrollView>
      </Form>
    </YStack>
  );
}
