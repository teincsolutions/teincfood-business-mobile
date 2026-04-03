// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from "tamagui";
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "@tamagui/lucide-icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/utils/currency";
import type { KioskOrder } from "@/services/mock-data.service";

interface PendingOrderCardProps {
  order: KioskOrder;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onViewDetails: (order: KioskOrder) => void;
  getTimeSince: (dateString: string) => number;
}

export function PendingOrderCard({
  order,
  onAccept,
  onReject,
  onViewDetails,
  getTimeSince,
}: PendingOrderCardProps) {
  return (
    <Card
      padding="$4"
      bordered
      backgroundColor="$backgroundOrange"
      borderColor="$primary"
      borderWidth={1}
      onPress={() => onViewDetails(order)}
      pressStyle={{ opacity: 0.8 }}
      cursor="pointer"
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

        <Badge
          backgroundColor="$primary"
          size="$2"
          alignSelf="flex-start"
        >
          <Text color="white" fontSize="$1" fontWeight="bold">
            PENDING
          </Text>
        </Badge>

        <YStack gap="$1">
          {order.items.map((item, index) => (
            <XStack key={index} justifyContent="space-between">
              <Text fontSize="$3">
                {item.quantity}x {item.name}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                {formatPrice(item.price * item.quantity, order.currency)}
              </Text>
            </XStack>
          ))}
        </YStack>

        {order.specialInstructions && (
          <XStack gap="$2" alignItems="flex-start">
            <FileText size={14} color="$info" />
            <Text fontSize="$2" color="$info" flex={1}>
              {order.specialInstructions}
            </Text>
          </XStack>
        )}

        <Separator />

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold">
            {formatPrice(order.total, order.currency)}
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
