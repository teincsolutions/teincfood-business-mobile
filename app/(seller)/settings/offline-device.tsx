import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Text, XStack, YStack } from "tamagui";
import { AlertTriangle, MonitorSmartphone, Trash2 } from "@tamagui/lucide-icons";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useAuthStore } from "@/stores/auth.store";

export default function OfflineDeviceSettings() {
  const router = useRouter();
  const { loading, hasDevice, members, evaluation, removeDevice } = useOfflineAuth();
  const [busy, setBusy] = useState(false);

  const handleRemove = () => {
    Alert.alert(
      "Remove this device?",
      "This revokes the terminal's offline license and deletes every local PIN. You can activate it again while online.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove device",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await removeDevice();
                useAuthStore.getState().clearAuth();
                router.replace("/(auth)/login");
              } catch (error) {
                Alert.alert(
                  "Could not remove device",
                  error instanceof Error ? error.message : "Try again while online.",
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <YStack flex={1} bg="$background" p="$4" gap="$4">
      <YStack gap="$1">
        <Text fontSize={24} fontWeight="800" fontFamily="$heading" color="$color">
          Offline device
        </Text>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          This terminal keeps a signed offline license and one PIN per enrolled member.
        </Text>
      </YStack>

      <Card padding="$4" bordered gap="$3">
        <XStack gap="$3" items="center">
          <MonitorSmartphone size={28} color="$primary" />
          <YStack flex={1}>
            <Text fontWeight="700" color="$color">
              {loading ? "Checking…" : hasDevice ? "Activated" : "Not activated"}
            </Text>
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              {hasDevice
                ? `${members.length} member${members.length === 1 ? "" : "s"} can unlock offline`
                : "Activate while online to enable offline sign-in"}
            </Text>
          </YStack>
        </XStack>

        {evaluation ? (
          <YStack gap="$1">
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              License status: {evaluation.entitled ? "valid" : evaluation.reason ?? "needs renewal"}
            </Text>
            {evaluation.payload?.expires_at ? (
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                Expires: {new Date(evaluation.payload.expires_at).toLocaleString()}
              </Text>
            ) : null}
          </YStack>
        ) : null}
      </Card>

      {hasDevice ? (
        <Card padding="$4" bordered gap="$3" borderColor="$error">
          <XStack gap="$2" items="center">
            <AlertTriangle size={18} color="$error" />
            <Text fontWeight="700" color="$error">
              Remove this device
            </Text>
          </XStack>
          <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
            This revokes the license on the server and deletes every offline PIN from this terminal.
            Logout alone keeps the license; this is the separate destructive action.
          </Text>
          <Button
            bg="$error"
            color="$background"
            icon={<Trash2 size={18} color="$background" />}
            disabled={busy}
            onPress={handleRemove}
          >
            {busy ? "Removing…" : "Remove device"}
          </Button>
        </Card>
      ) : null}
    </YStack>
  );
}
