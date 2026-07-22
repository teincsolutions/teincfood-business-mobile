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
  Clock,
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
    <Text fontSize="$6" fontWeight="700" fontFamily="$heading" color="$color">
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
    <YStack flex={1} minWidth={280} gap="$3">
      <XStack gap="$2" alignItems="center" justifyContent="center">
        <Icon size={28} color={color} />
        <Text fontSize="$7" fontWeight="800" fontFamily="$heading" color={color}>
          {label}
        </Text>
        <YStack backgroundColor={color} borderRadius="$full" px="$3" py="$1">
          <Text color="white" fontSize="$5" fontWeight="800">
            {orders.length}
          </Text>
        </YStack>
      </XStack>

      {orders.length === 0 ? (
        <Card
          padding="$8"
          backgroundColor="$backgroundStrong"
          borderRadius="$6"
          alignItems="center"
          justifyContent="center"
          minHeight={200}
        >
          <CheckCircle size={48} color="$gray200" />
          <Text fontSize="$5" color="$colorSecondary" fontFamily="$body" marginTop="$3">
            No {label.toLowerCase()} orders
          </Text>
        </Card>
      ) : (
        <YStack gap="$3">
          {orders.map((order) => (
            <CalloutCard key={order.id} order={order} />
          ))}
        </YStack>
      )}
    </YStack>
  );
}

export default function CalloutDisplay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const business = useActiveBusiness();
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
        paddingHorizontal="$6"
        paddingVertical="$4"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <YStack>
          <Text fontSize="$6" fontWeight="700" fontFamily="$heading" color="$color">
            {business?.name || "Order Display"}
          </Text>
        </YStack>
        <XStack gap="$4" alignItems="center">
          <LiveClock />
          <Button
            chromeless
            circular
            width={44}
            height={44}
            padding={0}
            pressStyle={{ opacity: 0.6 }}
            disabled={exiting}
            onPress={handleExit}
          >
            {exiting ? <Spinner size="small" /> : <LogOut size={22} color="$colorSecondary" />}
          </Button>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <XStack padding="$6" gap="$6" alignItems="flex-start">
          <StatusColumn
            label="Pending"
            color="$orange10"
            icon={Clock}
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
