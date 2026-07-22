// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from "tamagui";
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  FileText,
  User,
} from "@tamagui/lucide-icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPriceFromMinor } from "@/utils/currency";
import type { SellerOrder } from "@/types/api";

interface PendingOrderCardProps {
  order: SellerOrder;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onStartPreparing: (orderId: string) => void;
  onViewDetails: (order: SellerOrder) => void;
  getTimeSince: (dateString: string | null | undefined) => number;
}

export function PendingOrderCard({
  order,
  onAccept,
  onReject,
  onStartPreparing,
  onViewDetails,
  getTimeSince,
}: PendingOrderCardProps) {
  const isAccepted = order.status === "accepted";

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
          <Text fontSize="$5" fontWeight="bold">
            {formatPriceFromMinor(order.total_minor, order.currency)}
          </Text>
          {isAccepted ? (
            <Button
              height="$12"
              $lg={{ height: "$12" }}
              backgroundColor="$warning"
              onPress={() => onStartPreparing(order.id)}
              icon={<ChefHat size={18} color="white" />}
            >
              <Text color="white" fontWeight="bold">START PREPARING</Text>
            </Button>
          ) : (
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
          )}
        </XStack>
      </YStack>
    </Card>
  );
}
