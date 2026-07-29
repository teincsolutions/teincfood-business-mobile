// @ts-nocheck
import { useEffect } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Switch, Separator, Spinner } from "tamagui";
import { Server, Wifi, Users } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BackButton } from "@/components/ui";
import { useLocalNodeStore } from "@/stores/local-node.store";
import { localNodeService } from "@/local-node/service";
import { getAppInstanceId } from "@/services/devices.service";

export default function LocalNodeSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useLocalNodeStore();
  const thisDeviceId = getAppInstanceId();
  const isThisNode = store.electedNodeDeviceId === thisDeviceId;

  useEffect(() => {
    if (store.isLocalNodeEnabled) {
      localNodeService.initialize().catch(console.error);
    }
  }, [store.isLocalNodeEnabled, store.electedNodeDeviceId]);

  const toggleLocalNode = async (enabled: boolean) => {
    store.setIsLocalNodeEnabled(enabled);
    if (!enabled) {
      await localNodeService.shutdown();
    }
  };

  const designateThisDevice = () => {
    store.designateThisDevice();
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack padding="$4" alignItems="center" gap="$3">
        <BackButton onPress={() => router.back()} />
        <Text fontSize="$6" fontWeight="bold">
          Local Node
        </Text>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Card padding="$4" bordered>
            <XStack gap="$3" alignItems="center" marginBottom="$3">
              <Server color="$primary" />
              <YStack flex={1}>
                <Text fontWeight="bold">Enable Local Node</Text>
                <Text fontSize="$2" color="$colorMuted">
                  Use this device as the LAN source of truth when internet is unavailable.
                </Text>
              </YStack>
              <Switch
                checked={store.isLocalNodeEnabled}
                onCheckedChange={toggleLocalNode}
              />
            </XStack>

            {store.isLocalNodeEnabled && (
              <>
                <Separator marginVertical="$3" />
                <XStack gap="$3" alignItems="center" marginBottom="$3">
                  <Wifi color="$primary" />
                  <YStack flex={1}>
                    <Text fontWeight="bold">Designate This Device</Text>
                    <Text fontSize="$2" color="$colorMuted">
                      {isThisNode
                        ? "This device is the active Local Node."
                        : "Make this device the Local Node for this location."}
                    </Text>
                  </YStack>
                  <Switch
                    checked={isThisNode}
                    onCheckedChange={(checked) => {
                      if (checked) designateThisDevice();
                      else store.electNode(null);
                    }}
                  />
                </XStack>

                <Separator marginVertical="$3" />
                <XStack gap="$3" alignItems="center">
                  <Users color="$primary" />
                  <YStack flex={1}>
                    <Text fontWeight="bold">Discovered Terminals</Text>
                    <Text fontSize="$2" color="$colorMuted">
                      {store.discoveredNodes.length} terminal(s) on the network.
                    </Text>
                  </YStack>
                </XStack>
              </>
            )}
          </Card>

          <Card padding="$4" bordered>
            <Text fontWeight="bold" marginBottom="$2">
              Device ID
            </Text>
            <Text fontSize="$2" color="$colorMuted" selectable>
              {thisDeviceId}
            </Text>
          </Card>

          {store.isLocalNodeEnabled && (
            <Card padding="$4" bordered>
              <Text fontWeight="bold" marginBottom="$2">
                Status
              </Text>
              <Text fontSize="$2" color="$colorMuted">
                {isThisNode
                  ? localNodeService.isLocalNode()
                    ? "Listening for LAN connections."
                    : "Starting..."
                  : localNodeService.isConnectedToNode()
                    ? "Connected to Local Node."
                    : "Scanning for Local Node..."}
              </Text>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
