// @ts-nocheck
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, Text, Card, XStack, Separator } from "tamagui";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  FileText,
} from "@tamagui/lucide-icons";
import { MOCK_SELLER_ORDERS, SellerOrder } from "@/services/mock-data.service";
import { Button } from "@/components/ui";

/**
 * Order Details Screen
 */
export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const order = MOCK_SELLER_ORDERS.find((o) => o.id === id) as
    | SellerOrder
    | undefined;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "$yellow9";
      case "preparing":
        return "$blue9";
      case "ready":
        return "$green9";
      case "delivered":
        return "$gray9";
      default:
        return "$gray9";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "mobile_money":
        return "Mobile Money";
      case "card":
        return "Card";
      case "cash":
        return "Cash";
      default:
        return method;
    }
  };

  return (
    <YStack
      flex={1}
      paddingBottom={insets.bottom + 16}
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
        <Button
          size="$3"
          circular
          icon={<ArrowLeft size={20} />}
          onPress={() => router.back()}
        />
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">
            Order Details
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {order.orderNumber}
          </Text>
        </YStack>
        <YStack
          paddingHorizontal="$3"
          paddingVertical="$1"
          borderRadius="$2"
          backgroundColor={getStatusColor(order.status)}
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

      <ScrollView>
        <YStack padding="$4" gap="$4">
          {/* Customer Info Card */}
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
                    {order.customer}
                  </Text>
                </YStack>
              </XStack>
              {order.customerPhone && (
                <XStack alignItems="center" gap="$3">
                  <YStack width={24} alignItems="center">
                    <Phone size={18} color="$colorMuted" />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">
                      Phone
                    </Text>
                    <Text fontSize="$4" fontWeight="500">
                      {order.customerPhone}
                    </Text>
                  </YStack>
                </XStack>
              )}
              {order.deliveryAddress && (
                <XStack alignItems="flex-start" gap="$3">
                  <YStack width={24} alignItems="center" paddingTop="$1">
                    <MapPin size={18} color="$colorMuted" />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">
                      Delivery Address
                    </Text>
                    <Text fontSize="$4" fontWeight="500">
                      {order.deliveryAddress}
                    </Text>
                  </YStack>
                </XStack>
              )}
            </YStack>
          </Card>

          {/* Order Timeline Card */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="bold">
                Order Timeline
              </Text>
              <Separator />
              <XStack alignItems="center" gap="$3">
                <YStack width={24} alignItems="center">
                  <Clock size={18} color="$colorMuted" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorMuted">
                    Order Placed
                  </Text>
                  <Text fontSize="$4" fontWeight="500">
                    {formatDate(order.orderDate)}
                  </Text>
                </YStack>
              </XStack>
              {order.estimatedDelivery && (
                <XStack alignItems="center" gap="$3">
                  <YStack width={24} alignItems="center">
                    <Clock size={18} color="$green9" />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">
                      Estimated Delivery
                    </Text>
                    <Text fontSize="$4" fontWeight="500" color="$green9">
                      {formatDate(order.estimatedDelivery)}
                    </Text>
                  </YStack>
                </XStack>
              )}
            </YStack>
          </Card>

          {/* Order Items Card */}
          {order.orderItems && order.orderItems.length > 0 && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <Text fontSize="$4" fontWeight="bold">
                  Order Items
                </Text>
                <Separator />
                {order.orderItems.map((item, index) => (
                  <YStack key={index} gap="$1">
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack flex={1}>
                        <Text fontSize="$4" fontWeight="500">
                          {item.name}
                        </Text>
                        <Text fontSize="$3" color="$colorMuted">
                          Qty: {item.quantity}
                        </Text>
                      </YStack>
                      <Text fontSize="$4" fontWeight="600">
                        GHS {(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </XStack>
                    {item.addons && item.addons.length > 0 && (
                      <YStack paddingLeft="$3" gap="$1">
                        {item.addons.map((addon, addonIndex) => (
                          <XStack
                            key={addonIndex}
                            justifyContent="space-between"
                          >
                            <Text fontSize="$3" color="$colorMuted">
                              + {addon.name}
                            </Text>
                            <Text fontSize="$3" color="$colorMuted">
                              GHS {addon.price.toFixed(2)}
                            </Text>
                          </XStack>
                        ))}
                      </YStack>
                    )}
                    {index < order.orderItems!.length - 1 && (
                      <Separator marginTop="$2" />
                    )}
                  </YStack>
                ))}
              </YStack>
            </Card>
          )}

          {/* Payment Summary Card */}
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
                    Payment Method
                  </Text>
                  <Text fontSize="$4" fontWeight="500">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </Text>
                </YStack>
                <YStack
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  backgroundColor={
                    order.paymentStatus === "paid" ? "$green2" : "$yellow2"
                  }
                >
                  <Text
                    fontSize="$2"
                    fontWeight="600"
                    color={
                      order.paymentStatus === "paid" ? "$green9" : "$yellow9"
                    }
                    textTransform="capitalize"
                  >
                    {order.paymentStatus}
                  </Text>
                </YStack>
              </XStack>
              <Separator />
              <YStack gap="$2">
                {order.subtotal !== undefined && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Subtotal</Text>
                    <Text>GHS {order.subtotal.toFixed(2)}</Text>
                  </XStack>
                )}
                {order.deliveryFee !== undefined && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorMuted">Delivery Fee</Text>
                    <Text>GHS {order.deliveryFee.toFixed(2)}</Text>
                  </XStack>
                )}
                <Separator />
                <XStack justifyContent="space-between">
                  <Text fontSize="$5" fontWeight="bold">
                    Total
                  </Text>
                  <Text fontSize="$5" fontWeight="bold" color="$blue9">
                    GHS {order.total.toFixed(2)}
                  </Text>
                </XStack>
              </YStack>
            </YStack>
          </Card>

          {/* Notes Card */}
          {order.notes && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
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
          {order.status !== "delivered" && (
            <YStack gap="$3" marginTop="$2">
              {order.status === "pending" && (
                <Button size="$4" backgroundColor="$blue9">
                  Start Preparing
                </Button>
              )}
              {order.status === "preparing" && (
                <Button size="$4" backgroundColor="$green9">
                  Mark as Ready
                </Button>
              )}
              {order.status === "ready" && (
                <Button size="$4" backgroundColor="$gray9">
                  Mark as Delivered
                </Button>
              )}
              {order.customerPhone && (
                <Button variant="outlined" icon={<Phone size={18} />}>
                  Call Customer
                </Button>
              )}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
