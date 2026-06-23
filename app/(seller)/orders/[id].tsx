// @ts-nocheck
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, Text, Card, XStack, Separator } from "tamagui";
import { ScrollView, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import {
  Phone,
  MapPin,
  Clock,
  CreditCard,
  FileText,
  Check,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { formatPrice, DEFAULT_CURRENCY } from "@/utils/currency";
import {
  useSellerOrderQuery,
  useAcceptOrderMutation,
  useRejectOrderMutation,
  useStartPreparingOrderMutation,
  useMarkOrderReadyMutation,
  useConfirmHandoverMutation,
} from "@/hooks/seller.hooks";

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading, error } = useSellerOrderQuery(id as string);
  const acceptMutation = useAcceptOrderMutation();
  const rejectMutation = useRejectOrderMutation();
  const startPreparingMutation = useStartPreparingOrderMutation();
  const markReadyMutation = useMarkOrderReadyMutation();
  const confirmHandoverMutation = useConfirmHandoverMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const orderData = data?.data ?? data?.order;
  if (!orderData && data && !data?.order && !data?.data) {
    // fallback if response structure differs
  }

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$5" color="$colorMuted">Loading order...</Text>
      </YStack>
    );
  }

  if (error || !orderData) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$5" color="$colorMuted">Order not found</Text>
        <Button marginTop="$4" onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  const showDialog = (title: string, description: string, onConfirm: () => void, isDestructive = false) => {
    setDialogConfig({ title, description, onConfirm, isDestructive });
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "$yellow9";
      case "preparing": return "$blue9";
      case "ready": return "$green9";
      case "delivered": return "$gray9";
      default: return "$gray9";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "mobile_money": return "Mobile Money";
      case "card": return "Card";
      case "cash": return "Cash";
      default: return method;
    }
  };

  const status = orderData.status || orderData.order_status;
  const customerName = orderData.customer_name || orderData.customer;
  const customerPhone = orderData.customer_phone || orderData.customerPhone;
  const orderNumber = orderData.order_number || orderData.orderNumber;
  const orderCurrency = orderData.currency || DEFAULT_CURRENCY;
  const deliveryAddress = orderData.delivery_address || orderData.deliveryAddress;
  const orderNotes = orderData.notes;
  const orderDate = orderData.inserted_at || orderData.orderDate || orderData.created_at;
  const paymentMethod = orderData.payment_method || orderData.paymentMethod;
  const paymentStatus = orderData.payment_status || orderData.paymentStatus;
  const orderItems = orderData.order_items || orderData.orderItems || orderData.items;
  const totalMinor = orderData.total_minor ?? (orderData.total ? orderData.total * 100 : 0);
  const subtotalMinor = orderData.subtotal_minor ?? (orderData.subtotal ? orderData.subtotal * 100 : undefined);
  const deliveryFeeMinor = orderData.delivery_fee_minor ?? (orderData.deliveryFee ? orderData.deliveryFee * 100 : undefined);
  const deliveryInfo = orderData.delivery;

  const riderAssigned = deliveryInfo && (deliveryInfo.id || deliveryInfo.rider_name);

  return (
    <YStack flex={1} paddingTop={Math.max(insets.top + 8, 24)} paddingBottom={insets.bottom + 16} backgroundColor="$background">
      {/* Header */}
      <XStack padding="$4" alignItems="center" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">Order Details</Text>
          <Text fontSize="$3" color="$colorMuted">{orderNumber}</Text>
        </YStack>
        <YStack paddingHorizontal="$3" paddingVertical="$1" borderRadius="$2" backgroundColor={getStatusColor(status)}>
          <Text color="$background" fontSize="$3" textTransform="capitalize" fontWeight="600">{status}</Text>
        </YStack>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4">
          {/* Customer Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="bold">Customer Information</Text>
              <Separator />
              <XStack alignItems="center" gap="$3">
                <YStack width={24} alignItems="center"><Text fontSize="$5">👤</Text></YStack>
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorMuted">Name</Text>
                  <Text fontSize="$4" fontWeight="500">{customerName}</Text>
                </YStack>
              </XStack>
              {customerPhone && (
                <XStack alignItems="center" gap="$3">
                  <YStack width={24} alignItems="center"><Phone size={18} color="$colorMuted" /></YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">Phone</Text>
                    <Text fontSize="$4" fontWeight="500">{customerPhone}</Text>
                  </YStack>
                </XStack>
              )}
              {deliveryAddress && (
                <XStack alignItems="flex-start" gap="$3">
                  <YStack width={24} alignItems="center" paddingTop="$1"><MapPin size={18} color="$colorMuted" /></YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">Delivery Address</Text>
                    <Text fontSize="$4" fontWeight="500">{deliveryAddress}</Text>
                  </YStack>
                </XStack>
              )}
            </YStack>
          </Card>

          {/* Rider Info */}
          {riderAssigned && (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Check size={16} color="$primary" />
                  <Text fontSize="$4" fontWeight="bold">Rider Assigned</Text>
                </XStack>
                <Text fontSize="$3">{deliveryInfo.rider_name || deliveryInfo.riderName}</Text>
                {deliveryInfo.rider_phone && (
                  <Button variant="outline" size="$3" icon={<Phone size={14} />} width="50%" onPress={() => Linking.openURL(`tel:${deliveryInfo.rider_phone}`)}>
                    Call Rider
                  </Button>
                )}
              </YStack>
            </Card>
          )}

          {/* Order Items */}
          {orderItems && orderItems.length > 0 && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="bold">Order Items</Text>
                <Separator />
                {orderItems.map((item, index) => (
                  <YStack key={index} gap="$1">
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack flex={1}>
                        <Text fontSize="$4" fontWeight="500">{item.name}</Text>
                        <Text fontSize="$3" color="$colorMuted">Qty: {item.quantity}</Text>
                      </YStack>
                      <Text fontSize="$4" fontWeight="600">
                        {formatPrice(
                          ((item.price_minor ?? item.price) * item.quantity) / (item.price_minor ? 1 : 1),
                          orderCurrency
                        )}
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
              <Text fontSize="$4" fontWeight="bold">Payment Summary</Text>
              <Separator />
              <XStack alignItems="center" gap="$3">
                <YStack width={24} alignItems="center"><CreditCard size={18} color="$colorMuted" /></YStack>
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorMuted">Payment Method</Text>
                  <Text fontSize="$4" fontWeight="500">{getPaymentMethodLabel(paymentMethod)}</Text>
                </YStack>
                <YStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2" backgroundColor={paymentStatus === "paid" ? "$success" : "$starOrange"}>
                  <Text fontSize="$2" fontWeight="600" color={paymentStatus === "paid" ? "$white" : "$color"} textTransform="capitalize">
                    {paymentStatus}
                  </Text>
                </YStack>
              </XStack>
              <Separator />
              <YStack gap="$2">
                {subtotalMinor !== undefined && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Subtotal</Text>
                    <Text>{formatPrice(subtotalMinor / 100, orderCurrency)}</Text>
                  </XStack>
                )}
                {deliveryFeeMinor !== undefined && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Delivery Fee</Text>
                    <Text>{formatPrice(deliveryFeeMinor / 100, orderCurrency)}</Text>
                  </XStack>
                )}
                <Separator />
                <XStack justifyContent="space-between">
                  <Text fontSize="$5" fontWeight="bold">Total</Text>
                  <Text fontSize="$5" fontWeight="bold" color="$info">{formatPrice(totalMinor / 100, orderCurrency)}</Text>
                </XStack>
              </YStack>
            </YStack>
          </Card>

          {/* Notes */}
          {orderNotes && (
            <Card padding="$4" bordered>
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2"><FileText size={18} color="$colorMuted" /><Text fontSize="$4" fontWeight="bold">Special Instructions</Text></XStack>
                <Separator />
                <Text color="$colorMuted">{orderNotes}</Text>
              </YStack>
            </Card>
          )}

          {/* Action Buttons */}
          <YStack gap="$3" marginTop="$2">
            {status === "pending" && (
              <>
                <Button variant="info" width="100%" onPress={() => showDialog("Accept Order", "Accept this order and start preparing?", () => acceptMutation.mutate(orderData.id))}>
                  Accept Order
                </Button>
                <Button variant="outline" borderColor="$red10" color="$red10" width="100%" onPress={() => showDialog("Reject Order", "Are you sure you want to reject this order?", () => rejectMutation.mutate(orderData.id), true)}>
                  Reject Order
                </Button>
              </>
            )}
            {status === "accepted" && (
              <Button variant="info" width="100%" onPress={() => showDialog("Start Preparing", "Start preparing this order?", () => startPreparingMutation.mutate(orderData.id))}>
                Start Preparing
              </Button>
            )}
            {status === "preparing" && (
              <Button variant="success" width="100%" onPress={() => showDialog("Mark as Ready", "Mark this order as ready for pickup?", () => markReadyMutation.mutate(orderData.id))}>
                Mark as Ready
              </Button>
            )}
            {status === "ready" && riderAssigned && (
              <Button variant="primary" width="100%" onPress={() => showDialog("Confirm Handover", "Hand over this order to the rider?", () => confirmHandoverMutation.mutate(deliveryInfo.id || deliveryInfo.id))}>
                Confirm Handover to Rider
              </Button>
            )}
            {status === "ready" && !riderAssigned && (
              <YStack backgroundColor="$gray2" padding="$4" borderRadius="$4" alignItems="center">
                <Text color="$colorMuted">Awaiting rider assignment</Text>
              </YStack>
            )}
            {customerPhone && (
              <Button variant="outline" width="100%" icon={<Phone size={18} />} onPress={() => Linking.openURL(`tel:${customerPhone}`)}>
                Call Customer
              </Button>
            )}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Confirmation Dialog */}
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
