// @ts-nocheck
import { useState, useRef, useCallback } from "react";
import { ScrollView, Switch } from "react-native";
import { YStack, XStack, Text, Separator, useTheme } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { toast } from "sonner-native";
import {
  Shield,
  Fingerprint,
  ChevronRight,
  Mail,
  Lock,
  Phone,
  Globe,
  Trash2,
} from "@tamagui/lucide-icons";
import { BackButton, AppAlertDialog } from "@/components/ui";
import { useSecurityStore } from "@/stores/security.store";
import { useAuthStore } from "@/stores/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { useProfileQuery } from "@/hooks/useProfile";
import PasswordScreen from "./change-password";
import ChangeEmailScreen from "./change-email";
import ChangePhoneScreen from "./change-phone";

const SNAP_POINTS = ["50%", "85%"];

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const storeUser = useAuthStore((s) => s.user);
  const { data: profileData } = useProfileQuery();
  const user = profileData ?? storeUser;
  const hasPassword = user?.has_password === true;

  const isBiometricEnabled = useSecurityStore((s) => s.isBiometricEnabled);
  const setBiometricEnabled = useSecurityStore((s) => s.setBiometricEnabled);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const passwordSheetRef = useRef<BottomSheetModal>(null);
  const emailSheetRef = useRef<BottomSheetModal>(null);
  const phoneSheetRef = useRef<BottomSheetModal>(null);

  const { deleteAccount, isDeletingAccount } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    // Guard against repeated taps while the request is in flight.
    if (isDeletingAccount) return;
    try {
      await deleteAccount();
      toast.success("Your account has been permanently deleted");
    } catch {
      // Session is untouched on failure — user stays signed in.
      toast.error("Could not delete your account. Please try again.");
    }
  }, [deleteAccount, isDeletingAccount]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  const handleBiometricToggle = useCallback(async () => {
    if (biometricLoading) return;
    setBiometricLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        toast.error("This device does not support biometric authentication");
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        toast.error("No biometrics enrolled on this device");
        return;
      }
      const action = isBiometricEnabled ? "disable" : "enable";
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirm to ${action} biometric unlock`,
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setBiometricEnabled(!isBiometricEnabled);
        toast.success(isBiometricEnabled ? "Biometric unlock disabled" : "Biometric unlock enabled");
      }
    } catch {
      toast.error("Biometric authentication failed");
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricLoading, isBiometricEnabled, setBiometricEnabled]);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Privacy & Security
        </Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$5" gap="$6">
          {/* Account Settings */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
              Account Settings
            </Text>

            <YStack backgroundColor="$backgroundStrong" borderRadius="$5" overflow="hidden">
              <XStack
                alignItems="center" padding="$4" gap="$3"
                onPress={() => emailSheetRef.current?.present()}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                  <Mail size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Email Address</Text>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    {user?.email || "Not set"}
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>

              <Separator borderColor="$borderColor" marginLeft={60} />

              <XStack
                alignItems="center" padding="$4" gap="$3"
                onPress={() => phoneSheetRef.current?.present()}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                  <Phone size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Phone Number</Text>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    {user?.phone || "Not set"}
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>

              <Separator borderColor="$borderColor" marginLeft={60} />

              <XStack
                alignItems="center" padding="$4" gap="$3"
                onPress={() => passwordSheetRef.current?.present()}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                  <Lock size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Password</Text>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    {hasPassword ? "Change your password" : "Set a password"}
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>
            </YStack>
          </YStack>

          {/* Device Security */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
              Device Security
            </Text>
            <YStack backgroundColor="$backgroundStrong" borderRadius="$5" overflow="hidden">
              <XStack
                alignItems="center" paddingVertical="$4" paddingHorizontal="$4" justifyContent="space-between"
              >
                <XStack gap="$3" alignItems="center" flex={1}>
                  <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                    <Fingerprint size={20} color="$primary" />
                  </YStack>
                  <YStack gap="$1" flex={1}>
                    <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Biometric Authentication</Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Face ID / Touch ID Unlock</Text>
                  </YStack>
                </XStack>
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ true: "#FF9633", false: "#E0E0E0" }}
                  disabled={biometricLoading}
                />
              </XStack>
            </YStack>
          </YStack>

          {/* Privacy Links */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="700" fontFamily="$heading" color="$colorSecondary" textTransform="uppercase">
              Privacy
            </Text>
            <YStack backgroundColor="$backgroundStrong" borderRadius="$5" overflow="hidden">
              <XStack
                alignItems="center" padding="$4" gap="$3"
                onPress={() => router.push("/(shared)/profile/privacy-policy")}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                  <Shield size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Data & Privacy Policy</Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>

              <Separator borderColor="$borderColor" marginLeft={60} />

              <XStack
                alignItems="center" padding="$4" gap="$3"
                onPress={() => router.push("/(shared)/profile/terms")}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                  <Globe size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Terms of Service</Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>

              <Separator borderColor="$borderColor" marginLeft={60} />

              <XStack
                alignItems="center" padding="$4" gap="$3"
                onPress={() => setDeleteDialogOpen(true)}
                pressStyle={{ opacity: 0.7 }}
              >
                <YStack backgroundColor="rgba(255,145,0,0.1)" padding="$2" borderRadius="$3">
                  <Trash2 size={20} color="$primary" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">Delete Account</Text>
                </YStack>
                <ChevronRight size={20} color="$colorSecondary" />
              </XStack>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>

      <AppAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Account?"
        description="This permanently deletes your account, profile and saved data. This cannot be undone."
        confirmText="Delete Account"
        cancelText="Keep Account"
        isDestructive
        icon={Trash2}
        onConfirm={handleDeleteAccount}
      />

      {/* Password Sheet */}
      <BottomSheetModal
        ref={passwordSheetRef}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.background.val }}
        handleIndicatorStyle={{ backgroundColor: theme.colorSecondary.val }}
      >
        <XStack paddingHorizontal="$5" paddingBottom="$3">
          <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
            {hasPassword ? "Change Password" : "Set Password"}
          </Text>
        </XStack>
        <PasswordScreen onClose={() => passwordSheetRef.current?.dismiss()} />
      </BottomSheetModal>

      {/* Email Sheet */}
      <BottomSheetModal
        ref={emailSheetRef}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.background.val }}
        handleIndicatorStyle={{ backgroundColor: theme.colorSecondary.val }}
      >
        <XStack paddingHorizontal="$5" paddingBottom="$3">
          <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">Change Email</Text>
        </XStack>
        <ChangeEmailScreen onClose={() => emailSheetRef.current?.dismiss()} />
      </BottomSheetModal>

      {/* Phone Sheet */}
      <BottomSheetModal
        ref={phoneSheetRef}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.background.val }}
        handleIndicatorStyle={{ backgroundColor: theme.colorSecondary.val }}
      >
        <XStack paddingHorizontal="$5" paddingBottom="$3">
          <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">Change Phone Number</Text>
        </XStack>
        <ChangePhoneScreen onClose={() => phoneSheetRef.current?.dismiss()} />
      </BottomSheetModal>
    </YStack>
  );
}
