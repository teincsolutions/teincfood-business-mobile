// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Spinner,
  ScrollView,
} from "tamagui";
import {
  Timer,
  Utensils,
  CheckCircle,
  LogOut,
} from "@tamagui/lucide-icons";
import { usePOSOrdersQuery, POS_KEYS } from "@/hooks/pos.hooks";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useDisplayStore } from "@/stores/display.store";
import { useSecurityStore } from "@/stores/security.store";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import { CalloutCard } from "@/components/pos/CalloutCard";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Text fontSize="$4" fontWeight="600" fontFamily="$heading" color="$color">
      {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </Text>
  );
}

function StatusColumn({
  label,
  color,
  icon: Icon,
  orders,
}: {
  label: string;
  color: string;
  icon: any;
  orders: any[];
}) {
  return (
    <YStack flex={1} minWidth={200} gap="$1.5">
      <XStack gap="$1" alignItems="center" justifyContent="center">
        <Icon size={18} color={color} />
        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color={color}>
          {label}
        </Text>
        <YStack backgroundColor={color} borderRadius="$full" px="$2" py="$0.5">
          <Text color="white" fontSize="$2" fontWeight="700">
            {orders.length}
          </Text>
        </YStack>
      </XStack>

      {orders.length === 0 ? (
        <Card padding="$2" backgroundColor="$backgroundStrong" borderRadius="$3" alignItems="center" justifyContent="center" minHeight={60}>
          <CheckCircle size={18} color="$gray200" />
          <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" marginTop="$1">
            None
          </Text>
        </Card>
      ) : (
        <XStack flexWrap="wrap" gap="$1">
          {orders.map((order) => (
            <YStack key={order.id} width="49%">
              <CalloutCard order={order} />
            </YStack>
          ))}
        </XStack>
      )}
    </YStack>
  );
}

export default function CalloutDisplay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBusiness } = useActiveBusiness();
  const securityStore = useSecurityStore();
  const [exiting, setExiting] = useState(false);

  useKeepAwake();
  useOrderRealtimeUpdates(POS_KEYS.all);

  const { data: orders } = usePOSOrdersQuery(undefined, true);
  const orderList = orders ?? [];

  const pendingOrders = useMemo(
    () => orderList.filter((o) => o.status === "pending" || o.status === "accepted"),
    [orderList],
  );
  const preparingOrders = useMemo(
    () => orderList.filter((o) => o.status === "preparing"),
    [orderList],
  );
  const readyOrders = useMemo(
    () => orderList.filter((o) => o.status === "ready"),
    [orderList],
  );

  const handleExit = useCallback(async () => {
    if (!securityStore.isBiometricEnabled) {
      deactivateKeepAwake();
      useDisplayStore.getState().disableCalloutDisplay();
      router.replace("/(seller)/(drawer)");
      return;
    }
    setExiting(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify identity to exit Display Mode",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        deactivateKeepAwake();
        useDisplayStore.getState().disableCalloutDisplay();
        router.replace("/(seller)/(drawer)");
      }
    } catch (err) {
      console.error("Biometric auth error:", err);
    } finally {
      setExiting(false);
    }
  }, [securityStore.isBiometricEnabled, router]);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <YStack>
          <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
            {activeBusiness?.name || "Order Display"}
          </Text>
        </YStack>
        <XStack gap="$3" alignItems="center">
          <LiveClock />
          <Button
            chromeless
            circular
            width={36}
            height={36}
            padding={0}
            pressStyle={{ opacity: 0.6 }}
            disabled={exiting}
            onPress={handleExit}
          >
            {exiting ? <Spinner size="small" /> : <LogOut size={18} color="$colorSecondary" />}
          </Button>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <XStack padding="$3" gap="$3" alignItems="flex-start">
          <StatusColumn
            label="Pending"
            color="$orange10"
            icon={Timer}
            orders={pendingOrders}
          />
          <StatusColumn
            label="Preparing"
            color="$blue10"
            icon={Utensils}
            orders={preparingOrders}
          />
          <StatusColumn
            label="Ready"
            color="$green10"
            icon={CheckCircle}
            orders={readyOrders}
          />
        </XStack>
      </ScrollView>
    </YStack>
  );
}
