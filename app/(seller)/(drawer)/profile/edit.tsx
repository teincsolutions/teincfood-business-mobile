// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Separator,
} from 'tamagui';
import { FormInput, Button } from '@/components/ui';
import { ArrowLeft, Save, Camera, User, Mail, Phone } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/stores/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Edit Profile Screen
 */
export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
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

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
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
            borderRadius={22}
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} />}
          />
          <Text fontSize="$6" fontWeight="bold">Edit Profile</Text>
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
          {/* Profile Photo */}
          <Card padding="$4" bordered alignItems="center">
            <YStack alignItems="center" gap="$3">
              <Avatar circular size="$10">
                <Avatar.Image
                  src={user?.avatarUrl}
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