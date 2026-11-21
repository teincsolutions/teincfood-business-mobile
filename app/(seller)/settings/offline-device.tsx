// @ts-nocheck
import { useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Spinner, Text, XStack, YStack } from "tamagui";
import { toast } from "sonner-native";
import { ensureLease } from "@teincfood/core";
import { BackButton } from "@/components/ui";
import {
  AlertTriangle,
  MonitorSmartphone,
  Trash2,
} from "@tamagui/lucide-icons";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useMyBusinessCapabilities } from "@/hooks/useMyBusinessCapabilities";
import { useBusinessDevices, type BusinessDevice } from "@/hooks/useBusinessDevices";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { getAppInstanceId } from "@/services/devices.service";

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
  const { data: membership } = useMyBusinessCapabilities();
  // The backend grants business_members_manage to owners/super-admins and
  // managers. Keep role/source fallbacks so a stale capability cache never
  // hides terminal management for an owner or an admin-equivalent manager.
  const canManage = Boolean(
    membership?.capabilities.includes("business_members_manage") ||
      membership?.source === "owner" ||
      membership?.source === "super_admin" ||
      membership?.role === "owner" ||
      membership?.role === "admin" ||
      membership?.role === "manager",
  );
  const currentDeviceUuid = getAppInstanceId();
  const {
    devices,
    loading: devicesLoading,
    error: devicesError,
    reload: loadDevices,
    revoke: revokeDevice,
  } = useBusinessDevices(businessId, canManage);
  const [busy, setBusy] = useState(false);
  const [revokingUuid, setRevokingUuid] = useState<string | null>(null);

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
    const isCurrent = device.device_uuid === currentDeviceUuid;
    Alert.alert(
      `Remove ${deviceLabel(device)}?`,
      isCurrent
        ? "This removes this terminal from the business and clears its local offline license. The plan slot is freed for another device."
        : "This frees its license slot immediately. If the terminal is offline, it keeps working only until its current signed license expires or it reconnects.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove terminal",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setRevokingUuid(device.device_uuid);
              try {
                await revokeDevice(device.device_uuid);

                if (isCurrent) {
                  // Clear this phone's cached DD/PINs after the server revoke;
                  // otherwise it would keep presenting a removed license.
                  try {
                    await removeDevice();
                  } catch (error) {
                    console.debug("[OfflineDevices] local cleanup failed", error);
                  }
                  toast.success(
                    "Terminal removed from this business. The slot is free for another device.",
                  );
                  return;
                }

                let leased: string | null = null;
                try {
                  leased = await ensureLease(businessId);
                } catch (error) {
                  console.debug("[OfflineDevices] lease refresh failed", error);
                  // The slot is still freed; the POS Retry button can lease later.
                }
                toast.success(
                  leased
                    ? `Terminal ${leased} is ready on this device`
                    : "Terminal removed. Return to POS and tap Retry to activate this device.",
                );
              } catch (error) {
                console.debug("[OfflineDevices] revoke failed", error);
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
        <Text
          fontSize="$6"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
        >
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
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
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
                Set or change the optional 6-digit PIN used for quick sign-in
                while offline.
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
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
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
                          device.online && !revoked
                            ? "$green"
                            : "$colorSecondary"
                        }
                      >
                        {revoked ? "Removed" : relativeTime(device.last_seen)}
                      </Text>
                      {!revoked ? (
                        <Button
                          size="$2"
                          chromeless
                          color="$error"
                          icon={
                            revokingUuid === device.device_uuid ? (
                              <Spinner size="small" />
                            ) : (
                              <Trash2 size={16} color="$error" />
                            )
                          }
                          accessibilityLabel={`Remove ${deviceLabel(device)}`}
                          disabled={revokingUuid === device.device_uuid}
                          onPress={() => handleRevoke(device)}
                        />
                      ) : null}
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
                        {new Date(
                          device.license_expires_at,
                        ).toLocaleDateString()}
                      </Text>
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
