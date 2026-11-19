// @ts-nocheck
import { useRouter } from "expo-router";
import { YStack, XStack, Text } from "tamagui";
import { AlertTriangle } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import type { PosTerminalStatus } from "@/hooks/usePosTerminalStatus";

export function PosTerminalBanner({
  status,
  compact = false,
}: {
  status: PosTerminalStatus;
  compact?: boolean;
}) {
  const router = useRouter();
  const canManage = useHasCapability("business_members_manage");

  if (!status.blocked) return null;

  return (
    <YStack
      gap={compact ? "$1" : "$2"}
      padding={compact ? "$2" : "$3"}
      backgroundColor="$error2"
      borderWidth={1}
      borderColor="$error"
      borderRadius="$4"
    >
      <XStack gap="$2" alignItems="center">
        <AlertTriangle size={compact ? 16 : 18} color="$error" />
        <Text
          flex={1}
          fontSize={compact ? "$3" : "$4"}
          fontWeight="700"
          fontFamily="$heading"
          color="$error"
        >
          {status.title}
        </Text>
      </XStack>
      <Text fontSize={compact ? "$2" : "$3"} color="$color" fontFamily="$body">
        {status.message}
      </Text>
      <XStack gap="$2" flexWrap="wrap">
        {status.reason === "terminal_limit" ||
        status.reason === "missing_lease" ? (
          canManage ? (
            <Button
              size="$3"
              variant="outline"
              height={compact ? 34 : 38}
              onPress={() =>
                router.push("/(seller)/settings/offline-device" as never)
              }
            >
              Manage terminals
            </Button>
          ) : null
        ) : null}
        <Button
          size="$3"
          variant="ghost"
          height={compact ? 34 : 38}
          loading={status.checking}
          onPress={() => void status.retry()}
        >
          {status.checking ? "Checking..." : "Retry"}
        </Button>
      </XStack>
    </YStack>
  );
}
