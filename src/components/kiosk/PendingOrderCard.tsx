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
          <Text fontSize="$6" fontWeight="bold">
            {order.order_number}
          </Text>
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
          {order.items.map((item, index) => (
            <XStack key={item.id} justifyContent="space-between">
              <Text fontSize="$3">
                {item.quantity}x {item.menu_item?.name}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                {formatPriceFromMinor(item.subtotal, order.currency)}
              </Text>
            </XStack>
          ))}
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
              <Button size="$2" variant="outline" onPress={() => onPrint(order.id)}>
                <Printer size={14} />
              </Button>
            )}
          </XStack>
          <XStack gap="$2" flexWrap="wrap" justifyContent="flex-end">
            {showPay && (
              <Button
                size="$2"
                backgroundColor="$primary"
                disabled={!!payingOrderId}
                onPress={() => onPay!(order)}
                icon={<Smartphone size={14} color="white" />}
              >
                <Text color="white" fontWeight="bold">{payingOrderId === order.id ? "Paying…" : "Pay now"}</Text>
              </Button>
            )}
            {showCollectCash && (
              <Button
                size="$2"
                backgroundColor="$primary"
                disabled={!!collectingOrderId}
                onPress={() => onCollectCash!(order)}
                icon={<Banknote size={14} color="white" />}
              >
                <Text color="white" fontWeight="bold">{collectingOrderId === order.id ? "Recording…" : "Collect cash"}</Text>
              </Button>
            )}
            {isAccepted ? (
              <Button
                height="$8"
                $lg={{ height: "$10" }}
                backgroundColor="$warning"
                onPress={() => onStartPreparing(order.id)}
                icon={<ChefHat size={16} color="white" />}
              >
                <Text color="white" fontWeight="bold">START PREPARING</Text>
              </Button>
            ) : (
              <>
                <Button
                  size="$2"
                  backgroundColor="$error"
                  onPress={() => onReject(order.id)}
                  icon={<XCircle size={16} color="white" />}
                >
                  <Text color="white" fontWeight="bold">REJECT</Text>
                </Button>
                <Button
                  size="$2"
                  backgroundColor="$success"
                  onPress={() => onAccept(order.id)}
                  icon={<CheckCircle size={16} color="white" />}
                >
                  <Text color="white" fontWeight="bold">ACCEPT</Text>
                </Button>
              </>
            )}
            {showCancel && (
              <Button size="$2" variant="outline" onPress={() => onCancel!(order)}>
                <Text fontWeight="bold" color="$error">{cancelLabelFor(order.status)}</Text>
              </Button>
            )}
          </XStack>
        </XStack>
      </YStack>
    </Card>
  );
}
