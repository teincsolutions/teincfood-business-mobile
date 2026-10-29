import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Button, Input, Text, XStack, YStack } from "tamagui";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useRoleStore } from "@/stores/role.store";
import type { OfflineMemberCredential } from "@teincfood/core";

export default function OfflineLoginScreen() {
  const router = useRouter();
  const { loading, hasDevice, members, evaluation, error, refresh, login } = useOfflineAuth();
  const setRole = useRoleStore((s) => s.setRole);
  const [selected, setSelected] = useState<OfflineMemberCredential | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !hasDevice) {
      router.replace("/(auth)/login");
    }
  }, [hasDevice, loading, router]);

  const submit = async () => {
    if (!selected || pin.length !== 6) return;
    if (evaluation && !evaluation.entitled) {
      setPinError("This offline license needs renewal. Connect to the internet and sign in once.");
      return;
    }
    setBusy(true);
    setPinError(null);
    try {
      await login(selected.user_id, pin);
      setRole("seller");
      router.replace("/");
    } catch (e) {
      setPinError(e instanceof Error ? e.message : "Could not unlock this device");
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack flex={1} bg="$background" p="$6" gap="$4" justify="center">
      <YStack gap="$2">
        <Text fontSize={28} fontWeight="800" fontFamily="$heading" color="$color">
          Offline access
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          This terminal is licensed for offline use. Choose a team member and enter their 6-digit PIN.
        </Text>
      </YStack>

      {error ? (
        <Text color="$error" fontFamily="$body">
          {error}
        </Text>
      ) : null}

      {evaluation && !evaluation.entitled ? (
        <YStack borderWidth={1} borderColor="$warning" bg="$warningMuted" p="$3" rounded="$4" gap="$1">
          <Text fontWeight="700" color="$warning">
            Offline license needs renewal
          </Text>
          <Text fontSize="$3" color="$warning">
            {evaluation.reason} Connect to the internet and sign in once to renew.
          </Text>
        </YStack>
      ) : null}

      <YStack gap="$2">
        {members.map((member) => {
          const active = selected?.user_id === member.user_id;
          return (
            <Button
              key={member.user_id}
              height={56}
              justify="flex-start"
              bg={active ? "$backgroundHover" : "$background"}
              borderWidth={1}
              borderColor={active ? "$primary" : "$borderColor"}
              onPress={() => {
                setSelected(member);
                setPin("");
                setPinError(null);
              }}
            >
              <YStack items="flex-start" gap="$1">
                <Text fontWeight="700" color="$color">
                  {member.full_name}
                </Text>
                <Text fontSize="$2" color="$colorSecondary">
                  {member.role}
                </Text>
              </YStack>
            </Button>
          );
        })}
      </YStack>

      {selected ? (
        <YStack gap="$3">
          <Text fontFamily="$body" color="$colorSecondary">
            Enter {selected.full_name}'s offline PIN
          </Text>
          <Input
            value={pin}
            onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="6-digit PIN"
            height={52}
          />
          {pinError ? (
            <Text color="$error" fontFamily="$body">
              {pinError}
            </Text>
          ) : null}
          <Button
            bg="$primary"
            color="$background"
            height={52}
            disabled={pin.length !== 6 || busy}
            onPress={() => void submit()}
          >
            {busy ? "Unlocking…" : "Unlock offline"}
          </Button>
        </YStack>
      ) : null}

      <XStack gap="$3" justify="center">
        <Button chromeless onPress={() => void refresh()}>
          Retry
        </Button>
        <Button chromeless onPress={() => router.replace("/(auth)/login")}>
          Sign in online
        </Button>
      </XStack>
    </YStack>
  );
}
