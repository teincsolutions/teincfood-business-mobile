// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Platform } from "react-native";
import { YStack, XStack, Text, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  Package,
  Timer,
  Zap,
  Play,
  Square,
  ChevronRight,
  CheckCircle,
} from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
// Android
import {
  showProgressNotification,
  dismissProgressNotification,
  showChronometerNotification,
  dismissChronometerNotification,
  showActionNotification,
  dismissActionNotification,
  onActionPress,
  offActionPress,
  dismissAllDemoNotifications,
} from "@/services/android-live-notification-demo.service";
// iOS
import {
  startLiveActivity,
  updateLiveActivity,
  endLiveActivity,
  isLiveActivitySupported,
} from "@/services/ios-live-activities.service";

const ORDER_STATUSES = [
  { key: "confirmed", label: "Confirmed", percent: 25 },
  { key: "preparing", label: "Preparing", percent: 50 },
  { key: "on_the_way", label: "On The Way", percent: 75 },
  { key: "delivered", label: "Delivered", percent: 100 },
];

const DEMO_ORDER = {
  id: "demo-order-001",
  orderNumber: "TF-20260331",
  customerName: "Kwame Mensah",
  restaurantName: "Teinc Kitchen",
  total: "GHS 85.50",
};

export default function LiveNotificationDemoScreen() {
  const insets = useSafeAreaInsets();

  // ─── Progress State ─────────────────────────────────────────────────────
  const [progressActive, setProgressActive] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressActivityId, setProgressActivityId] = useState<string | null>(null);

  // ─── Chronometer State ──────────────────────────────────────────────────
  const [chronoActive, setChronoActive] = useState(false);
  const [chronoActivityId, setChronoActivityId] = useState<string | null>(null);

  // ─── Action State ───────────────────────────────────────────────────────
  const [actionActive, setActionActive] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [actionActivityId, setActionActivityId] = useState<string | null>(null);

  // ─── iOS Support ────────────────────────────────────────────────────────
  const [iosSupported, setIosSupported] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'ios') {
      isLiveActivitySupported().then(setIosSupported);
    }
  }, []);

  // ─── Action Button Handler ──────────────────────────────────────────────
  useEffect(() => {
    onActionPress((actionId, orderId) => {
      if (actionId === "accept_order") {
        setActionResult("✅ Order Accepted!");
      } else if (actionId === "decline_order") {
        setActionResult("❌ Order Declined");
      } else {
        setActionResult(`Action: ${actionId}`);
      }
      setActionActive(false);
    });

    return () => {
      offActionPress();
    };
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (Platform.OS === 'android') {
        dismissAllDemoNotifications();
      }
    };
  }, []);

  // ─── Progress Handlers ──────────────────────────────────────────────────
  const handleStartProgress = useCallback(async () => {
    setProgressStep(0);
    setProgressActive(true);
    const config = {
      orderId: DEMO_ORDER.id,
      orderNumber: DEMO_ORDER.orderNumber,
      restaurantName: DEMO_ORDER.restaurantName,
      total: DEMO_ORDER.total,
      status: ORDER_STATUSES[0].key,
      progressPercent: ORDER_STATUSES[0].percent,
      etaText: "Calculating...",
    };
    if (Platform.OS === 'android') {
      await showProgressNotification(config);
    } else if (Platform.OS === 'ios') {
      const id = await startLiveActivity(config);
      setProgressActivityId(id);
    }
  }, []);

  const handleAdvanceProgress = useCallback(async () => {
    const nextStep = progressStep + 1;
    const status = ORDER_STATUSES[nextStep];
    const config = {
      orderId: DEMO_ORDER.id,
      orderNumber: DEMO_ORDER.orderNumber,
      restaurantName: DEMO_ORDER.restaurantName,
      total: DEMO_ORDER.total,
      status: status.key,
      progressPercent: status.percent,
      etaText: status.key === 'delivered' ? 'Delivered!' : `${Math.ceil((100 - status.percent) / 10)} min`,
    };
    if (Platform.OS === 'android') {
      await showProgressNotification(config);
    } else if (Platform.OS === 'ios' && progressActivityId) {
      await updateLiveActivity(progressActivityId, config);
    }
    if (nextStep >= ORDER_STATUSES.length) {
      setTimeout(() => {
        if (Platform.OS === 'android') {
          dismissProgressNotification(DEMO_ORDER.id);
        } else if (Platform.OS === 'ios' && progressActivityId) {
          endLiveActivity(progressActivityId, config);
          setProgressActivityId(null);
        }
        setProgressActive(false);
        setProgressStep(0);
      }, 2000);
    }
    setProgressStep(nextStep);
  }, [progressStep, progressActivityId]);

  const handleStopProgress = useCallback(async () => {
    const config = {
      orderId: DEMO_ORDER.id,
      orderNumber: DEMO_ORDER.orderNumber,
      restaurantName: DEMO_ORDER.restaurantName,
      total: DEMO_ORDER.total,
      status: ORDER_STATUSES[progressStep]?.key || 'confirmed',
      progressPercent: ORDER_STATUSES[progressStep]?.percent || 25,
      etaText: "Cancelled",
    };
    if (Platform.OS === 'android') {
      await dismissProgressNotification(DEMO_ORDER.id);
    } else if (Platform.OS === 'ios' && progressActivityId) {
      await endLiveActivity(progressActivityId, config);
      setProgressActivityId(null);
    }
    setProgressActive(false);
    setProgressStep(0);
  }, [progressStep, progressActivityId]);

  // ─── Chronometer Handlers ───────────────────────────────────────────────
  const handleStartChrono = useCallback(async () => {
    setChronoActive(true);
    const config = {
      orderId: "demo-order-chrono",
      orderNumber: DEMO_ORDER.orderNumber,
      restaurantName: DEMO_ORDER.restaurantName,
      total: DEMO_ORDER.total,
      status: "on_the_way",
      progressPercent: 75,
      etaText: "05:00",
    };
    if (Platform.OS === 'android') {
      await showChronometerNotification({
        orderId: "demo-order-chrono",
        orderNumber: DEMO_ORDER.orderNumber,
        etaSeconds: 300,
      });
    } else if (Platform.OS === 'ios') {
      const id = await startLiveActivity(config);
      setChronoActivityId(id);
    }
  }, []);

  const handleStopChrono = useCallback(async () => {
    const config = {
      orderId: "demo-order-chrono",
      orderNumber: DEMO_ORDER.orderNumber,
      restaurantName: DEMO_ORDER.restaurantName,
      total: DEMO_ORDER.total,
      status: "cancelled",
      progressPercent: 0,
      etaText: "Cancelled",
    };
    if (Platform.OS === 'android') {
      await dismissChronometerNotification("demo-order-chrono");
    } else if (Platform.OS === 'ios' && chronoActivityId) {
      await endLiveActivity(chronoActivityId, config);
      setChronoActivityId(null);
    }
    setChronoActive(false);
  }, [chronoActivityId]);

  // ─── Action Handlers ────────────────────────────────────────────────────
  const handleShowAction = useCallback(async () => {
    setActionResult(null);
    setActionActive(true);
    const config = {
      orderId: "demo-order-action",
      orderNumber: DEMO_ORDER.orderNumber,
      restaurantName: DEMO_ORDER.restaurantName,
      total: DEMO_ORDER.total,
      customerName: DEMO_ORDER.customerName,
      status: "confirmed",
      progressPercent: 25,
      etaText: "Tap Lock Screen to view",
    };
    if (Platform.OS === 'android') {
      await showActionNotification(config);
    } else if (Platform.OS === 'ios') {
      const id = await startLiveActivity(config);
      setActionActivityId(id);
    }
  }, []);

  const handleDismissAction = useCallback(async () => {
    const config = {
      orderId: "demo-order-action",
      orderNumber: DEMO_ORDER.orderNumber,
      restaurantName: DEMO_ORDER.restaurantName,
      total: DEMO_ORDER.total,
      status: "cancelled",
      progressPercent: 0,
      etaText: "Cancelled",
    };
    if (Platform.OS === 'android') {
      await dismissActionNotification("demo-order-action");
    } else if (Platform.OS === 'ios' && actionActivityId) {
      await endLiveActivity(actionActivityId, config);
      setActionActivityId(null);
    }
    setActionActive(false);
  }, [actionActivityId]);

  // ─── Render ─────────────────────────────────────────────────────────────
  const isIOS = Platform.OS === "ios";
  const platformLabel = isIOS ? "iOS Live Activity" : "Android Notification";

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <YStack gap="$6" padding="$5">
          {/* Header */}
          <YStack gap="$2">
            <Text
              fontSize="$8"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              {isIOS ? "Live Activities Demo" : "Live Notifications Demo"}
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
            >
              {isIOS
                ? "Test iOS Live Activities on Lock Screen and Dynamic Island. Check your Lock Screen after starting!"
                : "Test Android rich notifications with progress bars, timers, and action buttons. Pull down your notification shade to see them!"}
            </Text>
            {isIOS && !iosSupported && (
              <YStack backgroundColor="$orangeMuted" borderRadius="$3" padding="$3" marginTop="$2">
                <Text fontSize="$3" color="$starOrange" fontWeight="600">
                  ⚠️ Live Activities may not be enabled on this device. Go to Settings → Face ID & Passcode → Live Activities.
                </Text>
              </YStack>
            )}
          </YStack>

          {/* ═══════════════════════════════════════════════════════════════
              1. PROGRESS BAR NOTIFICATION
              ═══════════════════════════════════════════════════════════════ */}
          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Package size={20} color="$primary" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Progress Bar
              </Text>
            </XStack>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Shows a determinate progress bar that advances through order
              stages: Confirmed → Preparing → On The Way → Delivered.
            </Text>

            <YStack
              backgroundColor="$backgroundStrong"
              borderRadius="$5"
              padding="$4"
              gap="$3"
            >
              {/* Current Status */}
              {progressActive ? (
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="$4" fontWeight="600" color="$color">
                      {ORDER_STATUSES[progressStep]?.label || "Completed"}
                    </Text>
                    <Text fontSize="$3" color="$primary" fontWeight="700">
                      {ORDER_STATUSES[progressStep]?.percent || 100}%
                    </Text>
                  </XStack>
                  {/* Visual progress bar */}
                  <YStack
                    height={8}
                    backgroundColor="$gray300"
                    borderRadius="$full"
                    overflow="hidden"
                  >
                    <YStack
                      height="100%"
                      width={`${ORDER_STATUSES[progressStep]?.percent || 100}%`}
                      backgroundColor="$primary"
                      borderRadius="$full"
                    />
                  </YStack>
                </YStack>
              ) : (
                <Text fontSize="$3" color="$colorSecondary" fontStyle="italic">
                  Tap "Start" to trigger the notification
                </Text>
              )}

              {/* Controls */}
              <XStack gap="$2">
                {!progressActive ? (
                  <Button
                    variant="primary"
                    flex={1}
                    height={44}
                    icon={<Play size={16} color="$white" />}
                    onPress={handleStartProgress}
                  >
                    <Text fontSize="$3" fontWeight="700" color="$white">
                      Start
                    </Text>
                  </Button>
                ) : (
                  <>
                    {progressStep < ORDER_STATUSES.length - 1 ? (
                      <Button
                        variant="primary"
                        flex={1}
                        height={44}
                        icon={<ChevronRight size={16} color="$white" />}
                        onPress={handleAdvanceProgress}
                      >
                        <Text fontSize="$3" fontWeight="700" color="$white">
                          Next Stage
                        </Text>
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        flex={1}
                        height={44}
                        icon={<CheckCircle size={16} color="$white" />}
                        disabled
                      >
                        <Text fontSize="$3" fontWeight="700" color="$white">
                          Delivered!
                        </Text>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      width={44}
                      height={44}
                      minWidth={44}
                      icon={<Square size={16} color="$red" />}
                      onPress={handleStopProgress}
                    />
                  </>
                )}
              </XStack>
            </YStack>
          </YStack>

          <Separator borderColor="$borderColor" />

          {/* ═══════════════════════════════════════════════════════════════
              2. CHRONOMETER (COUNTDOWN) NOTIFICATION
              ═══════════════════════════════════════════════════════════════ */}
          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Timer size={20} color="$primary" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Countdown Timer
              </Text>
            </XStack>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Shows a notification with a live countdown timer (5 minutes).
              The timer ticks down automatically in the notification shade.
            </Text>

            <YStack
              backgroundColor="$backgroundStrong"
              borderRadius="$5"
              padding="$4"
              gap="$3"
            >
              {chronoActive ? (
                <XStack justifyContent="center" alignItems="center" gap="$2">
                  <Timer size={16} color="$primary" />
                  <Text fontSize="$6" fontWeight="800" color="$primary">
                    05:00
                  </Text>
                  <Text fontSize="$3" color="$colorSecondary">
                    counting down...
                  </Text>
                </XStack>
              ) : (
                <Text fontSize="$3" color="$colorSecondary" fontStyle="italic">
                  Tap "Start" to trigger a 5-minute countdown notification
                </Text>
              )}

              <XStack gap="$2">
                {!chronoActive ? (
                  <Button
                    variant="primary"
                    flex={1}
                    height={44}
                    icon={<Play size={16} color="$white" />}
                    onPress={handleStartChrono}
                  >
                    <Text fontSize="$3" fontWeight="700" color="$white">
                      Start Timer
                    </Text>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    flex={1}
                    height={44}
                    icon={<Square size={16} color="$red" />}
                    onPress={handleStopChrono}
                  >
                    <Text fontSize="$3" fontWeight="700" color="$red">
                      Stop Timer
                    </Text>
                  </Button>
                )}
              </XStack>
            </YStack>
          </YStack>

          <Separator borderColor="$borderColor" />

          {/* ═══════════════════════════════════════════════════════════════
              3. ACTION BUTTON NOTIFICATION
              ═══════════════════════════════════════════════════════════════ */}
          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Zap size={20} color="$primary" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Action Buttons
              </Text>
            </XStack>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Shows a notification with "Accept Order" and "Decline" buttons.
              Tap them directly from the notification shade — the result
              appears here.
            </Text>

            <YStack
              backgroundColor="$backgroundStrong"
              borderRadius="$5"
              padding="$4"
              gap="$3"
            >
              {/* Result */}
              {actionResult ? (
                <YStack
                  backgroundColor="$greenMuted"
                  borderRadius="$3"
                  padding="$3"
                >
                  <Text
                    fontSize="$4"
                    fontWeight="700"
                    color="$green"
                    textAlign="center"
                  >
                    {actionResult}
                  </Text>
                </YStack>
              ) : actionActive ? (
                <XStack justifyContent="center" alignItems="center" gap="$2">
                  <Bell size={16} color="$primary" />
                  <Text fontSize="$3" color="$colorSecondary" fontStyle="italic">
                    Waiting for action from notification...
                  </Text>
                </XStack>
              ) : (
                <Text fontSize="$3" color="$colorSecondary" fontStyle="italic">
                  Tap "Show" to trigger the action notification
                </Text>
              )}

              {/* Order Details Preview */}
              <YStack gap="$1" paddingVertical="$2">
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" color="$colorSecondary">Order:</Text>
                  <Text fontSize="$3" fontWeight="600" color="$color">
                    #{DEMO_ORDER.orderNumber}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" color="$colorSecondary">Customer:</Text>
                  <Text fontSize="$3" fontWeight="600" color="$color">
                    {DEMO_ORDER.customerName}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" color="$colorSecondary">Restaurant:</Text>
                  <Text fontSize="$3" fontWeight="600" color="$color">
                    {DEMO_ORDER.restaurantName}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" color="$colorSecondary">Total:</Text>
                  <Text fontSize="$3" fontWeight="700" color="$primary">
                    {DEMO_ORDER.total}
                  </Text>
                </XStack>
              </YStack>

              {/* Controls */}
              <XStack gap="$2">
                {!actionActive ? (
                  <Button
                    variant="primary"
                    flex={1}
                    height={44}
                    icon={<Zap size={16} color="$white" />}
                    onPress={handleShowAction}
                  >
                    <Text fontSize="$3" fontWeight="700" color="$white">
                      Show Notification
                    </Text>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    flex={1}
                    height={44}
                    icon={<Square size={16} color="$red" />}
                    onPress={handleDismissAction}
                  >
                    <Text fontSize="$3" fontWeight="700" color="$red">
                      Dismiss
                    </Text>
                  </Button>
                )}
              </XStack>
            </YStack>
          </YStack>

          <Separator borderColor="$borderColor" />

          {/* Footer */}
          <YStack gap="$2" alignItems="center" paddingVertical="$4">
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              {isIOS
                ? "Powered by ActivityKit (iOS 16.1+)"
                : "Powered by @notifee/react-native"}
            </Text>
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              {isIOS
                ? "Check Lock Screen or Dynamic Island to see Live Activities"
                : "Pull down notification shade to see live notifications"}
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
