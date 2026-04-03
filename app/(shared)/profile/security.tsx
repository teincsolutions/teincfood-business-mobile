// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Separator, Switch } from "tamagui";
import {
  Shield,
  Lock,
  Fingerprint,
  Key,
  Smartphone,
  Check,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button, FormInput } from "@/components/ui";

export default function Security() {
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  // Security toggles
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!currentPassword.trim()) {
      next.currentPassword = "Current password is required";
    }
    if (!newPassword.trim()) {
      next.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      next.newPassword = "Password must be at least 8 characters";
    }
    if (!confirmPassword.trim()) {
      next.confirmPassword = "Please confirm your new password";
    } else if (newPassword && newPassword !== confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePasswordChange = () => {
    if (!validate()) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    }, 1500);
  };

  const securityOptions = [
    {
      icon: Fingerprint,
      label: "Biometric Login",
      description: "Use fingerprint or face ID to login",
      value: biometricEnabled,
      onToggle: setBiometricEnabled,
    },
    {
      icon: Key,
      label: "Two-Factor Authentication",
      description: "Add an extra layer of security",
      value: twoFactorEnabled,
      onToggle: setTwoFactorEnabled,
    },
    {
      icon: Smartphone,
      label: "Login Notifications",
      description: "Get notified of new logins",
      value: loginNotifications,
      onToggle: setLoginNotifications,
    },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 8, 24)}
        paddingBottom="$3"
        alignItems="center"
        gap="$3"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Security
        </Text>
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
                <Text fontSize="$5" fontWeight="bold">
                  Account Protected
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Your account security is good
                </Text>
              </YStack>
              <Check size={24} color="$green10" />
            </XStack>
          </Card>

          {/* Change Password */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <XStack gap="$2" alignItems="center">
                <Lock size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                  Change Password
                </Text>
              </XStack>
              <Separator />

              <FormInput
                label="Current Password"
                placeholder="Enter current password"
                isPassword
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (errors.currentPassword) {
                    setErrors((prev) => ({ ...prev, currentPassword: "" }));
                  }
                }}
                error={errors.currentPassword}
              />

              <FormInput
                label="New Password"
                placeholder="Enter new password"
                isPassword
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) {
                    setErrors((prev) => ({ ...prev, newPassword: "" }));
                  }
                }}
                error={errors.newPassword}
              />

              <FormInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                isPassword
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                error={errors.confirmPassword}
              />

              <Button
                variant="primary"
                width="100%"
                onPress={handlePasswordChange}
                loading={isSaving}
                disabled={isSaving}
              >
                Update Password
              </Button>
            </YStack>
          </Card>

          {/* Security Options */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                Security Options
              </Text>
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
                        <Text fontWeight="bold" fontFamily="$heading">
                          {option.label}
                        </Text>
                        <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                          {option.description}
                        </Text>
                      </YStack>
                    </XStack>
                    <Switch
                      checked={option.value}
                      onCheckedChange={option.onToggle}
                      backgroundColor={option.value ? "$primary" : "$gray8"}
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
              <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                Active Sessions
              </Text>
              <Separator />
              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$2"
              >
                <XStack gap="$3" alignItems="center">
                  <Smartphone size={20} color="$colorMuted" />
                  <YStack>
                    <Text fontWeight="bold" fontFamily="$heading">
                      This Device
                    </Text>
                    <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                      iPhone 15 Pro • Accra, Ghana
                    </Text>
                  </YStack>
                </XStack>
                <YStack
                  backgroundColor="$green10"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text color="white" fontSize="$1" fontFamily="$body">
                    Current
                  </Text>
                </YStack>
              </XStack>
              <Button variant="outline">
                View All Sessions
              </Button>
            </YStack>
          </Card>

          {/* Danger Zone */}
          <Card padding="$4" bordered borderColor="$red10">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold" color="$red10" fontFamily="$heading">
                Danger Zone
              </Text>
              <Separator />
              <Button variant="dangerOutline">
                Deactivate Account
              </Button>
              <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                Temporarily disable your account. You can reactivate anytime.
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
