// @ts-nocheck
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Switch, Alert } from "react-native";
import { YStack, XStack, Text, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Shield,
  Fingerprint,
  ChevronRight,
  Smartphone,
  Globe,
  AlertCircle,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import * as LocalAuthentication from "expo-local-authentication";
import { useSecurityStore } from "@/stores/security.store";
import { useAuthStore } from "@/stores/auth.store";

export default function SecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { isBiometricEnabled, setBiometricEnabled } = useSecurityStore();

  const [isSupported, setIsSupported] = useState(false);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    description: "",
    icon: Fingerprint,
    isDestructive: false,
  });

  const showAlert = (
    title: string,
    description: string,
    icon = Fingerprint,
    isDestructive = false,
  ) => {
    setDialogConfig({ title, description, icon, isDestructive });
    setDialogOpen(true);
  };

  useEffect(() => {
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsSupported(compatible);

        if (!compatible && isBiometricEnabled) {
          setBiometricEnabled(false);
        }
      } finally {
        setIsCheckingSupport(false);
      }
    })();
  }, [isBiometricEnabled, setBiometricEnabled]);

  const handleToggleBiometrics = async (value: boolean) => {
    // If turning OFF, require authentication first
    if (!value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm Identity to Disable Biometrics",
        fallbackLabel: "Use Passcode",
      });

      if (result.success) {
        setBiometricEnabled(false);
        showAlert(
          "Biometrics Turned Off",
          "Biometric login has been disabled for this device.",
          Shield,
        );
      } else {
        showAlert(
          "Verification Failed",
          "Could not disable biometrics without authentication.",
          AlertCircle,
          true,
        );
      }
      return;
    }

    if (!isSupported) {
      showAlert(
        "Not Supported",
        "This device does not support biometric authentication.",
        AlertCircle,
        true,
      );
      return;
    }

    // Try to authenticate before enabling
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      showAlert(
        "Not Set Up",
        "Please set up Biometrics (Face ID / Fingerprint) in your device settings first.",
        Shield,
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm Biometric Enrollment",
      fallbackLabel: "Enter Passcode",
    });

    if (result.success) {
      setBiometricEnabled(true);
      showAlert(
        "Biometrics Enabled",
        "You will be asked to verify your identity when opening the app.",
        Fingerprint,
      );
      return;
    }

    showAlert(
      "Verification Failed",
      "Biometric login was not enabled because we could not verify your identity.",
      AlertCircle,
      true,
    );
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top, 50)}
    >
      <AppAlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        icon={dialogConfig.icon}
        onConfirm={() => setDialogOpen(false)}
      />

      {/* Header */}
      <XStack
        alignItems="center"
        paddingHorizontal="$5"
        paddingBottom="$4"
        gap="$3"
      >
        <BackButton />
        <Text
          fontSize="$6"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
        >
          Privacy & Security
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" gap="$6">
          <YStack gap="$2">
            <Text
              fontSize="$3"
              fontWeight="700"
              fontFamily="$heading"
              color="$colorSecondary"
              textTransform="uppercase"
            >
              Device Security
            </Text>

            <XStack
              alignItems="center"
              paddingVertical="$4"
              justifyContent="space-between"
            >
              <XStack gap="$3" alignItems="center" flex={1}>
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Fingerprint size={20} color="$primary" />
                </YStack>
                <YStack gap="$1" flex={1}>
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    Biometric Authentication
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Face ID / Touch ID Unlock
                  </Text>
                </YStack>
              </XStack>
              {isSupported ? (
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleToggleBiometrics}
                  disabled={isCheckingSupport}
                  trackColor={{ true: "#FF9633", false: "#E0E0E0" }}
                />
              ) : (
                <Text fontSize="$2" color="$red" fontFamily="$body">
                  Not Supported
                </Text>
              )}
            </XStack>
          </YStack>

          <YStack gap="$2" marginTop="$2">
            <Text
              fontSize="$3"
              fontWeight="700"
              fontFamily="$heading"
              color="$colorSecondary"
              textTransform="uppercase"
            >
              Linked Accounts
            </Text>

            <XStack
              alignItems="center"
              paddingVertical="$4"
              justifyContent="space-between"
            >
              <XStack gap="$3" alignItems="center">
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Smartphone size={20} color="$primary" />
                </YStack>
                <YStack gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    Phone Number (OTP)
                  </Text>
                  <Text fontSize="$3" color="$green" fontFamily="$body">
                    Verified: {user?.phone || "Not set"}
                  </Text>
                </YStack>
              </XStack>
            </XStack>

            <Separator borderColor="$gray100" />

            <XStack
              alignItems="center"
              paddingVertical="$4"
              justifyContent="space-between"
            >
              <XStack gap="$3" alignItems="center">
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Globe size={20} color="$primary" />
                </YStack>
                <YStack gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    Email & Password
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {user?.email || "Not set"}
                  </Text>
                </YStack>
              </XStack>
            </XStack>

            <Separator borderColor="$gray100" />

            <XStack
              alignItems="center"
              paddingVertical="$4"
              justifyContent="space-between"
            >
              <XStack gap="$3" alignItems="center">
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Globe size={20} color="$primary" />
                </YStack>
                <YStack gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    Username / Buyer ID
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    @{user?.username || "not-set"}
                  </Text>
                </YStack>
              </XStack>
            </XStack>
          </YStack>

          <YStack gap="$2" marginTop="$2">
            <Text
              fontSize="$3"
              fontWeight="700"
              fontFamily="$heading"
              color="$colorSecondary"
              textTransform="uppercase"
            >
              Privacy
            </Text>

            <XStack
              alignItems="center"
              paddingVertical="$4"
              justifyContent="space-between"
              onPress={() => router.push("/profile/privacy-policy")}
            >
              <XStack gap="$3" alignItems="center">
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Shield size={20} color="$primary" />
                </YStack>
                <YStack gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    Data & Privacy Policy
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    How your data is managed
                  </Text>
                </YStack>
              </XStack>
              <ChevronRight size={20} color="$colorSecondary" />
            </XStack>

            <Separator borderColor="$gray100" />

            <XStack
              alignItems="center"
              paddingVertical="$4"
              justifyContent="space-between"
              onPress={() => router.push("/profile/terms")}
            >
              <XStack gap="$3" alignItems="center">
                <YStack
                  backgroundColor="rgba(255,145,0,0.1)"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Shield size={20} color="$primary" />
                </YStack>
                <YStack gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    Terms of Service
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Rules and account usage terms
                  </Text>
                </YStack>
              </XStack>
              <ChevronRight size={20} color="$colorSecondary" />
            </XStack>
          </YStack>

          <YStack marginTop="$6" alignItems="center">
            <Button
              variant="outline"
              borderColor="$red"
              width="100%"
              height={56}
            >
              <Text color="$red" fontWeight="700" fontFamily="$body">
                Delete Account Permanently
              </Text>
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
