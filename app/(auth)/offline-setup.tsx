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
  const { hasDevice, activate } = useOfflineAuth();
  const skipSetup = useOfflineSetupStore((s) => s.skip);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    Boolean(user && business && membership) &&
    pin.length === 6 &&
    pin === confirmPin &&
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
      await activate({
        member: {
          userId: user.id,
          fullName: user.full_name ?? user.email ?? "Team member",
          email: user.email,
          role: membership.role,
          capabilities: membership.capabilities,
        },
        pin,
      });
      router.replace("/");
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
    if (business?.id) skipSetup(business.id);
    router.replace("/");
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
                Set up offline access
              </Text>
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                This creates a device license for{" "}
                {business?.name ?? "this business"} and a local PIN for{" "}
                {user?.full_name ?? "this member"}. After this, you can sign out
                and back in while the internet is down.
              </Text>
            </YStack>

            {hasDevice ? (
              <Text fontFamily="$body" color="$colorSecondary">
                This device already has an offline license. You can update the
                PIN below.
              </Text>
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
              placeholder="6-digit offline PIN"
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
              {busy ? "Activating…" : "Activate offline access"}
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
