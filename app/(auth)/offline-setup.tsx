import { useState } from "react";
import { useRouter } from "expo-router";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input, Text, YStack } from "tamagui";
import { toast } from "sonner-native";
import { extractApiErrorCode, extractApiErrorMessage } from "@teincfood/core";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useMyBusinessCapabilities } from "@/hooks/useMyBusinessCapabilities";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useOfflineSetupStore } from "@/stores/offlineSetup.store";

export default function OfflineSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const business = useBusinessStore((s) => s.activeBusiness);
  const { data: membership } = useMyBusinessCapabilities();
  const { hasDevice, members, activateLicense, setOfflinePin } = useOfflineAuth();
  const skipSetup = useOfflineSetupStore((s) => s.skip);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMember = user
    ? members.find(
        (member) =>
          member.user_id === user.id &&
          (!member.business_id || member.business_id === business?.id),
      )
    : null;
  const hasExistingPin = Boolean(currentMember?.pin_hash);

  const canSubmit =
    Boolean(user && business && membership) &&
    pin.length === 6 &&
    pin === confirmPin &&
    (!hasExistingPin || currentPin.length === 6) &&
    !busy;

  const submit = async () => {
    if (!user || !business || !membership) return;
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      // License first; the PIN is only the optional offline quick-login.
      if (!hasDevice) {
        await activateLicense();
      }
      await setOfflinePin({
        userId: user.id,
        newPin: pin,
        currentPin: hasExistingPin ? currentPin : undefined,
        member: {
          fullName: user.full_name ?? user.email ?? "Team member",
          email: user.email,
          role: membership.role,
          capabilities: membership.capabilities,
        },
      });
      toast.success(hasExistingPin ? "Offline PIN updated" : "Offline PIN set");
      router.replace("/(seller)/" as any);
    } catch (e) {
      const code = extractApiErrorCode(e);
      const message = extractApiErrorMessage(e);
      setError(
        code && code !== "VALIDATION_ERROR" ? `${message} (${code})` : message,
      );
    } finally {
      setBusy(false);
    }
  };

  const notNow = () => {
    Keyboard.dismiss();
    if (!hasDevice && business?.id) skipSetup(business.id);
    router.replace(hasDevice ? ("/(seller)/settings/offline-device" as any) : "/");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom + 24, 24),
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$4">
            <YStack gap="$2">
              <Text
                fontSize={28}
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                {hasDevice ? "Offline quick-login PIN" : "Set up offline access"}
              </Text>
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                {hasDevice
                  ? "This terminal already has an offline license. The 6-digit PIN is optional — it lets team members sign in quickly when the internet is down."
                  : "This activates the terminal license and adds an optional 6-digit PIN for quick sign-in while offline."}
              </Text>
            </YStack>

            {hasExistingPin ? (
              <Input
                value={currentPin}
                onChangeText={(value) =>
                  setCurrentPin(value.replace(/\D/g, "").slice(0, 6))
                }
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                placeholder="Current 6-digit PIN"
                height={52}
              />
            ) : null}

            <Input
              value={pin}
              onChangeText={(value) =>
                setPin(value.replace(/\D/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              secureTextEntry
              maxLength={6}
              placeholder={hasExistingPin ? "New 6-digit PIN" : "6-digit offline PIN"}
              height={52}
            />
            <Input
              value={confirmPin}
              onChangeText={(value) =>
                setConfirmPin(value.replace(/\D/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              secureTextEntry
              maxLength={6}
              placeholder="Confirm PIN"
              height={52}
            />

            {error ? (
              <Text color="$error" fontFamily="$body" selectable>
                {error}
              </Text>
            ) : null}

            <Button
              bg="$primary"
              color="$background"
              height={52}
              disabled={!canSubmit}
              onPress={() => void submit()}
            >
              {busy
                ? "Saving…"
                : hasExistingPin
                  ? "Change PIN"
                  : hasDevice
                    ? "Set PIN"
                    : "Activate device & set PIN"}
            </Button>

            <Button chromeless onPress={notNow}>
              Not now
            </Button>
          </YStack>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
