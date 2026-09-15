// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from "tamagui";
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  FileText,
  User,
  Printer,
  Banknote,
  Smartphone,
} from "@tamagui/lucide-icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPriceFromMinor } from "@teincfood/core";
import type { SellerOrder } from "@teincfood/core";
import { isUnpaid, isCancellable, cancelLabelFor } from "@teincfood/core";

interface PendingOrderCardProps {
  order: SellerOrder;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onStartPreparing: (orderId: string) => void;
  onViewDetails: (order: SellerOrder) => void;
  onPrint?: (orderId: string) => void;
  onCollectCash?: (order: SellerOrder) => void;
  onPay?: (order: SellerOrder) => void;
  onCancel?: (order: SellerOrder) => void;
  collectingOrderId?: string | null;
  payingOrderId?: string | null;
  getTimeSince: (dateString: string | null | undefined) => number;
}

export function PendingOrderCard({
  order,
  onAccept,
  onReject,
  onStartPreparing,
  onViewDetails,
  onPrint,
  onCollectCash,
  onPay,
  onCancel,
  collectingOrderId,
  payingOrderId,
  getTimeSince,
}: PendingOrderCardProps) {
  const isAccepted = order.status === "accepted";
  const showCollectCash = onCollectCash && isUnpaid(order) && order.status !== "cancelled";
  const showPay = onPay && order.status === "awaiting_payment";
  const showCancel = onCancel && isCancellable(order.status);

  return (
    <Card
      padding="$4"
      bordered
      backgroundColor={isAccepted ? "$yellow2" : "$backgroundOrange"}
      borderColor={isAccepted ? "$warning" : "$primary"}
      borderWidth={1}
      onPress={() => onViewDetails(order)}
      pressStyle={{ opacity: 0.8 }}
      cursor="pointer"
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$6" fontWeight="bold">
              {order.order_number}
            </Text>
            {(order.callout_number != null || order.order_number) && (
              <Text fontSize="$2" color="$primary" fontWeight="700">
                Callout #{order.callout_number ?? order.order_number.slice(-3)}
              </Text>
            )}
          </YStack>
          <XStack gap="$2" alignItems="center">
            <Clock size={14} color="$colorMuted" />
            <Text fontSize="$2" color="$colorMuted">
              {getTimeSince(order.inserted_at)}m ago
            </Text>
          </XStack>
        </XStack>

        <Badge
          backgroundColor={isAccepted ? "$warning" : "$primary"}
          size="$2"
          alignSelf="flex-start"
        >
          <Text color="white" fontSize="$1" fontWeight="bold">
            {isAccepted ? "ACCEPTED" : "PENDING"}
          </Text>
        </Badge>

        {(order.customer_name || order.user?.full_name) && (
          <XStack gap="$1" alignItems="center">
            <User size={14} color="$colorMuted" />
            <Text fontSize="$3" color="$colorMuted">
              {order.customer_name || order.user.full_name}
            </Text>
          </XStack>
        )}

        <YStack gap="$1">
          {order.items.map((item, index) => {
            const variantName = (item as any).variant_name || (item as any).selected_variant?.name;
            const addons = (item as any).addons || (item as any).selected_addons || [];
            return (
              <YStack key={item.id} gap="$1">
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" flex={1} numberOfLines={2}>
                    {item.quantity}x {item.menu_item?.name} {variantName ? `· ${variantName}` : ""}
                  </Text>
                  <Text fontSize="$3" color="$colorMuted">
                    {formatPriceFromMinor(item.subtotal, order.currency)}
                  </Text>
                </XStack>
                {addons.length > 0 && (
                  <Text fontSize="$2" color="$colorMuted" paddingLeft="$2">
                    + {addons.map((a: any) => a.name).join(", ")}
                  </Text>
                )}
              </YStack>
            );
          })}
        </YStack>

        {order.notes && (
          <XStack gap="$2" alignItems="flex-start">
            <FileText size={14} color="$info" />
            <Text fontSize="$2" color="$info" flex={1}>
              {order.notes}
            </Text>
          </XStack>
        )}

        <Separator />

        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$5" fontWeight="bold">
              {formatPriceFromMinor(order.total_minor, order.currency)}
            </Text>
            {onPrint && (
              <Button
                height={32}
                width={36}
                padding={0}
                variant="outline"
                borderColor="$borderColor"
                backgroundColor="$background"
                onPress={() => onPrint(order.id)}
              >
                <Printer size={14} color="$color" />
              </Button>
            )}
          </XStack>
          <XStack gap="$2" flexWrap="wrap" justifyContent="flex-end">
            {showPay && (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                disabled={!!payingOrderId}
                opacity={payingOrderId ? 0.4 : 1}
                onPress={() => onPay!(order)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">{payingOrderId === order.id ? "Paying…" : "Pay now"}</Text>
              </Button>
            )}
            {showCollectCash && (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                disabled={!!collectingOrderId}
                opacity={collectingOrderId ? 0.4 : 1}
                onPress={() => onCollectCash!(order)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">{collectingOrderId === order.id ? "Recording…" : "Collect cash"}</Text>
              </Button>
            )}
            {!isAccepted && (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="white"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                onPress={() => onReject(order.id)}
              >
                <Text fontSize="$3" fontWeight="700" color="$error">Reject</Text>
              </Button>
            )}
            {(order.status === "pending") && (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                onPress={() => onAccept(order.id)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">Accept</Text>
              </Button>
            )}
            {(order.status === "pending" || order.status === "accepted") && (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                onPress={() => onStartPreparing(order.id)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">Start preparing</Text>
              </Button>
            )}
            {showCancel && (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="white"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                onPress={() => onCancel!(order)}
              >
                <Text fontSize="$3" fontWeight="700" color="$error">{cancelLabelFor(order.status)}</Text>
              </Button>
            )}
          </XStack>
        </XStack>
      </YStack>
    </Card>
  );
}
