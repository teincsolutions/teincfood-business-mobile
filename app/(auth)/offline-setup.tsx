import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Input, Text, YStack } from "tamagui";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useMyBusinessCapabilities } from "@/hooks/useMyBusinessCapabilities";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";

export default function OfflineSetupScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const business = useBusinessStore((s) => s.activeBusiness);
  const { data: membership } = useMyBusinessCapabilities();
  const { hasDevice, activate } = useOfflineAuth();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    Boolean(user && business && membership) && pin.length === 6 && pin === confirmPin && !busy;

  const submit = async () => {
    if (!user || !business || !membership) return;
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
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
      setError(e instanceof Error ? e.message : "Could not activate offline access");
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack flex={1} bg="$background" p="$6" gap="$4" justify="center">
      <YStack gap="$2">
        <Text fontSize={28} fontWeight="800" fontFamily="$heading" color="$color">
          Set up offline access
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          This creates a device license for {business?.name ?? "this business"} and a local PIN for
          {" "}
          {user?.full_name ?? "this member"}. After this, you can sign out and back in while the
          internet is down.
        </Text>
      </YStack>

      {hasDevice ? (
        <Text fontFamily="$body" color="$colorSecondary">
          This device already has an offline license. You can update the PIN below.
        </Text>
      ) : null}

      <Input
        value={pin}
        onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="6-digit offline PIN"
        height={52}
      />
      <Input
        value={confirmPin}
        onChangeText={(value) => setConfirmPin(value.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="Confirm PIN"
        height={52}
      />

      {error ? (
        <Text color="$error" fontFamily="$body">
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

      <Button chromeless onPress={() => router.replace("/")}>
        Not now
      </Button>
    </YStack>
  );
}
