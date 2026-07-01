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
  Bike,
  Truck,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { toast } from "sonner-native";
import { formatPriceFromMinor } from "@/utils/currency";
import {
  useSellerOrderQuery,
  useAcceptOrderMutation,
  useRejectOrderMutation,
  useStartPreparingOrderMutation,
  useMarkOrderReadyMutation,
  useConfirmHandoverMutation,
} from "@/hooks/seller.hooks";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import { useAvailableRidersQuery, useAssignRiderMutation } from "@/hooks/kiosk.hooks";
import { RiderSelectionSheet } from "@/components/kiosk/RiderSelectionSheet";

const STATUS_COLORS: Record<string, string> = {
  pending: "$yellow9",
  accepted: "$orange9",
  preparing: "$blue9",
  ready: "$green9",
  delivered: "$gray9",
  cancelled: "$red9",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Live order updates for this specific order
  useOrderRealtimeUpdates(['seller']);

  const { data, isLoading, error } = useSellerOrderQuery(id as string);
  const acceptMutation = useAcceptOrderMutation();
  const rejectMutation = useRejectOrderMutation();
  const startPreparingMutation = useStartPreparingOrderMutation();
  const markReadyMutation = useMarkOrderReadyMutation();
  const confirmHandoverMutation = useConfirmHandoverMutation();
  const assignRider = useAssignRiderMutation();
  const { data: riders } = useAvailableRidersQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [showRiderSheet, setShowRiderSheet] = useState(false);

  const order = data?.data;
  const showDialog = (title: string, description: string, onConfirm: () => void, isDestructive = false) => {
    setDialogConfig({ title, description, onConfirm, isDestructive });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$5" color="$colorMuted">Loading order...</Text>
      </YStack>
    );
  }

  if (error || !order) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$5" color="$colorMuted">Order not found</Text>
        <Button marginTop="$4" onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} paddingTop={Math.max(insets.top + 8, 24)} paddingBottom={insets.bottom + 16} backgroundColor="$background">
      {/* Header */}
      <XStack padding="$4" alignItems="center" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">Order Details</Text>
          <Text fontSize="$3" color="$colorMuted">{order.order_number}</Text>
        </YStack>
        <YStack paddingHorizontal="$3" paddingVertical="$1" borderRadius="$2" backgroundColor={STATUS_COLORS[order.status] || "$gray9"}>
          <Text color="$background" fontSize="$3" textTransform="capitalize" fontWeight="600">{order.status}</Text>
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
                  <Text fontSize="$4" fontWeight="500">{order.user?.full_name}</Text>
                </YStack>
              </XStack>
              {order.user?.phone && (
                <XStack alignItems="center" gap="$3">
                  <YStack width={24} alignItems="center"><Phone size={18} color="$colorMuted" /></YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">Phone</Text>
                    <Text fontSize="$4" fontWeight="500">{order.user.phone}</Text>
                  </YStack>
                </XStack>
              )}
              {order.delivery_address && (
                <XStack alignItems="flex-start" gap="$3">
                  <YStack width={24} alignItems="center" paddingTop="$1"><MapPin size={18} color="$colorMuted" /></YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">Delivery Address</Text>
                    <Text fontSize="$4" fontWeight="500">
                      {order.delivery_address.full_address || `${order.delivery_address.street}, ${order.delivery_address.city}`}
                    </Text>
                  </YStack>
                </XStack>
              )}
            </YStack>
          </Card>

          {/* Rider Info */}
          {order.delivery_person && (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Bike size={16} color="$primary" />
                  <Text fontSize="$4" fontWeight="bold">Rider Assigned</Text>
                </XStack>
                {order.delivery_person.name && (
                  <Text fontSize="$3">{order.delivery_person.name}</Text>
                )}
                {order.delivery_person.phone && (
                  <Button variant="outline" size="$3" icon={<Phone size={14} />} width="50%" onPress={() => Linking.openURL(`tel:${order.delivery_person.phone}`)}>
                    Call Rider
                  </Button>
                )}
              </YStack>
            </Card>
          )}

          {/* Order Items */}
          {order.items.length > 0 && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="bold">Order Items</Text>
                <Separator />
                {order.items.map((item) => (
                  <YStack key={item.id} gap="$1">
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack flex={1}>
                        <Text fontSize="$4" fontWeight="500">{item.menu_item?.name}</Text>
                        <Text fontSize="$3" color="$colorMuted">Qty: {item.quantity}</Text>
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
              <Text fontSize="$4" fontWeight="bold">Payment Summary</Text>
              <Separator />
              <XStack alignItems="center" gap="$3">
                <YStack width={24} alignItems="center"><CreditCard size={18} color="$colorMuted" /></YStack>
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorMuted">Payment</Text>
                  <Text fontSize="$4" fontWeight="500" textTransform="capitalize">
                    {order.payment_mode?.replace("_", " ")}
                  </Text>
                </YStack>
                <YStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2" backgroundColor={order.is_paid ? "$green9" : "$orange9"}>
                  <Text fontSize="$2" fontWeight="600" color="white" textTransform="capitalize">
                    {order.is_paid ? "Paid" : "Unpaid"}
                  </Text>
                </YStack>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">Subtotal</Text>
                  <Text>{formatPriceFromMinor(order.subtotal_minor, order.currency)}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">Delivery Fee</Text>
                  <Text>{formatPriceFromMinor(order.delivery_fee_minor, order.currency)}</Text>
                </XStack>
                {order.tip_minor != null && order.tip_minor > 0 && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Tip</Text>
                    <Text>{formatPriceFromMinor(order.tip_minor, order.currency)}</Text>
                  </XStack>
                )}
                {order.discount_minor > 0 && (
                  <XStack justifyContent="space-between">
                    <Text color="$green10">Discount</Text>
                    <Text color="$green10">-{formatPriceFromMinor(order.discount_minor, order.currency)}</Text>
                  </XStack>
                )}
                <Separator />
                <XStack justifyContent="space-between">
                  <Text fontSize="$5" fontWeight="bold">Total</Text>
                  <Text fontSize="$5" fontWeight="bold" color="$info">{formatPriceFromMinor(order.total_minor, order.currency)}</Text>
                </XStack>
              </YStack>
            </YStack>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card padding="$4" bordered>
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2"><FileText size={18} color="$colorMuted" /><Text fontSize="$4" fontWeight="bold">Special Instructions</Text></XStack>
                <Separator />
                <Text color="$colorMuted">{order.notes}</Text>
              </YStack>
            </Card>
          )}

          {/* Action Buttons */}
          <YStack gap="$3" marginTop="$2">
            {order.status === "pending" && (
              <>
                <Button variant="info" width="100%" onPress={() => showDialog("Accept Order", "Accept this order and start preparing?", () => acceptMutation.mutate(order.id))}>
                  Accept Order
                </Button>
                <Button variant="dangerOutline" width="100%" onPress={() => showDialog("Reject Order", "Are you sure you want to reject this order?", () => rejectMutation.mutate(order.id), true)}>
                  Reject Order
                </Button>
              </>
            )}
            {order.status === "accepted" && (
              <Button variant="info" width="100%" onPress={() => showDialog("Start Preparing", "Start preparing this order?", () => startPreparingMutation.mutate(order.id))}>
                Start Preparing
              </Button>
            )}
            {order.status === "preparing" && (
              <Button variant="success" width="100%" onPress={() => showDialog("Mark as Ready", "Mark this order as ready?", () => markReadyMutation.mutate(order.id))}>
                Mark as Ready
              </Button>
            )}
            {order.status === "ready" && order.delivery_person && (
              <Button variant="primary" width="100%" onPress={() => showDialog("Confirm Handover", "Hand over this order to the rider?", () => confirmHandoverMutation.mutate(order.delivery_person.id))}>
                Confirm Handover to Rider
              </Button>
            )}
            {order.status === "ready" && !order.delivery_person && (
              <Button variant="primary" width="100%" icon={<Truck size={18} />} onPress={() => setShowRiderSheet(true)}>
                Assign Rider
              </Button>
            )}
            {order.user?.phone && (
              <Button variant="outline" width="100%" icon={<Phone size={18} />} onPress={() => Linking.openURL(`tel:${order.user.phone}`)}>
                Call Customer
              </Button>
            )}
          </YStack>
        </YStack>
      </ScrollView>

      <RiderSelectionSheet
        visible={showRiderSheet}
        onClose={() => setShowRiderSheet(false)}
        riders={riders ?? []}
        onSelectRider={(riderId) => {
          assignRider.mutate({ orderId: order!.id, riderId });
          setShowRiderSheet(false);
          toast.success("Rider assigned successfully");
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
