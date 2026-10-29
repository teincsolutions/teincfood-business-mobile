import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Spinner, Text, XStack, YStack } from "tamagui";
import { installOTAUpdate, restartForOTAUpdate } from "@/hooks/useOTAUpdate";
import { useOTAUpdateStore } from "@/stores/otaUpdate.store";

/**
 * VS Code-style update notice for OTA JS updates. It sits above the current
 * screen and only asks for the Update/Restart action when the user is ready.
 */
export function OTAUpdateBanner() {
  const insets = useSafeAreaInsets();
  const phase = useOTAUpdateStore((s) => s.phase);
  const error = useOTAUpdateStore((s) => s.error);
  const dismissed = useOTAUpdateStore((s) => s.dismissed);
  const dismiss = useOTAUpdateStore((s) => s.dismiss);

  if (dismissed || phase === "idle" || phase === "checking") return null;

  return (
    <Card
      position="absolute"
      left={12}
      right={12}
      bottom={insets.bottom + 12}
      zIndex={1000}
      bordered
      padding="$3"
      gap="$2"
      bg="$background"
      shadowColor="#000"
      shadowOpacity={0.18}
      shadowRadius={16}
      shadowOffset={{ width: 0, height: 4 }}
      elevation={8}
    >
      <YStack gap="$1">
        <Text fontWeight="800" fontSize="$4" color="$color">
          {phase === "available"
            ? "Update available"
            : phase === "downloading"
              ? "Downloading update…"
              : phase === "ready"
                ? "Update ready"
                : "Update failed"}
        </Text>
        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
          {phase === "available"
            ? "A new version of TF Business is ready. Update now to get the latest fixes."
            : phase === "downloading"
              ? "Keep the app open while the update downloads."
              : phase === "ready"
                ? "Restart the app to finish installing the update."
                : (error ?? "The update could not be downloaded.")}
        </Text>
      </YStack>

      <XStack items="center" justify="flex-end" gap="$2">
        {phase === "downloading" ? (
          <XStack items="center" gap="$2" flex={1}>
            <Spinner size="small" />
            <Text fontSize="$2" color="$colorSecondary">
              Downloading…
            </Text>
          </XStack>
        ) : null}

        {phase === "available" ? (
          <>
            <Button size="$3" chromeless onPress={dismiss}>
              Later
            </Button>
            <Button
              size="$3"
              bg="$primary"
              color="$background"
              onPress={() => void installOTAUpdate()}
            >
              Update
            </Button>
          </>
        ) : null}

        {phase === "ready" ? (
          <>
            <Button size="$3" chromeless onPress={dismiss}>
              Later
            </Button>
            <Button
              size="$3"
              bg="$primary"
              color="$background"
              onPress={() => void restartForOTAUpdate()}
            >
              Restart now
            </Button>
          </>
        ) : null}

        {phase === "error" ? (
          <>
            <Button size="$3" chromeless onPress={dismiss}>
              Dismiss
            </Button>
            <Button
              size="$3"
              bg="$primary"
              color="$background"
              onPress={() => void installOTAUpdate()}
            >
              Try again
            </Button>
          </>
        ) : null}
      </XStack>
    </Card>
  );
}
