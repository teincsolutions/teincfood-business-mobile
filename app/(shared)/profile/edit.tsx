// @ts-nocheck
import { useState } from "react";
import { ScrollView, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { YStack, XStack, Text, Card, Avatar, Separator } from "tamagui";
import { FormInput, Button, BackButton } from "@/components/ui";
import {
  ArrowLeft,
  Save,
  Camera,
  User,
  Mail,
  Phone,
  Image as ImageIcon,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Edit Profile Screen
 */
export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const requestPermissions = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to take photos."
        );
        return false;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Media library permission is needed to select photos."
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (useCamera: boolean) => {
    const hasPermission = await requestPermissions(useCamera);
    if (!hasPermission) return;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Profile Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: () => pickImage(true),
      },
      {
        text: "Choose from Gallery",
        onPress: () => pickImage(false),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name is required");
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateUser({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        justifyContent="space-between"
        paddingTop={Math.max(insets.top + 8, 24)}
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <BackButton />
          <Text fontSize="$6" fontWeight="bold">
            Edit Profile
          </Text>
        </XStack>
        <Button
          variant="primary"
          height="$10"
          $lg={{ height: "$10" }}
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
          {/* Profile Photo */}
          <Card padding="$4" bordered alignItems="center">
            <YStack alignItems="center" gap="$3">
              <Avatar circular size="$20">
                <Avatar.Image
                  src={selectedImage || user?.avatarUrl}
                />
                <Avatar.Fallback backgroundColor="$primary">
                  <User size={32} color="$background" />
                </Avatar.Fallback>
              </Avatar>
              <Button
                variant="outline"
                width="auto"
                height={40}
                paddingHorizontal="$4"
                icon={<Camera size={18} />}
                onPress={handleChangePhoto}
              >
                Change Photo
              </Button>
            </YStack>
          </Card>

          {/* Personal Information */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Personal Information
              </Text>
              <Separator />

              <FormInput
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                required
              />

              <FormInput
                label="Email Address"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FormInput
                label="Phone Number"
                placeholder="+233 XX XXX XXXX"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            variant="primary"
            width="100%"
            loading={isSaving}
            onPress={handleSave}
          >
            Save Changes
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
