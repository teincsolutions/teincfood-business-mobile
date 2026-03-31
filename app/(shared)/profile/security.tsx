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
  Switch,
  Separator,
} from 'tamagui';
import { FormInput } from '@/components/ui';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Key,
  ChevronRight,
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Security Settings Screen
 */
export default function SecuritySettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const securityOptions = [
    {
      icon: Smartphone,
      title: 'Biometric Login',
      description: 'Use fingerprint or face ID to login',
      isSwitch: true,
      value: biometricEnabled,
      onToggle: () => setBiometricEnabled(!biometricEnabled),
    },
    {
      icon: Key,
      title: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      isSwitch: true,
      value: twoFactorEnabled,
      onToggle: () => setTwoFactorEnabled(!twoFactorEnabled),
    },
  ];

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
          <Text fontSize="$6" fontWeight="bold">Security</Text>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Security Info */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <XStack gap="$3" alignItems="center">
              <Shield size={24} color="$blue10" />
              <YStack flex={1}>
                <Text fontWeight="bold" color="$blue10">
                  Protect Your Account
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Keep your account secure with these settings
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Change Password */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <XStack gap="$3" alignItems="center">
                <Lock size={20} color="$primary" />
                <Text fontWeight="bold" fontSize="$5">
                  Change Password
                </Text>
              </XStack>
              <Separator />

              <FormInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                isPassword
                required
              />

              <FormInput
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
                required
              />

              <FormInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                required
              />

              <Button
                backgroundColor="$primary"
                onPress={handleChangePassword}
                disabled={isSaving}
              >
                <Text color="$background" fontWeight="bold">
                  {isSaving ? 'Changing...' : 'Change Password'}
                </Text>
              </Button>
            </YStack>
          </Card>

          {/* Security Options */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Security Options
              </Text>
              <Separator />

              {securityOptions.map((option, index) => (
                <YStack key={index}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack gap="$3" alignItems="center" flex={1}>
                      <option.icon size={20} color="$colorMuted" />
                      <YStack flex={1}>
                        <Text fontWeight="bold">{option.title}</Text>
                        <Text color="$colorMuted" fontSize="$2">{option.description}</Text>
                      </YStack>
                    </XStack>
                    <Switch
                      checked={option.value}
                      onCheckedChange={option.onToggle}
                      backgroundColor={option.value ? '$green10' : '$gray8'}
                    >
                      <Switch.Thumb backgroundColor="$background" />
                    </Switch>
                  </XStack>
                  {index < securityOptions.length - 1 && <Separator marginTop="$3" />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Active Sessions */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Active Sessions
              </Text>
              <Separator />

              <Button
                unstyled
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                padding="$3"
                pressStyle={{ backgroundColor: "$gray3" }}
                onPress={() => Alert.alert('Sessions', 'Manage active sessions')}
              >
                <YStack>
                  <Text fontWeight="bold">Current Device</Text>
                  <Text color="$colorMuted" fontSize="$2">
                    Last active: Just now
                  </Text>
                </YStack>
                <ChevronRight size={16} color="$colorMuted" />
              </Button>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}