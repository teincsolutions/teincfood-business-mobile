// @ts-nocheck

import { useState } from "react";
import { ScrollView, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { YStack, XStack, Text, Card, Avatar, Separator } from "tamagui";
import { FormInput, Button, BackButton } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import {
  Save,
  Camera,
  User,
  Mail,
  Phone,
  ChevronRight,
  Shield,
} from "@tamagui/lucide-icons";
import { toast } from "sonner-native";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/useProfile";
import { uploadImage } from "@/services/upload.service";
import { extractApiErrorMessage } from "@/utils/error";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: profile } = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const [fullName, setFullName] = useState(
    profile?.full_name || user?.fullName || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const displayEmail = profile?.email || user?.email || "";
  const displayPhone = profile?.phone || user?.phone || "";

  const requestPermissions = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to take photos.",
        );
        return false;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Media library permission is needed to select photos.",
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
      mediaTypes: ["images"],
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
      toast.error("Full name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, any> = { full_name: fullName.trim() };
      if (selectedImage) {
        const { key } = await uploadImage(selectedImage, "avatars");
        payload.avatar_url = key;
      }
      await updateProfileMutation.mutateAsync(payload);

      updateUser({ fullName: fullName.trim() });

      toast.success("Profile updated successfully");
      router.back();
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
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
                <Avatar.Image src={selectedImage || profile?.avatar_url || user?.avatar_url} />
                <Avatar.Fallback
                  justify="center"
                  alignItems="center"
                  backgroundColor="$primary"
                >
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
            <YStack gap="$3">
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

              <XStack
                alignItems="center"
                gap="$3"
                paddingVertical="$2"
                onPress={() => router.push("/(shared)/profile/security")}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Mail size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Email Address
                  </Text>
                  <Text fontSize="$4" color="$color" fontFamily="$body">
                    {displayEmail || "Not set"}
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>

              <Separator />

              <XStack
                alignItems="center"
                gap="$3"
                paddingVertical="$2"
                onPress={() => router.push("/(shared)/profile/security")}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Phone size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Phone Number
                  </Text>
                  <Text fontSize="$4" color="$color" fontFamily="$body">
                    {displayPhone || "Not set"}
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>

              <Separator />

              <XStack
                alignItems="center"
                gap="$3"
                paddingVertical="$2"
                onPress={() => router.push("/(shared)/profile/security")}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Shield size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Password
                  </Text>
                  <Text fontSize="$4" color="$color" fontFamily="$body">
                    Manage security settings
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>
            </YStack>
          </Card>

          {/* KYC Documents — only riders have personal KYC */}
          {user?.role === "rider" && (
            <Button variant="outline" width="100%" onPress={() => router.push("/(shared)/kyc?type=user&role=rider")}>
              KYC Documents
            </Button>
          )}

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
