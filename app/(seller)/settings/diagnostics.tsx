// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Switch,
} from "tamagui";
import { Badge } from "@/components/ui/Badge";
import {
  getSyncJobsPendingCount,
  debugDumpSyncJobs,
  drainPending,
  openSyncDatabase,
  wipeForNewInstall,
  clearAllSyncData,
  getDeviceNumber,
  phoenixSocket,
  syncLogger,
  ensureDeviceLease,
} from "@teincfood/core";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { useBusinessStore } from "@/stores/business.store";
import { useAuthStore } from "@/stores/auth.store";
import { API_BASE_URL } from "@/utils/constants";
import { toast } from "sonner-native";
import { router } from "expo-router";

// Simple in-memory log buffer for the Diagnostics screen
const logBuffer: string[] = [];
function pushLog(level: string, context: string, message: string, meta?: Record<string, unknown>) {
  const line = `[${level.toUpperCase()}] ${context}: ${message}${meta ? " " + JSON.stringify(meta) : ""}`;
  logBuffer.unshift(line);
  if (logBuffer.length > 200) logBuffer.pop();
}

export default function DiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id ?? null);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const isCloudReachable = useConnectivityStore((s) => s.isCloudReachable);
  const setCloudReachable = useConnectivityStore((s) => s.setCloudReachable);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [pending, setPending] = useState<number | null>(null);
  const [jobs, setJobs] = useState<
    Array<{
      id: string;
      command_type: string;
      status: string;
      created_at: string;
      attempts: number;
      last_error: string | null;
    }>
  >([]);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [deviceNumber, setDeviceNumber] = useState<string | null>(null);
  const [draining, setDraining] = useState(false);
  const [probing, setProbing] = useState(false);
  const [lastProbe, setLastProbe] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [phxState, setPhxState] = useState<string>("unknown");
  const [logs, setLogs] = useState<string[]>([]);

  // Wire core syncLogger to our buffer (debug builds only)
  useEffect(() => {
    const orig = { debug: syncLogger.debug, info: syncLogger.info, warn: syncLogger.warn, error: syncLogger.error };
    syncLogger.debug = (ctx, msg, meta) => { pushLog("debug", ctx, msg, meta); orig.debug(ctx, msg, meta); };
    syncLogger.info = (ctx, msg, meta) => { pushLog("info", ctx, msg, meta); orig.info(ctx, msg, meta); };
    syncLogger.warn = (ctx, msg, meta) => { pushLog("warn", ctx, msg, meta); orig.warn(ctx, msg, meta); };
    syncLogger.error = (ctx, msg, meta) => { pushLog("error", ctx, msg, meta); orig.error(ctx, msg, meta); };
    return () => { Object.assign(syncLogger, orig); };
  }, []);

  // Keep logs in sync with buffer
  useEffect(() => {
    const id = setInterval(() => setLogs([...logBuffer]), 1_000);
    return () => clearInterval(id);
  }, []);

  // Update phoenix socket state periodically without full refresh
  const phxTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const update = () => setPhxState(phoenixSocket.getConnectionState?.() ?? "unknown");
    update();
    phxTimerRef.current = setInterval(update, 5_000);
    return () => phxTimerRef.current && clearInterval(phxTimerRef.current);
  }, []);

  const refresh = useCallback(async () => {
    if (!businessId) return;
    try {
      const [p, dump, db] = await Promise.all([
        getSyncJobsPendingCount(businessId),
        debugDumpSyncJobs(businessId),
        openSyncDatabase(),
      ]);
      setPending(p);
      setJobs(dump.slice(-5).reverse());
      const countRow = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM orders WHERE business_id = ?",
        [businessId],
      );
      setOrdersCount(countRow?.c ?? 0);
      setDeviceNumber(getDeviceNumber(businessId));
      setLastProbe(`refreshed ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      syncLogger.error("Diagnostics", "refresh failed", { error: String(error) });
    }
  }, [businessId]);

  // Initial load only
  useEffect(() => {
    void refresh();
  }, [refresh, businessId]);

  const handleSyncNow = useCallback(async () => {
    if (!businessId) return;
    if (!accessToken) {
      toast.error("Not signed in");
      return;
    }
    if (!isOnline) {
      toast.error("Device is offline");
      return;
    }
    setDraining(true);
    try {
      await drainPending(businessId);
      await refresh();
      const after = await getSyncJobsPendingCount(businessId);
      if (after === 0) toast.success("All queued orders synced");
      else if (!deviceNumber) toast.error("Still queued — device has no DD (lease online once)");
      else toast.error(`Still queued (${after} pending) — check token/DD/cloud`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setDraining(false);
    }
  }, [businessId, accessToken, isOnline, refresh, deviceNumber]);

  const handleProbeCloud = useCallback(async () => {
    setProbing(true);
    const started = Date.now();
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/health`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4_000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const ok = res.ok;
      setCloudReachable(ok ? "reachable" : "unreachable");
      setLastProbe(`${ok ? "OK" : res.status} in ${Date.now() - started}ms`);
    } catch (error) {
      setCloudReachable("unreachable");
      setLastProbe(`failed in ${Date.now() - started}ms: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProbing(false);
    }
  }, [setCloudReachable]);

  const handleClearOffline = useCallback(async () => {
    if (!businessId) return;
    Alert.alert(
      "Clear Offline Data",
      "Removes all queued sync jobs, snapshots, and cached orders for this business. Reference data is preserved. You will stay signed in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const db = await openSyncDatabase();
            await clearAllSyncData(db);
            await refresh();
            toast.success("Offline data cleared");
          },
        },
      ],
    );
  }, [businessId, refresh]);

  const handleWipeNewInstall = useCallback(() => {
    Alert.alert(
      "Wipe for new install",
      "Removes EVERYTHING (orders, references, DD lease, queue). The app will sign you out and reload.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await openSyncDatabase();
              await wipeForNewInstall(db);
              toast.success("Wiped — reloading");
              setTimeout(() => {
                useAuthStore.getState().signOut?.();
                router.replace("/(auth)/login");
              }, 800);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Wipe failed");
            }
          },
        },
      ],
    );
  }, [router]);

  const handleLeaseNow = useCallback(async () => {
    if (!businessId) return;
    try {
      const dd = await ensureDeviceLease(businessId);
      if (dd) toast.success(`Leased DD ${dd}`);
      else toast.error("Lease failed (offline or limit reached)");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lease failed");
    }
  }, [businessId, refresh]);

  const StatusRow = useMemo(
    () => ({ label, value, color, badge }: { label: string; value: string; color?: string; badge?: boolean }) => (
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$3" color="$color" fontFamily="$body">{label}</Text>
        {badge && color ? (
          <Badge backgroundColor={color}>
            <Text color="white" fontSize="$2">{value}</Text>
          </Badge>
        ) : (
          <Text fontSize="$3" color="$color" fontFamily="$body">{value}</Text>
        )}
      </XStack>
    ),
    []
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingTop={insets.top + 12}
        paddingHorizontal="$5"
        paddingBottom="$4"
        alignItems="center"
        gap="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Text fontSize="$6" fontWeight="700" fontFamily="$heading" color="$color">Diagnostics</Text>
        <Switch
          checked={showLogs}
          onCheckedChange={setShowLogs}
          backgroundColor={showLogs ? "$green9" : "$gray8"}
          size="$4"
        >
          <Switch.Thumb animation="quick" backgroundColor="$white" />
        </Switch>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Logs</Text>
      </XStack>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor="$primary" />
        }
      >
        {/* Connection Status */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">CONNECTION</Text>
            <StatusRow label="Online" value={isOnline ? "yes" : "no"} badge color={isOnline ? "$green9" : "$red9"} />
            <StatusRow
              label="Cloud"
              value={isCloudReachable}
              badge
              color={
                isCloudReachable === "reachable" ? "$green9" : isCloudReachable === "unreachable" ? "$red9" : "$gray8"
              }
            />
            <StatusRow label="WebSocket" value={phxState} badge color="$gray8" />
            <StatusRow label="DD" value={deviceNumber ?? "—"} />
            <StatusRow label="Orders cached" value={ordersCount ?? "—"} />
          </YStack>
        </Card>

        {/* Sync Jobs */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">SYNC JOBS</Text>
              <Badge backgroundColor={pending ? "$orange9" : "$green9"}>
                <Text color="white" fontSize="$2" fontWeight="700">{pending ?? "—"}</Text>
              </Badge>
            </XStack>
            <Separator marginVertical="$2" />
            {jobs.length === 0 ? (
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">(queue is empty)</Text>
            ) : (
              jobs.map((j) => (
                <YStack key={j.id} gap="$1">
                  <XStack justifyContent="space-between">
                    <Text fontSize="$2" fontFamily="monospace" color="$color">
                      {j.command_type}@{j.status.slice(0, 4)}
                    </Text>
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="monospace">
                      {j.id.slice(0, 8)} · x{j.attempts}
                    </Text>
                  </XStack>
                  {j.last_error ? (
                    <Text fontSize="$1" color="$red10" fontFamily="monospace" numberOfLines={2}>
                      {j.last_error.slice(0, 120)}
                    </Text>
                  ) : null}
                </YStack>
              ))
            )}
          </YStack>
        </Card>

        {/* Actions */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">ACTIONS</Text>
            <Button backgroundColor="$primary" color="white" disabled={draining || !accessToken || !isOnline} onPress={handleSyncNow}>
              {draining ? "Syncing" : `Sync now${pending ? ` (${pending})` : ""}`}
            </Button>
            <Button variant="outline" disabled={probing} onPress={handleProbeCloud}>
              {probing ? "Probing" : "Probe Cloud /health"}
            </Button>
            {lastProbe && <Text fontSize="$2" color="$colorSecondary" fontFamily="body">last: {lastProbe}</Text>}
            <Button variant="outline" onPress={handleLeaseNow}>Lease DD now</Button>
            <Button variant="outline" onPress={handleClearOffline}>Clear Offline Data</Button>
            <Button variant="danger" onPress={handleWipeNewInstall} marginTop="$2">Wipe for new install</Button>
          </YStack>
        </Card>

        {/* Logs */}
        {showLogs && (
          <Card padding="$4" bordered marginBottom="$3">
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">LOGS (latest 200)</Text>
                <Button size="$2" variant="outline" onPress={() => { logBuffer.length = 0; setLogs([]); }}>Clear</Button>
              </XStack>
              {logs.length === 0 ? (
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">(no logs yet — trigger some sync activity)</Text>
              ) : (
                <YStack gap="$1" style={{ maxHeight: 300 }}>
                  {logs.map((line, i) => (
                    <Text key={i} fontSize="$1" fontFamily="monospace" color="$color" numberOfLines={1}>
                      {line}
                    </Text>
                  ))}
                </YStack>
              )}
            </YStack>
          </Card>
        )}

        <Text fontSize="$2" color="$colorMuted" fontFamily="$body" marginTop="$4" textAlign="center">
          Single source: SQLite orders + sync_jobs. Reconnect triggers FIFO drain via local node + cloud transport.
        </Text>
      </ScrollView>
    </YStack>
  );
}