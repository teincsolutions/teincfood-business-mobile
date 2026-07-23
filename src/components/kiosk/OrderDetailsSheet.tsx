// @ts-nocheck
import { YStack, XStack, Text, Separator, Sheet, ScrollView, useMedia } from "tamagui";
import {
  Clock,
  X,
  CheckCircle,
  Utensils,
  Truck,
  FileText,
  User,
  DollarSign,
  CreditCard,
  Banknote,
} from "@tamagui/lucide-icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useResponsive } from "@/utils/responsive";
import { formatPriceFromMinor } from "@/utils/currency";
import type { SellerOrder } from "@/types/api";

interface OrderDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  order: SellerOrder | null;
  getTimeSince: (dateString: string | null | undefined) => number;
}

export function OrderDetailsSheet({
  visible,
  onClose,
  order,
  getTimeSince,
}: OrderDetailsSheetProps) {
  const { isTablet } = useResponsive();
  const media = useMedia();

  if (!order) return null;

  const getStatusBadge = () => {
    switch (order.status) {
      case "pending":
        return (
          <Badge backgroundColor="$orangeLight" size="$3">
            <Text color="$primary" fontWeight="bold">PENDING</Text>
          </Badge>
        );
      case "preparing":
        return (
          <Badge backgroundColor="$blue2" size="$3">
            <Text color="$info" fontWeight="bold">PREPARING</Text>
          </Badge>
        );
      case "ready":
        return (
          <Badge backgroundColor="$green2" size="$3">
            <Text color="$success" fontWeight="bold">READY</Text>
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case "pending":
        return <Clock size={24} color="$primary" />;
      case "preparing":
        return <Utensils size={24} color="$info" />;
      case "ready":
        return <Truck size={24} color="$success" />;
      default:
        return <Clock size={24} color="$primary" />;
    }
  };

  const getPaymentIcon = (method: string | undefined) => {
    switch (method) {
      case "mobile_money":
        return <DollarSign size={16} />;
      case "card":
        return <CreditCard size={16} />;
      case "cash":
        return <Banknote size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  return (
    <Sheet modal open={visible} onOpenChange={(open) => !open && onClose()} snapPoints={[80]} dismissOnSnapToBottom zIndex={200_000}>
      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
      <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$5" {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}>
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <XStack gap="$3" alignItems="center">
              {getStatusIcon()}
              <YStack>
                <Text fontSize="$6" fontWeight="bold">
                  {order.order_number}
                </Text>
                {getStatusBadge()}
              </YStack>
            </XStack>
            <Button
              width="$8"
              height="$8"
              $lg={{ width: "$12", height: "$12" }}
              variant="ghost"
              rounded="$full"
              backgroundColor="$backgroundSoft"
              onPress={onClose}
              icon={<X size={isTablet ? 24 : 18} />}
            />
          </XStack>

          <Separator marginBottom="$4" />

          {/* Customer */}
          {order.user?.full_name && (
            <YStack gap="$2" marginBottom="$4">
              <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Customer</Text>
              <XStack gap="$2" alignItems="center">
                <User size={16} color="$colorMuted" />
                <Text fontSize="$4">{order.user.full_name}</Text>
              </XStack>
            </YStack>
          )}

          {/* Special Instructions */}
          {order.notes && (
            <YStack gap="$2" marginBottom="$4">
              <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Special Instructions</Text>
              <XStack gap="$2" alignItems="flex-start">
                <FileText size={16} color="$info" />
                <Text fontSize="$4" color="$info" flex={1}>{order.notes}</Text>
              </XStack>
            </YStack>
          )}

          {/* Order Time */}
          <YStack gap="$2" marginBottom="$4">
            <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Order Time</Text>
            <XStack gap="$2" alignItems="center">
              <Clock size={16} color="$colorMuted" />
              <Text fontSize="$4">{getTimeSince(order.inserted_at)} minutes ago</Text>
            </XStack>
          </YStack>

          <Separator marginBottom="$4" />

          {/* Order Items */}
          <YStack gap="$2" marginBottom="$4">
            <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Order Items</Text>
            <YStack gap="$2">
              {order.items.map((item) => (
                <XStack key={item.id} justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Text fontSize="$4" fontWeight="bold">{item.quantity}x</Text>
                    <Text fontSize="$4">{item.menu_item?.name}</Text>
                  </XStack>
                  <Text fontSize="$4" color="$colorMuted">
                    {formatPriceFromMinor(item.subtotal, order.currency)}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </YStack>

          <Separator marginBottom="$4" />

          {/* Payment */}
          <YStack gap="$2" marginBottom="$4">
            <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Payment</Text>
            <XStack gap="$2" alignItems="center">
              {getPaymentIcon(order.payment_mode)}
              <Text fontSize="$4" textTransform="capitalize">
                {order.payment_mode?.replace("_", " ")}
              </Text>
              {order.is_paid && (
                <XStack gap="$1" alignItems="center" marginLeft="$2">
                  <CheckCircle size={14} color="$green10" />
                  <Text fontSize="$3" color="$green10" fontWeight="600">Paid</Text>
                </XStack>
              )}
            </XStack>
          </YStack>

          <Separator marginBottom="$4" />

          {/* Total */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <Text fontSize="$5" fontWeight="bold">Total</Text>
            <Text fontSize="$6" fontWeight="bold" color="$primary">
              {formatPriceFromMinor(order.total_minor, order.currency)}
            </Text>
          </XStack>

          {/* Close Button */}
          <Button flex={1} variant="outline" onPress={onClose}>
            <Text fontWeight="bold">Close</Text>
          </Button>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
}
