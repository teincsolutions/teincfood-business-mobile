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
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top + 12, 24)}>
      <XStack padding="$4" alignItems="center" gap="$3">
        <BackButton onPress={() => router.back()} />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Local Node
        </Text>
      </XStack>

      <ScrollView>
        <YStack width="100%" maxWidth={600} alignSelf="center" padding="$4" gap="$4">
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
                      <Text fontWeight="bold">Terminals</Text>
                      <Text fontSize="$2" color="$colorMuted">{`${store.discoveredNodes.length} discovered • ${store.connectedClients.length} connected`}</Text>
                    </YStack>
                  </XStack>

                  {(() => {
                    const merged = new Map<string, { deviceId: string; label: string; detail: string; connected: boolean }>();
                    for (const n of store.discoveredNodes) {
                      const id = n.deviceId;
                      const connected = store.connectedClients.some((c) => c.deviceId === id);
                      merged.set(id, { deviceId: id, label: n.deviceName ?? n.host, detail: `${n.host}:${n.port}`, connected });
                    }
                    for (const c of store.connectedClients) {
                      if (!merged.has(c.deviceId)) {
                        merged.set(c.deviceId, { deviceId: c.deviceId, label: c.deviceName ?? c.host ?? c.deviceId, detail: c.host ?? "", connected: true });
                      } else {
                        const e = merged.get(c.deviceId)!;
                        e.connected = true;
                      }
                    }
                    const nodes = [...merged.values()];
                    if (nodes.length === 0) {
                      return (
                        <YStack alignItems="center" padding="$4" gap="$2">
                          <Smartphone color="$colorMuted" />
                          <Text fontSize="$2" color="$colorMuted" textAlign="center">
                            No terminals found. Make sure Local Node is enabled on all devices and they are on the same Wi-Fi network.
                          </Text>
                        </YStack>
                      );
                    }
                    return nodes.map((n) => (
                      <XStack
                        key={n.deviceId}
                        gap="$3"
                        alignItems="center"
                        padding="$3"
                        borderRadius="$3"
                        backgroundColor="$backgroundSoft"
                      >
                        <Smartphone color={n.connected ? "$success" : "$colorMuted"} />
                        <YStack flex={1}>
                          <Text fontSize="$3" fontWeight="bold">{n.label}</Text>
                          {n.detail ? <Text fontSize="$2" color="$colorMuted">{n.detail}</Text> : null}
                        </YStack>
                        <Text fontSize="$2" fontWeight="bold" color={n.connected ? "$success" : "$colorMuted"}>
                          {n.connected ? "Connected" : "Discovered"}
                        </Text>
                      </XStack>
                    ));
                  })()}
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
                {(() => {
                  const listening = localNodeService.isLocalNode();
                  const connected = localNodeService.isConnectedToNode();
                  if (listening && connected) return `Listening on :${store.localNodePort} • Connected to ${store.connectedClients.length} peer(s) • ${store.discoveredNodes.length} discovered.`;
                  if (listening) return `Listening on :${store.localNodePort} for LAN peers. ${store.discoveredNodes.length} discovered.`;
                  if (connected) return `Connected to ${store.connectedClients.length} peer(s).`;
                  return "Scanning for peers...";
                })()}
              </Text>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
