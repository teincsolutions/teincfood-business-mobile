// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Input,
  Avatar,
  Separator,
} from 'tamagui';
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
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <Button
            size="$3"
            circular
            backgroundColor="$gray3"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Edit Profile</Text>
        </XStack>
        <Button
          size="$3"
          backgroundColor="$primary"
          onPress={handleSave}
          disabled={isSaving}
          icon={<Save size={18} color="$background" />}
        >
          <Text color="$background" fontWeight="bold">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Button>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Profile Photo */}
          <Card padding="$4" bordered alignItems="center">
            <YStack alignItems="center" gap="$3">
              <Avatar circular size="$10">
                <Avatar.Image
                  source={{ uri: user?.avatarUrl || undefined }}
                />
                <Avatar.Fallback backgroundColor="$primary">
                  <User size={32} color="$background" />
                </Avatar.Fallback>
              </Avatar>
              <Button
                variant="outline"
                size="$3"
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

              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <User size={16} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">
                    Full Name *
                  </Text>
                </XStack>
                <Input
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                  size="$4"
                />
              </YStack>

              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <Mail size={16} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">
                    Email Address
                  </Text>
                </XStack>
                <Input
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  size="$4"
                />
              </YStack>

              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <Phone size={16} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">
                    Phone Number
                  </Text>
                </XStack>
                <Input
                  placeholder="+233 XX XXX XXXX"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  size="$4"
                />
              </YStack>
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            size="$5"
            backgroundColor="$primary"
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text color="$background" fontWeight="bold">
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}