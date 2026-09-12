// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  YStack,
  XStack,
  Text,
  ScrollView,
  Card,
  Separator,
  Switch,
  Input,
} from "tamagui";
import { ChevronLeft, X } from "@tamagui/lucide-icons";
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
  commandQueueService,
  getDebugLogs,
  subscribeDebugLogs,
  clearDebugLogs,
  getAttemptStats,
  type LogEntry,
} from "@teincfood/core";
import { useConnectivityStore, probeCloud } from "@/stores/connectivity.store";
import { useBusinessStore } from "@/stores/business.store";
import { useAuthStore } from "@/stores/auth.store";
import { API_BASE_URL, WS_BASE_URL } from "@/utils/constants";
import { toast } from "sonner-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Badge, Button } from "@/components/ui";

export default function DiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id ?? null);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const isCloudReachable = useConnectivityStore((s) => s.isCloudReachable);
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadStats, setLoadStats] = useState<
    Array<{
      subsystem: string;
      total: number;
      perMin: number;
      lastAt: string | null;
      lastDetail: string | null;
    }>
  >([]);
  const [logLevel, setLogLevel] = useState<string>("all");
  const [logQuery, setLogQuery] = useState("");
  const [outbox, setOutbox] = useState<
    Array<{
      id: string;
      command_type: string;
      status: string;
      retry_count: number;
      error: string | null;
      created_at: string;
    }>
  >([]);

  // Shared core log store (always-on capture installed at bootstrap — same
  // source Desktop Diagnostics reads, not a screen-local buffer).
  useEffect(() => {
    setLogs(getDebugLogs());
    try {
      setLoadStats(getAttemptStats());
    } catch {}
    const id = setInterval(() => {
      try {
        setLoadStats(getAttemptStats());
      } catch {}
    }, 5_000);
    const unsub = subscribeDebugLogs(() => setLogs(getDebugLogs()));
    return () => {
      clearInterval(id);
      unsub();
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    return logs.filter(
      (e) =>
        (logLevel === "all" || e.level === logLevel) &&
        (!q || e.text.toLowerCase().includes(q)),
    );
  }, [logs, logLevel, logQuery]);

  // Update phoenix socket state periodically without full refresh
  const phxTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const update = () =>
      setPhxState(phoenixSocket.getConnectionState?.() ?? "unknown");
    update();
    phxTimerRef.current = setInterval(update, 5_000);
    return () => phxTimerRef.current && clearInterval(phxTimerRef.current);
  }, []);

  const refresh = useCallback(async () => {
    if (!businessId) return;
    try {
      const [p, dump, outboxDump, db] = await Promise.all([
        getSyncJobsPendingCount(businessId),
        debugDumpSyncJobs(businessId),
        commandQueueService.debugDumpCommands(businessId),
        openSyncDatabase(),
      ]);
      setPending(p);
      setJobs(dump.slice(-5).reverse());
      setOutbox(outboxDump.slice(-8).reverse());
      const countRow = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM orders WHERE business_id = ?",
        [businessId],
      );
      setOrdersCount(countRow?.c ?? 0);
      setDeviceNumber(getDeviceNumber(businessId));
      setLastProbe(`refreshed ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      syncLogger.error("Diagnostics", "refresh failed", {
        error: String(error),
      });
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
      else if (!deviceNumber)
        toast.error("Still queued — device has no DD (lease online once)");
      else
        toast.error(`Still queued (${after} pending) — check token/DD/cloud`);
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
      // Single source: shared connectivity-store probe (correct /api/health
      // URL + cooldown + confirmed-unreachable tracking).
      const ok = await probeCloud();
      setLastProbe(`${ok ? "OK" : "unreachable"} in ${Date.now() - started}ms`);
    } catch (error) {
      setLastProbe(
        `failed in ${Date.now() - started}ms: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setProbing(false);
    }
  }, []);

  const handleCopyLogs = useCallback(async () => {
    const text = filteredLogs
      .slice()
      .reverse()
      .map((e) => `${e.ts} [${e.level}] ${e.text}`)
      .join("\n");
    await Clipboard.setStringAsync(text || "(no logs)");
    toast.success(`Copied ${filteredLogs.length} log lines`);
  }, [filteredLogs]);

  const handleShareLogs = useCallback(async () => {
    try {
      const stats = getAttemptStats()
        .map(
          (s) =>
            `${s.subsystem}: total=${s.total} perMin=${s.perMin} last=${s.lastAt ?? "—"} detail=${s.lastDetail ?? "—"}`,
        )
        .join("\n");
      const text =
        `LOAD\n${stats || "(none)"}\n\nLOGS\n` +
        filteredLogs
          .slice()
          .reverse()
          .map((e) => `${e.ts} [${e.level}] ${e.text}`)
          .join("\n");
      const uri = `${FileSystem.cacheDirectory ?? ""}teinc-diagnostics.log`;
      await FileSystem.writeAsStringAsync(uri, text || "(no logs)");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: "Teinc diagnostics log" });
      } else {
        await Clipboard.setStringAsync(uri);
        toast.success("Sharing unavailable — path copied");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Share failed");
    }
  }, [filteredLogs]);

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
              toast.error(
                error instanceof Error ? error.message : "Wipe failed",
              );
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
    () =>
      ({
        label,
        value,
        color,
        badge,
      }: {
        label: string;
        value: string;
        color?: string;
        badge?: boolean;
      }) => (
        <XStack flex={1} justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="$color" fontFamily="$body">
            {label}
          </Text>
          {badge && color ? (
            <XStack
              backgroundColor={color}
              alignItems="center"
              justifyContent="center"
              borderRadius={16}
              px="$1.5"
              py="$.5"
            >
              <Text color="$white" fontSize="$2">
                {value}
              </Text>
            </XStack>
          ) : (
            <Text fontSize="$3" color="$color" fontFamily="$body">
              {value}
            </Text>
          )}
        </XStack>
      ),
    [],
  );

  const onlineColor = isOnline ? "$success" : "$error";
  const cloudColor =
    isCloudReachable === "reachable"
      ? "$success"
      : isCloudReachable === "unreachable"
        ? "$error"
        : "$colorMuted";
  const pendingColor = pending ? "$warning" : "$success";

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
        <Button
          chromeless
          circular
          width={40}
          height={40}
          padding={0}
          pressStyle={{ opacity: 0.7 }}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color="$color" />
        </Button>
        <Text
          fontSize="$6"
          fontWeight="700"
          fontFamily="$heading"
          color="$color"
        >
          Diagnostics
        </Text>
        <Switch
          checked={showLogs}
          onCheckedChange={setShowLogs}
          backgroundColor={showLogs ? "$color.green" : "$colorMuted"}
          size="$6"
        >
          <Switch.Thumb animation="quick" backgroundColor="$white" />
        </Switch>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          Logs
        </Text>
      </XStack>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor="$primary"
          />
        }
      >
        {/* Connection Status */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              CONNECTION
            </Text>
            <StatusRow
              label="Online"
              value={isOnline ? "yes" : "no"}
              badge
              color={onlineColor}
            />
            <StatusRow
              label="Cloud"
              value={isCloudReachable}
              badge
              color={cloudColor}
            />
            <StatusRow
              label="WebSocket"
              value={phxState}
              badge
              color="$colorMuted"
            />
            <StatusRow label="DD" value={deviceNumber ?? "—"} />
            <StatusRow label="Orders cached" value={ordersCount ?? "—"} />
            <StatusRow label="API" value={API_BASE_URL} />
            <StatusRow label="WS" value={WS_BASE_URL} />
          </YStack>
        </Card>

        {/* Sync Jobs */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                SYNC JOBS
              </Text>
              <Badge backgroundColor={pendingColor}>
                <Text color="white" fontSize="$2" fontWeight="700">
                  {pending ?? "—"}
                </Text>
              </Badge>
            </XStack>
            <Separator marginVertical="$2" />
            {jobs.length === 0 ? (
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                (queue is empty)
              </Text>
            ) : (
              jobs.map((j) => (
                <YStack key={j.id} gap="$1">
                  <XStack justifyContent="space-between">
                    <Text fontSize="$2" fontFamily="monospace" color="$color">
                      {j.command_type}@{j.status.slice(0, 4)}
                    </Text>
                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      fontFamily="monospace"
                    >
                      {j.id.slice(0, 8)} · x{j.attempts}
                    </Text>
                  </XStack>
                  {j.last_error ? (
                    <Text
                      fontSize="$1"
                      color="$error"
                      fontFamily="monospace"
                      numberOfLines={2}
                    >
                      {j.last_error.slice(0, 120)}
                    </Text>
                  ) : null}
                </YStack>
              ))
            )}
          </YStack>
        </Card>

        {/* Engine Outbox (commands table — survives restarts) */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                ENGINE OUTBOX
              </Text>
              <Badge backgroundColor={outbox.length ? "warning" : "$success"}>
                <Text color="white" fontSize="$2" fontWeight="700">
                  {outbox.length}
                </Text>
              </Badge>
            </XStack>
            <Separator marginVertical="$2" />
            {outbox.length === 0 ? (
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                (outbox is empty)
              </Text>
            ) : (
              outbox.map((c) => (
                <YStack key={c.id} gap="$1">
                  <XStack justifyContent="space-between">
                    <Text fontSize="$2" fontFamily="monospace" color="$color">
                      {c.command_type}@{c.status.slice(0, 4)}
                    </Text>
                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      fontFamily="monospace"
                    >
                      {c.id.slice(0, 8)} · x{c.retry_count}
                    </Text>
                  </XStack>
                  {c.error ? (
                    <Text
                      fontSize="$1"
                      color="$error"
                      fontFamily="monospace"
                      numberOfLines={2}
                    >
                      {c.error.slice(0, 120)}
                    </Text>
                  ) : null}
                </YStack>
              ))
            )}
          </YStack>
        </Card>

        {/* Load — attempts per subsystem (total + trailing 60s) */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              LOAD (/MIN + TOTAL)
            </Text>
            <Separator marginVertical="$2" />
            {loadStats.length === 0 ? (
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                (no attempts recorded yet)
              </Text>
            ) : (
              loadStats.map((s) => (
                <StatusRow
                  key={s.subsystem}
                  label={s.subsystem.replace("_", " ").toUpperCase()}
                  value={`${s.perMin}/m · ${s.total}`}
                  badge
                  color={
                    s.perMin > 10
                      ? "$error"
                      : s.perMin > 0
                        ? "$warning"
                        : "$colorMuted"
                  }
                />
              ))
            )}
          </YStack>
        </Card>

        {/* Actions */}
        <Card padding="$4" bordered marginBottom="$3">
          <YStack gap="$2">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              ACTIONS
            </Text>
            <Button
              backgroundColor="$primary"
              color="$white"
              disabled={draining || !accessToken || !isOnline}
              onPress={handleSyncNow}
            >
              {draining
                ? "Syncing"
                : `Sync now${pending ? ` (${pending})` : ""}`}
            </Button>
            <Button
              variant="outline"
              disabled={probing}
              onPress={handleProbeCloud}
            >
              {probing ? "Probing" : "Probe Cloud /health"}
            </Button>
            {lastProbe && (
              <Text fontSize="$2" color="$colorSecondary" fontFamily="body">
                last: {lastProbe}
              </Text>
            )}
            <Button variant="outline" onPress={handleLeaseNow}>
              Lease DD now
            </Button>
            <Button variant="outline" onPress={handleClearOffline}>
              Clear Offline Data
            </Button>
            <Button
              variant="danger"
              onPress={handleWipeNewInstall}
              marginTop="$2"
            >
              Wipe for new install
            </Button>
          </YStack>
        </Card>

        {/* Logs — shared core store, same source as Desktop */}
        {showLogs && (
          <Card padding="$4" bordered marginBottom="$3">
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  LOGS ({filteredLogs.length}/{logs.length})
                </Text>
                <XStack gap="$1">
                  <Button
                    height={"$8"}
                    size={"$2"}
                    variant="outline"
                    onPress={handleCopyLogs}
                  >
                    Copy
                  </Button>
                  <Button
                    height={"$8"}
                    size={"$2"}
                    variant="outline"
                    onPress={handleShareLogs}
                  >
                    Share
                  </Button>
                  <Button
                    size={"$2"}
                    height={"$8"}
                    variant="outline"
                    onPress={() => clearDebugLogs()}
                  >
                    Clear
                  </Button>
                </XStack>
              </XStack>
              <XStack gap="$1" flexWrap="wrap">
                {["all", "debug", "info", "warn", "error", "log"].map((l) => (
                  <Button
                    key={l}
                    size="$4"
                    height="$8"
                    variant={logLevel === l ? undefined : "outline"}
                    backgroundColor={logLevel === l ? "$primary" : undefined}
                    color={logLevel === l ? "white" : undefined}
                    onPress={() => setLogLevel(l)}
                  >
                    {l}
                  </Button>
                ))}
              </XStack>
              <Input
                flex={1}
                placeholder="filter logs…"
                value={logQuery}
                onChangeText={setLogQuery}
                autoCapitalize="none"
              />
              {filteredLogs.length === 0 ? (
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  (no logs yet — trigger some sync activity)
                </Text>
              ) : (
                <ScrollView gap="$1" style={{ maxHeight: 300 }}>
                  {filteredLogs.slice(0, 250).map((e) => (
                    <Text
                      key={e.id}
                      fontSize="$1"
                      fontFamily="monospace"
                      color={
                        e.level === "error"
                          ? "$error"
                          : e.level === "warn"
                            ? "$warning"
                            : "$color"
                      }
                      numberOfLines={3}
                    >
                      [{e.level.slice(0, 4)}] {e.text.slice(0, 250)}
                    </Text>
                  ))}
                </ScrollView>
              )}
            </YStack>
          </Card>
        )}

        <Text
          fontSize="$2"
          color="$colorMuted"
          fontFamily="$body"
          marginTop="$4"
          textAlign="center"
        >
          Single source: SQLite orders + sync_jobs. Reconnect triggers FIFO
          drain via local node + cloud transport.
        </Text>
      </ScrollView>
    </YStack>
  );
}
