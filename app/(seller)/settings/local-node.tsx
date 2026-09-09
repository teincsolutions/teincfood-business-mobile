// @ts-nocheck
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Switch, Separator, Spinner } from "tamagui";
import { Server, Wifi, Users, Smartphone, RefreshCw } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppAlertDialog, BackButton } from "@/components/ui";
import { useLocalNodeStore } from "@/stores/local-node.store";
import { localNodeService } from "@/local-node/service";
import { getAppInstanceId, getDeviceDisplayName } from "@/services/devices.service";

export default function LocalNodeSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useLocalNodeStore();
  const thisDeviceId = getAppInstanceId();

  useEffect(() => {
    if (store.isLocalNodeEnabled) {
      localNodeService.initialize().catch(console.error);
    }
  }, [store.isLocalNodeEnabled]);

  const toggleLocalNode = async (enabled: boolean) => {
    store.setIsLocalNodeEnabled(enabled);
    if (!enabled) {
      await localNodeService.shutdown();
    } else {
      localNodeService.initialize().catch(console.error);
    }
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
                size="$6"
                checked={store.isLocalNodeEnabled}
                onCheckedChange={toggleLocalNode}
                backgroundColor={
                  store.isLocalNodeEnabled ? "$success" : "$borderColorHover"
                }
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>

            {store.isLocalNodeEnabled && (
              <XStack gap="$2" alignItems="center" marginTop="$2">
                <Text fontSize="$2" color="$success" fontWeight="bold">
                  Secured
                </Text>
                <Text fontSize="$2" color="$colorMuted">
                  TLS-encrypted with a shared business secret. Only devices signed
                  into this business can connect.
                </Text>
              </XStack>
            )}

            {store.isLocalNodeEnabled && (
              <>
                <Separator marginVertical="$3" />
                <YStack gap="$2">
                  <XStack gap="$3" alignItems="center">
                    <Users color="$primary" />
                    <YStack flex={1}>
                      <Text fontWeight="bold">Discovered Terminals</Text>
                      <Text fontSize="$2" color="$colorMuted">
                        {`${store.discoveredNodes.length} terminal(s) on the network.`}
                      </Text>
                    </YStack>
                  </XStack>

                  {store.discoveredNodes.length === 0 ? (
                    <YStack alignItems="center" padding="$4" gap="$2">
                      <Smartphone color="$colorMuted" />
                      <Text fontSize="$2" color="$colorMuted" textAlign="center">
                        No terminals found. Make sure Local Node is enabled on all devices and they are on the same Wi-Fi network.
                      </Text>
                    </YStack>
                  ) : (
                    store.discoveredNodes.map((node) => {
                      const isConnected = localNodeService.isConnectedToNode() && store.connectedClients.some((c) => c.deviceId === node.deviceId);
                      return (
                        <XStack
                          key={node.deviceId}
                          gap="$3"
                          alignItems="center"
                          padding="$3"
                          borderRadius="$3"
                          backgroundColor="$backgroundSoft"
                        >
                          <Smartphone color={isConnected ? "$success" : "$colorMuted"} />
                          <YStack flex={1}>
                            <Text fontSize="$3" fontWeight="bold">{node.deviceName ?? node.host}</Text>
                            <Text fontSize="$2" color="$colorMuted">{node.host}:{node.port}</Text>
                          </YStack>
                          <Text fontSize="$2" fontWeight="bold" color={isConnected ? "$success" : "$colorMuted"}>
                            {isConnected ? "Connected" : "Discovered"}
                          </Text>
                        </XStack>
                      );
                    })
                  )}
                  <Separator marginVertical="$3" />
                  <XStack gap="$3" alignItems="center">
                    <Users color="$primary" />
                    <YStack flex={1}>
                      <Text fontWeight="bold">Connected Terminals</Text>
                      <Text fontSize="$2" color="$colorMuted">{`${store.connectedClients.length} terminal(s) connected.`}</Text>
                    </YStack>
                  </XStack>
                  {store.connectedClients.length === 0 ? (
                    <YStack alignItems="center" padding="$4" gap="$2">
                      <Smartphone color="$colorMuted" />
                      <Text fontSize="$2" color="$colorMuted" textAlign="center">No terminals connected yet.</Text>
                    </YStack>
                  ) : (
                    store.connectedClients.map((client) => (
                      <XStack key={client.deviceId} gap="$3" alignItems="center" padding="$3" borderRadius="$3" backgroundColor="$backgroundSoft">
                        <Smartphone color="$success" />
                        <YStack flex={1}>
                          <Text fontSize="$3" fontWeight="bold">{client.deviceName ?? client.deviceId}</Text>
                          <Text fontSize="$2" color="$colorMuted">{client.host ?? "LAN client"}</Text>
                        </YStack>
                        <Text fontSize="$2" fontWeight="bold" color="$success">Connected</Text>
                      </XStack>
                    ))
                  )}
                </YStack>
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
              <Text fontWeight="bold" marginBottom="$2">Status</Text>
              <Text fontSize="$2" color="$colorMuted">
                {localNodeService.isLocalNode() ? "Listening for LAN connections." : localNodeService.isConnectedToNode() ? `Connected to ${store.connectedClients.length} peer(s).` : "Scanning for peers..."}
              </Text>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
