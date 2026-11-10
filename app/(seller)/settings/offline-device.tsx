// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Spinner, Text, XStack, YStack } from "tamagui";
import { BackButton } from "@/components/ui";
import {
  AlertTriangle,
  MonitorSmartphone,
  Trash2,
} from "@tamagui/lucide-icons";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { getAppInstanceId } from "@/services/devices.service";
import {
  listBusinessDevices,
  revokeBusinessDevice,
  type BusinessDevice,
} from "@/services/offline-devices.service";

function relativeTime(value: string | null): string {
  if (!value) return "Never seen";
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "Just now";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 2) return "Online now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function deviceLabel(device: BusinessDevice): string {
  return device.device_name || `Terminal ${device.device_number}`;
}

export default function OfflineDeviceSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, hasDevice, members, evaluation, removeDevice } =
    useOfflineAuth();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const canManage = useHasCapability("business_members_manage");
  const currentDeviceUuid = getAppInstanceId();
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState<BusinessDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [revokingUuid, setRevokingUuid] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    if (!businessId || !canManage) return;
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const rows = await listBusinessDevices(businessId);
      setDevices(
        rows.sort((a, b) => {
          if (a.online !== b.online) return a.online ? -1 : 1;
          return (
            Date.parse(b.last_seen ?? "1970-01-01") -
            Date.parse(a.last_seen ?? "1970-01-01")
          );
        }),
      );
    } catch (error) {
      setDevicesError(
        error instanceof Error
          ? error.message
          : "Connect to the internet to manage terminals.",
      );
    } finally {
      setDevicesLoading(false);
    }
  }, [businessId, canManage]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

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
                  error instanceof Error
                    ? error.message
                    : "Try again while online.",
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

  const handleRevoke = (device: BusinessDevice) => {
    if (!businessId) return;
    Alert.alert(
      `Remove ${deviceLabel(device)}?`,
      "This frees its license slot immediately. If the terminal is offline, it keeps working only until its current signed license expires or it reconnects.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove terminal",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setRevokingUuid(device.device_uuid);
              try {
                await revokeBusinessDevice(businessId, device.device_uuid);
                await loadDevices();
              } catch (error) {
                Alert.alert(
                  "Could not remove terminal",
                  error instanceof Error
                    ? error.message
                    : "Try again while online.",
                );
              } finally {
                setRevokingUuid(null);
              }
            })();
          },
        },
      ],
    );
  };

  const activeDevices = devices.filter(
    (device) => device.license_status === "active" && !device.revoked_at,
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Offline device
        </Text>
      </XStack>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          width: "100%",
          maxWidth: 600,
          alignSelf: "center",
        }}
        refreshControl={
          <RefreshControl
            refreshing={devicesLoading}
            onRefresh={() => void loadDevices()}
          />
        }
      >
        <YStack gap="$4">
          <YStack gap="$1">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              The terminal license keeps this device active offline. A 6-digit
              PIN is optional — it is only a quick sign-in when the internet is
              down.
            </Text>
          </YStack>

        <Card padding="$4" bordered gap="$3">
          <XStack gap="$3" items="center">
            <MonitorSmartphone size={28} color="$primary" />
            <YStack flex={1}>
              <Text fontWeight="700" color="$color">
                {loading
                  ? "Checking…"
                  : hasDevice
                    ? "Offline license active"
                    : "Not activated"}
              </Text>
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                {hasDevice
                  ? members.length > 0
                    ? `${members.length} member${members.length === 1 ? "" : "s"} can unlock offline`
                    : "License active · set a PIN for quick offline login"
                  : "Activate while online to enable offline sign-in"}
              </Text>
            </YStack>
          </XStack>

          {evaluation ? (
            <YStack gap="$1">
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                License status:{" "}
                {evaluation.entitled
                  ? "valid"
                  : (evaluation.reason ?? "needs renewal")}
              </Text>
              {evaluation.payload?.expires_at ? (
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  Expires:{" "}
                  {new Date(evaluation.payload.expires_at).toLocaleString()}
                </Text>
              ) : null}
            </YStack>
          ) : null}
        </Card>

        {!loading && !hasDevice ? (
          <Card padding="$4" bordered gap="$3">
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              Offline access was skipped for this terminal. You can enable it
              while online.
            </Text>
            <Button
              bg="$primary"
              color="$background"
              onPress={() => router.push("/(auth)/offline-setup")}
            >
              Activate offline license
            </Button>
          </Card>
        ) : null}

        {!loading && hasDevice ? (
          <Card padding="$4" bordered gap="$3">
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              Set or change the optional 6-digit PIN used for quick sign-in while
              offline.
            </Text>
            <Button
              bg="$primary"
              color="$background"
              onPress={() => router.push("/(auth)/offline-setup")}
            >
              Set or change offline PIN
            </Button>
          </Card>
        ) : null}

        {canManage ? (
          <Card padding="$4" bordered gap="$3">
            <XStack items="center" justify="space-between" gap="$3">
              <YStack flex={1}>
                <Text fontWeight="700" color="$color">
                  Business terminals
                </Text>
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  {activeDevices.length} active license
                  {activeDevices.length === 1 ? "" : "s"} on this plan
                </Text>
              </YStack>
              <Button
                size="$2"
                chromeless
                disabled={devicesLoading}
                onPress={() => void loadDevices()}
              >
                Refresh
              </Button>
            </XStack>

            {devicesError ? (
              <Text fontSize="$2" color="$error" fontFamily="$body">
                {devicesError}
              </Text>
            ) : null}

            {devicesLoading && devices.length === 0 ? (
              <XStack items="center" gap="$2">
                <Spinner size="small" />
                <Text fontSize="$2" color="$colorSecondary">
                  Loading terminals…
                </Text>
              </XStack>
            ) : null}

            {!devicesLoading && !devicesError && devices.length === 0 ? (
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                No terminals have been activated for this business yet.
              </Text>
            ) : null}

            {devices.map((device) => {
              const isCurrent = device.device_uuid === currentDeviceUuid;
              const revoked =
                device.license_status === "revoked" ||
                Boolean(device.revoked_at);
              return (
                <YStack
                  key={device.id}
                  gap="$1"
                  pt="$2"
                  borderTopWidth={1}
                  borderColor="$borderColor"
                >
                  <XStack items="center" justify="space-between" gap="$2">
                    <Text
                      fontWeight="700"
                      color={revoked ? "$colorSecondary" : "$color"}
                      numberOfLines={1}
                      flex={1}
                    >
                      {deviceLabel(device)}
                      {isCurrent ? " · This device" : ""}
                    </Text>
                    <Text
                      fontSize="$1"
                      color={
                        device.online && !revoked ? "$green" : "$colorSecondary"
                      }
                    >
                      {revoked ? "Removed" : relativeTime(device.last_seen)}
                    </Text>
                  </XStack>
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    DD {device.device_number} · {device.platform ?? "unknown"}
                    {device.os_version ? ` ${device.os_version}` : ""} ·{" "}
                    {device.members.length} member
                    {device.members.length === 1 ? "" : "s"}
                  </Text>
                  {device.license_expires_at && !revoked ? (
                    <Text fontSize="$1" color="$colorSecondary">
                      License expires{" "}
                      {new Date(device.license_expires_at).toLocaleDateString()}
                    </Text>
                  ) : null}
                  {!revoked && !isCurrent ? (
                    <Button
                      size="$2"
                      chromeless
                      color="$error"
                      self="flex-start"
                      disabled={revokingUuid === device.device_uuid}
                      onPress={() => handleRevoke(device)}
                    >
                      {revokingUuid === device.device_uuid
                        ? "Removing…"
                        : "Remove terminal"}
                    </Button>
                  ) : null}
                </YStack>
              );
            })}
          </Card>
        ) : null}

        {hasDevice ? (
          <Card padding="$4" bordered gap="$3" borderColor="$error">
            <XStack gap="$2" items="center">
              <AlertTriangle size={18} color="$error" />
              <Text fontWeight="700" color="$error">
                Remove this device
              </Text>
            </XStack>
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              This revokes the license on the server and deletes every offline
              PIN from this terminal. Logout alone keeps the license; this is
              the separate destructive action.
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
      </ScrollView>
    </YStack>
  );
}
