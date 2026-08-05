// @ts-nocheck
import { ScrollView } from "react-native";
import { Sheet, YStack, XStack, Text, Separator, Image } from "tamagui";
import { Clock, MapPin, CreditCard, Smartphone } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/utils/formatCurrency";
import type { Order } from "@/models/order.model";
import { use } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCachedImageUrl } from "@/hooks/useCachedImage";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200";

function OrderItemImage({ url }: { url?: string | null }) {
  const uri = useCachedImageUrl(url) || FALLBACK_IMAGE;
  return (
    <Image
      source={{ uri }}
      width={60}
      height={60}
      borderRadius="$3"
      objectFit="cover"
    />
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "$gray400" },
  confirmed: { label: "Confirmed", color: "$blue" },
  preparing: { label: "Preparing", color: "$starOrange" },
  on_the_way: { label: "On The Way", color: "$primary" },
  delivered: { label: "Delivered", color: "$green" },
  cancelled: { label: "Cancelled", color: "$red" },
};

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderDetailModal({
  open,
  onOpenChange,
  order,
}: OrderDetailModalProps) {
  if (!order) return null;

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isActive = !["delivered", "cancelled"].includes(order.status);
  const insets = useSafeAreaInsets();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[90]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame backgroundColor="$background">
        <Sheet.Handle />

        {/* Header */}
        <XStack
          justifyContent="space-between"
          alignItems="center"
          padding="$5"
          paddingBottom="$3"
        >
          <YStack>
            <Text
              fontSize="$6"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Order Details
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              {order.orderNumber}
            </Text>
          </YStack>
          <XStack
            backgroundColor={isActive ? "$orangeMuted" : "$backgroundSoft"}
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$full"
          >
            <Text
              fontSize="$3"
              fontWeight="700"
              fontFamily="$body"
              color={statusInfo.color}
            >
              {statusInfo.label}
            </Text>
          </XStack>
        </XStack>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        >
          <YStack padding="$5" paddingTop="$0" gap="$5">
            {/* Order Items */}
            <YStack gap="$3">
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Items ({order.items.length})
              </Text>

              {order.items.map((item, index) => (
                <YStack
                  key={item.id || index}
                  backgroundColor="$backgroundStrong"
                  borderRadius="$4"
                  padding="$4"
                  gap="$3"
                >
                  <XStack gap="$3" alignItems="center">
                    <OrderItemImage url={item.food?.imageUrl} />
                    <YStack flex={1} gap="$1">
                      <Text
                        fontSize="$4"
                        fontWeight="700"
                        fontFamily="$heading"
                        color="$color"
                      >
                        {item.food?.name}
                      </Text>
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        Qty: {item.quantity}
                      </Text>
                    </YStack>
                    <Text
                      fontSize="$5"
                      fontWeight="800"
                      fontFamily="$body"
                      color="$primary"
                    >
                      {formatCurrency(item.totalPrice)}
                    </Text>
                  </XStack>

                  {/* Size */}
                  {item.selectedSize && (
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        Size
                      </Text>
                      <Text
                        fontSize="$3"
                        fontWeight="600"
                        fontFamily="$body"
                        color="$color"
                      >
                        {item.selectedSize}
                      </Text>
                    </XStack>
                  )}

                  {/* Extras */}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <YStack gap="$2">
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        Extras
                      </Text>
                      {item.selectedAddons.map((addon, addonIndex) => (
                        <XStack
                          key={addonIndex}
                          justifyContent="space-between"
                          alignItems="center"
                          paddingLeft="$3"
                        >
                          <Text fontSize="$3" fontFamily="$body" color="$color">
                            + {addon.name}
                          </Text>
                          <Text
                            fontSize="$3"
                            fontWeight="600"
                            fontFamily="$body"
                            color="$primary"
                          >
                            +{formatCurrency(addon.price)}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  )}

                  {/* Special Instructions */}
                  {item.specialInstructions && (
                    <YStack gap="$1">
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        Instructions
                      </Text>
                      <Text
                        fontSize="$3"
                        fontFamily="$body"
                        color="$color"
                        fontStyle="italic"
                      >
                        "{item.specialInstructions}"
                      </Text>
                    </YStack>
                  )}
                </YStack>
              ))}
            </YStack>

            <Separator borderColor="$borderColor" />

            {/* Delivery Info */}
            <YStack gap="$3">
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Delivery
              </Text>
              <XStack gap="$3" alignItems="flex-start">
                <MapPin size={18} color="$colorSecondary" marginTop={2} />
                <YStack flex={1} gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                  >
                    {order.deliveryAddress?.label || "Delivery Address"}
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {order.deliveryAddress?.fullAddress ||
                      order.deliveryAddress?.street}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <Clock size={18} color="$colorSecondary" />
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  {isActive
                    ? `ETA: ${order.estimatedDeliveryTime || "Calculating..."}`
                    : order.estimatedDeliveryTime || "Completed"}
                </Text>
              </XStack>
            </YStack>

            <Separator borderColor="$borderColor" />

            {/* Payment Method */}
            <YStack gap="$3">
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Payment
              </Text>
              <XStack gap="$3" alignItems="center">
                {order.paymentMethod?.type === "mobile_money" ? (
                  <Smartphone size={18} color="$colorSecondary" />
                ) : (
                  <CreditCard size={18} color="$colorSecondary" />
                )}
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  {order.paymentMethod?.type === "mobile_money"
                    ? `MTN MoMo (•••• ${order.paymentMethod?.last4})`
                    : `Card •••• ${order.paymentMethod?.last4}`}
                </Text>
              </XStack>
            </YStack>

            <Separator borderColor="$borderColor" />

            {/* Bill Summary */}
            <YStack gap="$3">
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Bill Summary
              </Text>

              <YStack
                backgroundColor="$backgroundStrong"
                borderRadius="$4"
                padding="$4"
                gap="$3"
              >
                <XStack justifyContent="space-between">
                  <Text
                    fontSize="$4"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Subtotal
                  </Text>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                    {formatCurrency(order.subtotal)}
                  </Text>
                </XStack>

                <XStack justifyContent="space-between">
                  <Text
                    fontSize="$4"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Delivery Fee
                  </Text>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                    {formatCurrency(order.deliveryFee)}
                  </Text>
                </XStack>

                <XStack justifyContent="space-between">
                  <Text
                    fontSize="$4"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Taxes
                  </Text>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                    {formatCurrency(order.subtotal * 0.05)}
                  </Text>
                </XStack>

                {order.discount > 0 && (
                  <XStack justifyContent="space-between">
                    <Text fontSize="$4" color="$green" fontFamily="$body">
                      Discount
                    </Text>
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      color="$green"
                      fontFamily="$body"
                    >
                      -{formatCurrency(order.discount)}
                    </Text>
                  </XStack>
                )}

                {order.tip > 0 && (
                  <XStack justifyContent="space-between">
                    <Text
                      fontSize="$4"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      Driver Tip
                    </Text>
                    <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                      {formatCurrency(order.tip)}
                    </Text>
                  </XStack>
                )}

                <Separator borderColor="$borderColor" marginVertical="$1" />

                <XStack justifyContent="space-between">
                  <Text
                    fontSize="$5"
                    fontWeight="800"
                    fontFamily="$heading"
                    color="$color"
                  >
                    Total
                  </Text>
                  <Text
                    fontSize="$5"
                    fontWeight="800"
                    fontFamily="$heading"
                    color="$primary"
                  >
                    {formatCurrency(order.total)}
                  </Text>
                </XStack>
              </YStack>
            </YStack>

            {/* Placed At */}
            <YStack gap="$1">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Order Placed
              </Text>
              <Text fontSize="$4" fontFamily="$body" color="$color">
                {new Date(order.placedAt).toLocaleString()}
              </Text>
            </YStack>
          </YStack>
        </ScrollView>

        {/* Close Button */}
        <YStack
          position="absolute"
          bottom={insets.bottom}
          left={0}
          right={0}
          backgroundColor="$background"
          paddingHorizontal="$5"
          paddingBottom="$5"
          paddingTop="$3"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          <Button
            variant="outline"
            height={50}
            onPress={() => onOpenChange(false)}
          >
            Close
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
