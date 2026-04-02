// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from "tamagui";
import {
  Clock,
  DollarSign,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
} from "@tamagui/lucide-icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { KioskOrder } from "@/services/mock-data.service";

interface PendingOrderCardProps {
  order: KioskOrder;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  getTimeSince: (dateString: string) => number;
}

export function PendingOrderCard({
  order,
  onAccept,
  onReject,
  getTimeSince,
}: PendingOrderCardProps) {
  const getPaymentIcon = (method: string) => {
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
    <Card
      padding="$4"
      bordered
      backgroundColor="$orangeLight"
      borderColor="$primary"
      borderWidth={1}
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="bold">
            {order.orderNumber}
          </Text>
          <XStack gap="$2" alignItems="center">
            <Clock size={14} color="$colorMuted" />
            <Text fontSize="$2" color="$colorMuted">
              {getTimeSince(order.createdAt)}m ago
            </Text>
          </XStack>
        </XStack>

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3">{order.customerName}</Text>
          <XStack gap="$2" alignItems="center">
            {getPaymentIcon(order.paymentMethod)}
            <Badge
              backgroundColor={
                order.paymentStatus === "paid" ? "$success" : "$error"
              }
              size="$2"
            >
              <Text color="white" fontSize="$1">
                {order.paymentStatus === "paid" ? "PAID" : "UNPAID"}
              </Text>
            </Badge>
          </XStack>
        </XStack>

        <YStack gap="$1">
          {order.items.map((item, index) => (
            <XStack key={index} justifyContent="space-between">
              <Text fontSize="$3">
                {item.quantity}x {item.name}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                GHS {(item.price * item.quantity).toFixed(2)}
              </Text>
            </XStack>
          ))}
        </YStack>

        <Separator />

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold">
            GHS {order.total.toFixed(2)}
          </Text>
          <XStack gap="$2">
            <Button
              size="$1.5"
              height="$8"
              $lg={{ height: "$12" }}
              backgroundColor="$error"
              onPress={() => onReject(order.id)}
              icon={<XCircle size={18} color="white" />}
            >
              <Text color="white" fontWeight="bold">
                REJECT
              </Text>
            </Button>
            <Button
              size="$1.5"
              height="$8"
              $lg={{ height: "$12" }}
              backgroundColor="$success"
              onPress={() => onAccept(order.id)}
              icon={<CheckCircle size={18} color="white" />}
            >
              <Text color="white" fontWeight="bold">
                ACCEPT
              </Text>
            </Button>
          </XStack>
        </XStack>
      </YStack>
    </Card>
  );
}
