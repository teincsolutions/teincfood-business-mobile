// @ts-nocheck
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  YStack,
  Text,
  Card,
  XStack,
  Separator,
  Sheet,
  useMedia,
  ScrollView,
} from "tamagui";
import { Linking } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import {
  Phone,
  MapPin,
  Clock,
  CreditCard,
  FileText,
  Check,
  Bike,
  Truck,
  Printer,
  Eye,
  Wallet,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { toast } from "sonner-native";
import {
  cancelLabelFor,
  formatPriceFromMinor,
  getCustomerDisplay,
  isCancellable,
  isDeliveryOrder,
  isUnpaid,
  usePendingOrders,
} from "@teincfood/core";
import {
  useSellerOrderQuery,
  useAcceptOrderMutation,
  useCancelOrderMutation,
  useConfirmCashPaymentMutation,
  useRejectOrderMutation,
  useStartPreparingOrderMutation,
  useMarkOrderReadyMutation,
  useCompletePickupMutation,
  useConfirmHandoverMutation,
} from "@/hooks/seller.hooks";
import {
  useAvailableRidersQuery,
  useAssignRiderMutation,
} from "@/hooks/kiosk.hooks";
import { RiderSelectionSheet } from "@/components/kiosk/RiderSelectionSheet";
import { ReceiptPreviewSheet } from "@/components/orders/ReceiptPreviewSheet";
import { MakeDeliverySheet } from "@/components/orders/MakeDeliverySheet";
import { CashPaymentSheet } from "@/components/pos";
import { usePrintReceiptMutation } from "@/hooks/useReceiptPreview";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { MomoChargeSheet } from "@/components/subscription/MomoChargeSheet";
import { paymentService } from "@/services/payment.service";
import type { MomoQuote } from "@/types/payment";

const STATUS_COLORS: Record<string, string> = {
  pending: "$yellow9",
  accepted: "$orange9",
  preparing: "$blue9",
  ready: "$green9",
  delivered: "$gray9",
  cancelled: "$red9",
};

const DELIVERY_STATUS_COLORS: Record<string, string> = {
  assigned: "$orange9",
  picked_up: "$blue9",
  en_route: "$blue9",
  arrived: "$green9",
  delivered: "$gray9",
  failed: "$red9",
  returned_to_merchant: "$orange9",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetails({
  orderId: orderIdProp,
  embedded = false,
}: {
  orderId?: string;
  embedded?: boolean;
} = {}) {
  const params = useLocalSearchParams();
  const id = orderIdProp ?? (params.id as string);
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();

  // Live order updates for this specific order. Offline-created orders live
  // in the pending outbox until the cloud acknowledges them, so fall back to
  // that snapshot when the SQLite read model has not received the order yet.
  const { data, isLoading, refetch } = useSellerOrderQuery(id as string);
  const pendingOrders = usePendingOrders();
  const acceptMutation = useAcceptOrderMutation();
  const rejectMutation = useRejectOrderMutation();
  const startPreparingMutation = useStartPreparingOrderMutation();
  const markReadyMutation = useMarkOrderReadyMutation();
  const completePickupMutation = useCompletePickupMutation();
  const confirmHandoverMutation = useConfirmHandoverMutation();
  const assignRider = useAssignRiderMutation();
  const confirmCashPayment = useConfirmCashPaymentMutation();
  const cancelOrderMutation = useCancelOrderMutation();
  const canReject = useHasCapability('orders_reject');
  const { data: riders } = useAvailableRidersQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [showRiderSheet, setShowRiderSheet] = useState(false);
  const [pendingRiderChange, setPendingRiderChange] = useState<{
    orderId: string;
    riderId: string;
  } | null>(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  const [showMakeDelivery, setShowMakeDelivery] = useState(false);
  const [showMomoSheet, setShowMomoSheet] = useState(false);
  const [showCashSheet, setShowCashSheet] = useState(false);
  const [recordingCash, setRecordingCash] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [momoQuote, setMomoQuote] = useState<MomoQuote | null>(null);
  const printMutation = usePrintReceiptMutation();

  const pendingOrder = pendingOrders.find(
    (candidate) => candidate.id === id || candidate.order_number === id,
  );
  const order = data?.data ?? pendingOrder;
  const customerDisplay = order
    ? getCustomerDisplay(
        order as unknown as Parameters<typeof getCustomerDisplay>[0],
      )
    : null;
  const canCollectMomo = Boolean(
    order?.is_pos &&
    !order.is_paid &&
    (order.pos_payment_method ?? order.payment_mode) === "mobile_money",
  );

  useEffect(() => {
    if (!showMomoSheet || !order?.id) return;
    let cancelled = false;
    setMomoQuote(null);
    paymentService
      .getMomoQuote({ order_id: order.id })
      .then((response) => {
        if (!cancelled) setMomoQuote(response.data);
      })
      .catch(() => {
        if (!cancelled) setMomoQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showMomoSheet, order?.id]);

  const showDialog = (
    title: string,
    description: string,
    onConfirm: () => void,
    isDestructive = false,
  ) => {
    setDialogConfig({ title, description, onConfirm, isDestructive });
    setDialogOpen(true);
  };

  const handlePreview = () => {
    if (!order) {
      toast.error("Order not loaded");
      return;
    }
    setReceiptPreviewOpen(true);
  };

  const handlePrint = () => {
    if (!order) {
      toast.error("Order not loaded");
      return;
    }
    printMutation.mutate(order);
  };

  const handleCollectCash = async () => {
    if (!order) return;
    setRecordingCash(true);
    try {
      await confirmCashPayment.mutateAsync(order.id);
      toast.success(`Cash recorded for ${order.order_number}`);
      setShowCashSheet(false);
      void refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not record cash",
      );
    } finally {
      setRecordingCash(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order) return;
    const label = cancelLabelFor(order.status);
    showDialog(
      `${label} Order`,
      `${label} order ${order.order_number}?`,
      () => {
        setCancelling(true);
        cancelOrderMutation.mutate(order.id, {
          onSuccess: () => {
            toast.success(`Order ${order.order_number} ${label.toLowerCase()}ed`);
            void refetch();
          },
          onError: (error: unknown) => {
            toast.error(
              error instanceof Error ? error.message : "Could not update order",
            );
          },
          onSettled: () => setCancelling(false),
        });
      },
      true,
    );
  };

  if (isLoading && !pendingOrder) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
        padding="$4"
      >
        <Text fontSize="$5" color="$colorMuted">
          Loading order...
        </Text>
      </YStack>
    );
  }

  if (!order) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
        padding="$4"
      >
        <Text fontSize="$5" color="$colorMuted">
          Order not found
        </Text>
        <Button marginTop="$4" onPress={() => router.back()}>
          Go Back
        </Button>
      </YStack>
    );
  }

  return (
    <YStack
      flex={1}
      paddingTop={embedded ? 0 : Math.max(insets.top + 8, 24)}
      paddingBottom={embedded ? 0 : insets.bottom + 16}
      backgroundColor="$background"
    >
      {/* Header */}
      <XStack
        padding="$4"
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        {embedded ? null : <BackButton />}
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">
            Order Details
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {order.order_number}
          </Text>
        </YStack>
        <YStack
          paddingHorizontal="$3"
          paddingVertical="$1"
          borderRadius="$2"
          backgroundColor={STATUS_COLORS[order.status] || "$gray9"}
        >
          <Text
            color="$background"
            fontSize="$3"
            textTransform="capitalize"
            fontWeight="600"
          >
            {order.status}
          </Text>
        </YStack>
      </XStack>

      <ScrollView
        {...(media.md || media.lg
          ? embedded
            ? {}
            : { maxWidth: 600, alignSelf: "center", width: "100%" }
          : {})}
      >
        <YStack padding="$4" gap="$4">
          {/* Customer Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="bold">
                Customer Information
              </Text>
              <Separator />
              <XStack alignItems="center" gap="$3">
                <YStack width={24} alignItems="center">
                  <Text fontSize="$5">👤</Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorMuted">
                    Name
                  </Text>
                  <Text fontSize="$4" fontWeight="500">
                    {customerDisplay?.name ?? "Walk-in"}
                  </Text>
                </YStack>
              </XStack>
              {customerDisplay?.phone && (
                <XStack alignItems="center" gap="$3">
                  <YStack width={24} alignItems="center">
                    <Phone size={18} color="$colorMuted" />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">
                      Phone
                    </Text>
                    <Text fontSize="$4" fontWeight="500">
                      {customerDisplay.phone}
                    </Text>
                  </YStack>
                </XStack>
              )}
              {customerDisplay?.isWalkIn && customerDisplay.tellerName ? (
                <XStack alignItems="center" gap="$3">
                  <YStack width={24} alignItems="center">
                    <Text fontSize="$5">🧑‍🍳</Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">
                      Served by
                    </Text>
                    <Text fontSize="$4" fontWeight="500">
                      {customerDisplay.tellerName}
                    </Text>
                  </YStack>
                </XStack>
              ) : null}
              {order.delivery_address && (
                <XStack alignItems="flex-start" gap="$3">
                  <YStack width={24} alignItems="center" paddingTop="$1">
                    <MapPin size={18} color="$colorMuted" />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">
                      Delivery Address
                    </Text>
                    <Text fontSize="$4" fontWeight="500">
                      {order.delivery_address.full_address ||
                        `${order.delivery_address.street}, ${order.delivery_address.city}`}
                    </Text>
                  </YStack>
                </XStack>
              )}
            </YStack>
          </Card>

          {/* Delivery Status */}
          {order.delivery_id && (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Truck size={16} color="$primary" />
                  <Text fontSize="$4" fontWeight="bold">
                    Delivery Status
                  </Text>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <Text fontSize="$3" color="$colorMuted">
                    Status:
                  </Text>
                  <YStack
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$3"
                    backgroundColor={
                      DELIVERY_STATUS_COLORS[order.delivery_status] || "$gray9"
                    }
                  >
                    <Text fontSize="$2" color="white" fontWeight="600">
                      {order.delivery_status?.replace(/_/g, " ")}
                    </Text>
                  </YStack>
                </XStack>
                {order.delivery_status === "assigned" && (
                  <YStack gap="$2" marginTop="$1">
                    <Separator />
                    <Text fontSize="$3" fontWeight="600" color="$colorMuted">
                      Confirmation Progress
                    </Text>
                    <XStack alignItems="center" gap="$2">
                      {order.merchant_handover_confirmed_at ? (
                        <Check size={14} color="$green10" />
                      ) : (
                        <Clock size={14} color="$orange9" />
                      )}
                      <Text
                        fontSize="$3"
                        color={
                          order.merchant_handover_confirmed_at
                            ? "$green10"
                            : "$orange9"
                        }
                      >
                        Merchant handover:{" "}
                        {order.merchant_handover_confirmed_at
                          ? "Confirmed"
                          : "Pending"}
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      {order.rider_pickup_confirmed_at ? (
                        <Check size={14} color="$green10" />
                      ) : (
                        <Clock size={14} color="$orange9" />
                      )}
                      <Text
                        fontSize="$3"
                        color={
                          order.rider_pickup_confirmed_at
                            ? "$green10"
                            : "$orange9"
                        }
                      >
                        Rider pickup:{" "}
                        {order.rider_pickup_confirmed_at
                          ? "Confirmed"
                          : "Pending"}
                      </Text>
                    </XStack>
                  </YStack>
                )}
                {order.eta_minutes && (
                  <Text fontSize="$3" color="$colorMuted">
                    ETA: {order.eta_minutes} min
                  </Text>
                )}
                {order.delivery_person && <Separator />}
              </YStack>
            </Card>
          )}

          {/* Rider Info */}
          {order.delivery_person && (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Bike size={16} color="$primary" />
                  <Text fontSize="$4" fontWeight="bold">
                    Rider
                  </Text>
                </XStack>
                {order.delivery_person.name && (
                  <Text fontSize="$3">{order.delivery_person.name}</Text>
                )}
              </YStack>
            </Card>
          )}

          {/* Order Items */}
          {order.items.length > 0 && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="bold">
                  Order Items
                </Text>
                <Separator />
                {order.items.map((item) => (
                  <YStack key={item.id} gap="$1">
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack flex={1}>
                        <Text fontSize="$4" fontWeight="500">
                          {item.menu_item?.name}
                        </Text>
                        <Text fontSize="$3" color="$colorMuted">
                          Qty: {item.quantity}
                        </Text>
                      </YStack>
                      <Text fontSize="$4" fontWeight="600">
                        {formatPriceFromMinor(item.subtotal, order.currency)}
                      </Text>
                    </XStack>
                  </YStack>
                ))}
              </YStack>
            </Card>
          )}

          {/* Payment Summary */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="bold">
                Payment Summary
              </Text>
              <Separator />
              <XStack alignItems="center" gap="$3">
                <YStack width={24} alignItems="center">
                  <CreditCard size={18} color="$colorMuted" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorMuted">
                    Payment
                  </Text>
                  <Text
                    fontSize="$4"
                    fontWeight="500"
                    textTransform="capitalize"
                  >
                    {order.payment_mode?.replace("_", " ")}
                  </Text>
                </YStack>
                <YStack
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  backgroundColor={order.is_paid ? "$green9" : "$orange9"}
                >
                  <Text
                    fontSize="$2"
                    fontWeight="600"
                    color="white"
                    textTransform="capitalize"
                  >
                    {order.is_paid ? "Paid" : "Unpaid"}
                  </Text>
                </YStack>
              </XStack>
              {(() => {
                const payout = (order as any).payout;
                if (!payout) return null;
                const label =
                  payout.status === "paid"
                    ? "Paid to mobile money"
                    : payout.status === "processing"
                      ? "Instant payout processing"
                      : payout.status === "failed"
                        ? "Payout failed — returned to wallet"
                        : payout.settled_to_wallet
                          ? "Settled to business wallet"
                          : "Awaiting settlement";
                return (
                  <>
                    <Separator />
                    <XStack alignItems="center" gap="$3">
                      <YStack width={24} alignItems="center">
                        <Wallet size={18} color="$colorMuted" />
                      </YStack>
                      <YStack flex={1}>
                        <Text fontSize="$2" color="$colorMuted">
                          Payout
                        </Text>
                        <Text fontSize="$4" fontWeight="500">
                          {label}
                        </Text>
                      </YStack>
                    </XStack>
                  </>
                );
              })()}
              <Separator />
              <YStack gap="$2">
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">Subtotal</Text>
                  <Text>
                    {formatPriceFromMinor(order.subtotal_minor, order.currency)}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">Delivery Fee</Text>
                  <Text>
                    {formatPriceFromMinor(
                      order.delivery_fee_minor,
                      order.currency,
                    )}
                  </Text>
                </XStack>
                {(order as any).service_fee_minor > 0 && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Service Fee</Text>
                    <Text>
                      {formatPriceFromMinor(
                        (order as any).service_fee_minor,
                        order.currency,
                      )}
                    </Text>
                  </XStack>
                )}
                {order.tip_minor != null && order.tip_minor > 0 && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Tip</Text>
                    <Text>
                      {formatPriceFromMinor(order.tip_minor, order.currency)}
                    </Text>
                  </XStack>
                )}
                {order.discount_minor > 0 && (
                  <XStack justifyContent="space-between">
                    <Text color="$green10">Discount</Text>
                    <Text color="$green10">
                      -
                      {formatPriceFromMinor(
                        order.discount_minor,
                        order.currency,
                      )}
                    </Text>
                  </XStack>
                )}
                <Separator />
                <XStack justifyContent="space-between">
                  <Text fontSize="$5" fontWeight="bold">
                    Total
                  </Text>
                  <Text fontSize="$5" fontWeight="bold" color="$info">
                    {formatPriceFromMinor(order.total_minor, order.currency)}
                  </Text>
                </XStack>
              </YStack>
            </YStack>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card padding="$4" bordered>
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <FileText size={18} color="$colorMuted" />
                  <Text fontSize="$4" fontWeight="bold">
                    Special Instructions
                  </Text>
                </XStack>
                <Separator />
                <Text color="$colorMuted">{order.notes}</Text>
              </YStack>
            </Card>
          )}

          {/* Action Buttons */}
          <YStack gap="$3" marginTop="$2">
            <Text fontSize="$4" fontWeight="bold">
              Documents
            </Text>
            <Separator />
            <XStack gap="$3">
              <Button
                flex={1}
                variant="outline"
                height={40}
                icon={<Eye size={16} />}
                onPress={handlePreview}
              >
                Preview Receipt
              </Button>
              <Button
                flex={1}
                variant="primary"
                height={40}
                icon={<Printer size={16} />}
                onPress={handlePrint}
                disabled={printMutation.isPending}
              >
                {printMutation.isPending ? "Printing..." : "Print Receipt"}
              </Button>
            </XStack>

            <Text fontSize="$4" fontWeight="bold" marginTop="$2">
              Order Actions
            </Text>
            <Separator />

            {!isDeliveryOrder(
              order as unknown as Parameters<typeof isDeliveryOrder>[0],
            ) &&
              ["pending", "accepted", "preparing", "ready", "waiting_pickup"].includes(
                order.status,
              ) && (
                <Button
                  variant="outline"
                  width="100%"
                  onPress={() => setShowMakeDelivery(true)}
                >
                  Make Delivery
                </Button>
              )}

            {canCollectMomo && (
              <Button
                variant="success"
                width="100%"
                onPress={() => setShowMomoSheet(true)}
              >
                Collect Mobile Money
              </Button>
            )}

            {isUnpaid(order) && order.status !== "cancelled" && (
              <Button
                variant="outline"
                width="100%"
                onPress={() => setShowCashSheet(true)}
                disabled={recordingCash}
              >
                {recordingCash ? "Recording Cash..." : "Collect Cash"}
              </Button>
            )}

            {canReject &&
              order.status !== "pending" &&
              isCancellable(order.status) && (
                <Button
                  variant="dangerOutline"
                  width="100%"
                  onPress={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling
                    ? "Updating..."
                    : cancelLabelFor(order.status)}
                </Button>
              )}

            {order.status === "pending" && (
              <>
                <Button
                  variant="info"
                  width="100%"
                  onPress={() =>
                    showDialog(
                      "Accept Order",
                      "Accept this order and start preparing?",
                      () => acceptMutation.mutate(order.id),
                    )
                  }
                >
                  Accept Order
                </Button>
                <Button
                  variant="dangerOutline"
                  width="100%"
                  onPress={() =>
                    showDialog(
                      "Reject Order",
                      "Are you sure you want to reject this order?",
                      () => rejectMutation.mutate(order.id),
                      true,
                    )
                  }
                >
                  Reject Order
                </Button>
              </>
            )}
            {order.status === "accepted" && (
              <Button
                variant="info"
                width="100%"
                onPress={() =>
                  showDialog(
                    "Start Preparing",
                    "Start preparing this order?",
                    () => startPreparingMutation.mutate(order.id),
                  )
                }
              >
                Start Preparing
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                variant="success"
                width="100%"
                onPress={() =>
                  showDialog("Mark as Ready", "Mark this order as ready?", () =>
                    markReadyMutation.mutate(order.id),
                  )
                }
              >
                Mark as Ready
              </Button>
            )}
            {(order.status === "ready" || order.status === "waiting_pickup") &&
              isDeliveryOrder(
                order as unknown as Parameters<typeof isDeliveryOrder>[0],
              ) &&
              order.delivery_person && (
                <>
                  {order.merchant_handover_confirmed_at ? (
                    <Button
                      variant="primary"
                      width="100%"
                      disabled
                      opacity={0.6}
                    >
                      Waiting for Rider Pickup Confirmation
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      width="100%"
                      onPress={() =>
                        showDialog(
                          "Confirm Handover",
                          "Hand over this order to the rider?",
                          () =>
                            confirmHandoverMutation.mutate(order.delivery_id),
                        )
                      }
                    >
                      Confirm Handover to Rider
                    </Button>
                  )}
                  {!order.rider_pickup_confirmed_at && (
                    <Button
                      variant="outline"
                      width="100%"
                      onPress={() => setShowRiderSheet(true)}
                    >
                      Change Rider
                    </Button>
                  )}
                </>
              )}
            {order.status === "ready" &&
              !isDeliveryOrder(
                order as unknown as Parameters<typeof isDeliveryOrder>[0],
              ) && (
                <Button
                  variant="primary"
                  width="100%"
                  onPress={() =>
                    showDialog(
                      "Complete Pickup",
                      `Hand ${order.order_number} to the customer?`,
                      () => completePickupMutation.mutate(order.id),
                    )
                  }
                >
                  Handed to Customer
                </Button>
              )}
            {(order.status === "ready" || order.status === "waiting_pickup") &&
              !order.delivery_person &&
              isDeliveryOrder(
                order as unknown as Parameters<typeof isDeliveryOrder>[0],
              ) && (
                <Button
                  variant="primary"
                  width="100%"
                  onPress={() => setShowRiderSheet(true)}
                >
                  Assign Rider
                </Button>
              )}

            <Text fontSize="$4" fontWeight="bold" marginTop="$2">
              Contact
            </Text>
            <Separator />
            {order.delivery_person?.phone && (
              <Button
                variant="outline"
                width="100%"
                icon={<Phone size={18} />}
                onPress={() =>
                  Linking.openURL(`tel:${order.delivery_person.phone}`)
                }
              >
                Call Rider ({order.delivery_person.name || "Rider"})
              </Button>
            )}
            {order.user?.phone && (
              <Button
                variant="outline"
                width="100%"
                icon={<Phone size={18} />}
                onPress={() => Linking.openURL(`tel:${order.user.phone}`)}
              >
                Call Customer
              </Button>
            )}
          </YStack>
        </YStack>
      </ScrollView>

      <CashPaymentSheet
        open={showCashSheet}
        onOpenChange={setShowCashSheet}
        totalMinor={order.total_minor}
        currency={order.currency_code ?? order.currency ?? "GHS"}
        isProcessing={recordingCash}
        onConfirm={() => void handleCollectCash()}
      />

      <MomoChargeSheet
        open={showMomoSheet}
        title={`Collect Mobile Money · ${order.order_number}`}
        subtitle="Ask the customer to approve the prompt on their phone."
        baseMinor={momoQuote?.base_amount_minor ?? order.total_minor}
        feeMinor={momoQuote?.fee_minor ?? 0}
        currency={order.currency_code ?? order.currency ?? "GHS"}
        defaultPhone={order.customer_phone}
        amountLabel="Order amount"
        onStart={async (phone, provider) => {
          const response = await paymentService.chargeMomo({
            order_id: order.id,
            phone,
            provider,
            idempotency_key: `order-detail-pay-${order.id}-${Date.now()}`,
          });
          return { charge: response.data };
        }}
        onSuccess={() => {
          toast.success("Mobile-money payment received");
          setShowMomoSheet(false);
          void refetch();
        }}
        onClose={() => {
          setShowMomoSheet(false);
          setMomoQuote(null);
        }}
      />

      {/* Receipt Preview Sheet (80mm thermal, live order) */}
      <ReceiptPreviewSheet
        open={receiptPreviewOpen}
        onOpenChange={setReceiptPreviewOpen}
        order={order}
      />

      <MakeDeliverySheet
        open={showMakeDelivery}
        onOpenChange={setShowMakeDelivery}
        order={order}
        onDone={() => {
          void refetch();
        }}
      />

      <RiderSelectionSheet
        visible={showRiderSheet}
        onClose={() => setShowRiderSheet(false)}
        riders={riders ?? []}
        onSelectRider={(riderId) => {
          setShowRiderSheet(false);
          if (order?.delivery_person) {
            setPendingRiderChange({ orderId: order!.id, riderId });
          } else {
            assignRider.mutate({ orderId: order!.id, riderId });
          }
        }}
      />

      <AppAlertDialog
        open={pendingRiderChange !== null}
        onOpenChange={() => setPendingRiderChange(null)}
        title="Change Rider"
        description="The current rider will be replaced and notified. Are you sure?"
        confirmText="Change Rider"
        isDestructive
        onConfirm={() => {
          if (pendingRiderChange) {
            assignRider.mutate(pendingRiderChange);
            setPendingRiderChange(null);
          }
        }}
      />

      <AppAlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogConfig?.title || ""}
        description={dialogConfig?.description || ""}
        confirmText="Confirm"
        isDestructive={dialogConfig?.isDestructive}
        onConfirm={() => {
          dialogConfig?.onConfirm();
          setDialogOpen(false);
        }}
      />
    </YStack>
  );
}
