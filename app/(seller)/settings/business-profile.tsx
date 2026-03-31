// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button as TamaguiButton,
  Input,
  TextArea,
  Separator,
  Avatar,
} from 'tamagui';
import { ArrowLeft, Camera, Save, Building } from '@tamagui/lucide-icons';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Business Profile Settings Screen
 */
export default function BusinessProfileSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessDescription, setBusinessDescription] = useState(
    user?.businessDescription || ''
  );
  const [businessAddress, setBusinessAddress] = useState(
    user?.businessAddress || ''
  );
  const [businessPhone, setBusinessPhone] = useState(user?.phone || '');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
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
      });

      Alert.alert('Success', 'Business profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update business profile');
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
          <TamaguiButton
            width={40}
            height={40}
            circular
            backgroundColor="$backgroundSoft"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Business Profile</Text>
        </XStack>
        <TamaguiButton
          height={44}
          paddingHorizontal="$4"
          backgroundColor="$primary"
          borderRadius="$3"
          onPress={handleSave}
          disabled={isSaving}
          icon={<Save size={18} color="white" />}
        >
          <Text color="white" fontWeight="bold">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TamaguiButton>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Business Logo */}
          <Card padding="$4" bordered alignItems="center">
            <YStack alignItems="center" gap="$3">
              <Avatar circular size="$10">
                <Avatar.Image
                  source={{ uri: user?.avatarUrl || undefined }}
                />
                <Avatar.Fallback backgroundColor="$primary">
                  <Building size={32} color="$background" />
                </Avatar.Fallback>
              </Avatar>
              <TamaguiButton
                height={44}
                paddingHorizontal="$4"
                backgroundColor="transparent"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                icon={<Camera size={18} />}
              >
                Change Logo
              </TamaguiButton>
            </YStack>
          </Card>

          {/* Business Information */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Business Information
              </Text>
              <Separator />

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Business Name *
                </Text>
                <Input
                  placeholder="Enter your business name"
                  value={businessName}
                  onChangeText={setBusinessName}
                  size="$4"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Description
                </Text>
                <TextArea
                  placeholder="Describe your business..."
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                  numberOfLines={4}
                  size="$4"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Business Address
                </Text>
                <Input
                  placeholder="Enter your business address"
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  size="$4"
                />
              </YStack>
            </YStack>
          </Card>

          {/* Contact Information */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Contact Information
              </Text>
              <Separator />

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Phone Number
                </Text>
                <Input
                  placeholder="+233 XX XXX XXXX"
                  value={businessPhone}
                  onChangeText={setBusinessPhone}
                  keyboardType="phone-pad"
                  size="$4"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Email Address
                </Text>
                <Input
                  placeholder="business@example.com"
                  value={businessEmail}
                  onChangeText={setBusinessEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  size="$4"
                />
              </YStack>
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text color="white" fontWeight="bold">
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}