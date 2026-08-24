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
  ChefHat,
} from "@tamagui/lucide-icons";
import { usePOSOrdersQuery, POS_KEYS } from "@/hooks/pos.hooks";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import {
  useAcceptKioskOrderMutation,
  useStartPreparingKioskOrderMutation,
  useMarkKioskOrderReadyMutation,
  useAssignRiderMutation,
  useAvailableRidersQuery,
} from "@/hooks/kiosk.hooks";
import { useConfirmHandoverMutation } from "@/hooks/seller.hooks";
import { useDisplayStore } from "@/stores/display.store";
import { useSecurityStore } from "@/stores/security.store";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import {
  PendingOrderCard,
  PreparingOrderCard,
  ReadyOrderCard,
  RiderSelectionSheet,
  OrderDetailsSheet,
} from "@/components/kiosk";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import type { SellerOrder } from "@/types/api";

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
  children,
}: {
  label: string;
  color: string;
  icon: any;
  children: React.ReactNode;
}) {
  const count = useMemo(() => {
    if (Array.isArray(children)) return children.length;
    return 0;
  }, [children]);

  return (
    <YStack gap="$3" width="100%" $gtSm={{ flex: 1, minWidth: 280 }}>
      <XStack gap="$2" alignItems="center">
        <Icon size={20} color={color} />
        <Text
          fontSize="$5"
          fontWeight="700"
          fontFamily="$heading"
          color={color}
        >
          {label}
        </Text>
        <Badge backgroundColor={color} size="$2">
          <Text color="white" fontSize="$1" fontWeight="bold">
            {count}
          </Text>
        </Badge>
      </XStack>
      {count === 0 ? (
        <Card
          padding="$6"
          backgroundColor="$backgroundStrong"
          borderRadius="$4"
          alignItems="center"
          justifyContent="center"
          minHeight={100}
        >
          <CheckCircle size={36} color="$gray200" />
          <Text
            fontSize="$4"
            color="$colorSecondary"
            fontFamily="$body"
            marginTop="$2"
          >
            None
          </Text>
        </Card>
      ) : (
        <YStack gap="$3">{children}</YStack>
      )}
    </YStack>
  );
}

const getTimeSince = (dateString: string | null | undefined): number => {
  if (!dateString) return 0;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
};

export default function KitchenDisplay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBusiness } = useActiveBusiness();
  const securityStore = useSecurityStore();
  const [exiting, setExiting] = useState(false);
  const [showRiderSheet, setShowRiderSheet] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  useKeepAwake();
  useOrderRealtimeUpdates(POS_KEYS.all);

  const { data: orders } = usePOSOrdersQuery(undefined, true);
  const acceptOrder = useAcceptKioskOrderMutation();
  const startPreparing = useStartPreparingKioskOrderMutation();
  const markReady = useMarkKioskOrderReadyMutation();
  const assignRider = useAssignRiderMutation();
  const confirmHandover = useConfirmHandoverMutation();
  const { data: riders } = useAvailableRidersQuery(showRiderSheet);

  const orderList = orders ?? [];

  const acceptedOrders = useMemo(
    () =>
      orderList.filter(
        (o) => o.status === "accepted" || o.status === "pending",
      ),
    [orderList],
  );
  const preparingOrders = useMemo(
    () => orderList.filter((o) => o.status === "preparing"),
    [orderList],
  );
  const readyOrders = useMemo(
    () =>
      orderList.filter(
        (o) => o.status === "ready" || (o.status === "waiting_pickup" && !o.merchant_handover_confirmed_at),
      ),
    [orderList],
  );

  const handleOpenRiderSheet = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setShowRiderSheet(true);
  }, []);

  const handleHandover = useCallback(
    (deliveryId: string) => {
      setDialog({
        open: true,
        title: "Confirm Handover",
        description: "Hand over this order to the rider?",
        confirmText: "Handover",
        onConfirm: () => {
          confirmHandover.mutate(deliveryId);
          setDialog(null);
        },
      });
    },
    [confirmHandover],
  );

  const handleViewDetails = useCallback((order: SellerOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }, []);

  const handleAssignRider = useCallback(
    (riderId: string) => {
      if (!selectedOrderId) return;
      const rider = (riders as any[])?.find((r: any) => r.id === riderId);
      setShowRiderSheet(false);
      setTimeout(() => {
        setDialog({
          open: true,
          title: "Assign Rider",
          description: `Assign this order to ${rider?.name ?? "rider"}?`,
          confirmText: "Assign",
          onConfirm: () => {
            assignRider.mutate({ orderId: selectedOrderId, riderId });
            setSelectedOrderId(null);
            setDialog(null);
          },
        });
      }, 100);
    },
    [selectedOrderId, riders, assignRider],
  );

  const handleExit = useCallback(async () => {
    if (!securityStore.isBiometricEnabled) {
      deactivateKeepAwake();
      useDisplayStore.getState().disableKitchenDisplay();
      router.replace("/(seller)/(drawer)");
      return;
    }
    setExiting(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify identity to exit Kitchen Display",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        deactivateKeepAwake();
        useDisplayStore.getState().disableKitchenDisplay();
        router.replace("/(seller)/(drawer)");
      }
    } catch (err) {
      console.debug("Biometric auth error:", err);
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
        <YStack flex={1} minWidth={0} marginRight="$3">
          <Text
            fontSize="$5"
            fontWeight="700"
            fontFamily="$heading"
            color="$color"
            numberOfLines={1}
            flexShrink={1}
          >
            {activeBusiness?.name || "Kitchen Display"}
          </Text>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            {orderList.length} total
          </Text>
        </YStack>
        <XStack gap="$3" alignItems="center" flexShrink={0}>
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
            {exiting ? (
              <Spinner size="small" />
            ) : (
              <LogOut size={18} color="$colorSecondary" />
            )}
          </Button>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <XStack padding="$3" gap="$3" alignItems="flex-start" flexDirection="column" $gtSm={{ flexDirection: "row" }}>
          <StatusColumn label="To Prepare" color="$orange10" icon={Timer}>
            {acceptedOrders.map((order) => (
              <PendingOrderCard
                key={order.id}
                order={order}
                getTimeSince={getTimeSince}
                onAccept={() => acceptOrder.mutate(order.id)}
                onReject={() => {}}
                onStartPreparing={() => startPreparing.mutate(order.id)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </StatusColumn>

          <StatusColumn label="Preparing" color="$blue10" icon={Utensils}>
            {preparingOrders.map((order) => (
              <PreparingOrderCard
                key={order.id}
                order={order}
                onMarkReady={() => markReady.mutate(order.id)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </StatusColumn>

          <StatusColumn label="Ready" color="$green10" icon={CheckCircle}>
            {readyOrders.map((order) => (
              <ReadyOrderCard
                key={order.id}
                order={order}
                onAssignRider={handleOpenRiderSheet}
                onHandover={handleHandover}
                onViewDetails={handleViewDetails}
              />
            ))}
          </StatusColumn>
        </XStack>
      </ScrollView>

      <RiderSelectionSheet
        visible={showRiderSheet}
        onClose={() => setShowRiderSheet(false)}
        riders={(riders as any) ?? []}
        onSelectRider={handleAssignRider}
      />

      <OrderDetailsSheet
        visible={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
        getTimeSince={getTimeSince}
      />

      <AppAlertDialog
        open={!!dialog?.open}
        onOpenChange={(open: boolean) => { if (!open) setDialog(null); }}
        title={dialog?.title ?? ""}
        description={dialog?.description ?? ""}
        confirmText={dialog?.confirmText ?? "Confirm"}
        cancelText="Cancel"
        onConfirm={() => dialog?.onConfirm?.()}
      />
    </YStack>
  );
}
