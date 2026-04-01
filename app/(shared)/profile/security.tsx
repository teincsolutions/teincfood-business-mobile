// @ts-nocheck
import { useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Button, Separator, Switch, Input } from 'tamagui';
import { Shield, Lock, Fingerprint, Key, Smartphone, ChevronRight, Eye, EyeOff, Check } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Security Settings Screen
 */
export default function Security() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Security settings
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return;
    }
    if (newPassword !== confirmPassword) {
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  const securityOptions = [
    {
      icon: Fingerprint,
      label: 'Biometric Login',
      description: 'Use fingerprint or face ID to login',
      value: biometricEnabled,
      onToggle: setBiometricEnabled,
    },
    {
      icon: Key,
      label: 'Two-Factor Authentication',
      description: 'Add an extra layer of security',
      value: twoFactorEnabled,
      onToggle: setTwoFactorEnabled,
    },
    {
      icon: Smartphone,
      label: 'Login Notifications',
      description: 'Get notified of new logins',
      value: loginNotifications,
      onToggle: setLoginNotifications,
    },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text fontSize="$4" color="$primary">← Back</Text>
        </TouchableOpacity>
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Security
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Security Status */}
          <Card padding="$4" bordered backgroundColor="$green2">
            <XStack gap="$3" alignItems="center">
              <YStack
                width={50}
                height={50}
                borderRadius="$10"
                backgroundColor="$green10"
                alignItems="center"
                justifyContent="center"
              >
                <Shield size={24} color="white" />
              </YStack>
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="bold">Account Protected</Text>
                <Text fontSize="$3" color="$colorMuted">
                  Your account security is good
                </Text>
              </YStack>
              <Check size={24} color="#27ae60" />
            </XStack>
          </Card>

          {/* Change Password */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Lock size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Change Password</Text>
              </XStack>
              <Separator />

              <YStack gap="$2">
                <Text fontWeight="bold">Current Password</Text>
                <XStack position="relative">
                  <Input
                    flex={1}
                    size="$4"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: 'absolute', right: 12, top: 12 }}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color="$colorMuted" />
                    ) : (
                      <Eye size={20} color="$colorMuted" />
                    )}
                  </TouchableOpacity>
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="bold">New Password</Text>
                <XStack position="relative">
                  <Input
                    flex={1}
                    size="$4"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: 12, top: 12 }}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color="$colorMuted" />
                    ) : (
                      <Eye size={20} color="$colorMuted" />
                    )}
                  </TouchableOpacity>
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="bold">Confirm New Password</Text>
                <Input
                  size="$4"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </YStack>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <Text fontSize="$2" color="$red10">
                  Passwords do not match
                </Text>
              )}

              <Button
                backgroundColor="$primary"
                onPress={handlePasswordChange}
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || isSaving}
                opacity={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword ? 0.5 : 1}
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </YStack>
          </Card>

          {/* Security Options */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Security Options</Text>
              <Separator />
              {securityOptions.map((option, index) => (
                <YStack key={index}>
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    paddingVertical="$2"
                  >
                    <XStack gap="$3" alignItems="center" flex={1}>
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$10"
                        backgroundColor="$gray3"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <option.icon size={20} color="$colorMuted" />
                      </YStack>
                      <YStack flex={1}>
                        <Text fontWeight="bold">{option.label}</Text>
                        <Text fontSize="$2" color="$colorMuted">{option.description}</Text>
                      </YStack>
                    </XStack>
                    <Switch
                      checked={option.value}
                      onCheckedChange={option.onToggle}
                      backgroundColor={option.value ? '$primary' : '$gray8'}
                    >
                      <Switch.Thumb backgroundColor="white" />
                    </Switch>
                  </XStack>
                  {index < securityOptions.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Active Sessions */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Active Sessions</Text>
              <Separator />
              <XStack justifyContent="space-between" alignItems="center" paddingVertical="$2">
                <XStack gap="$3" alignItems="center">
                  <Smartphone size={20} color="$colorMuted" />
                  <YStack>
                    <Text fontWeight="bold">This Device</Text>
                    <Text fontSize="$2" color="$colorMuted">iPhone 15 Pro • Accra, Ghana</Text>
                  </YStack>
                </XStack>
                <YStack backgroundColor="$green10" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                  <Text color="white" fontSize="$1">Current</Text>
                </YStack>
              </XStack>
              <Button variant="outlined" size="$3">
                View All Sessions
              </Button>
            </YStack>
          </Card>

          {/* Danger Zone */}
          <Card padding="$4" bordered borderColor="$red10">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold" color="$red10">Danger Zone</Text>
              <Separator />
              <Button variant="outlined" borderColor="$red10" color="$red10">
                Deactivate Account
              </Button>
              <Text fontSize="$2" color="$colorMuted">
                Temporarily disable your account. You can reactivate anytime.
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}