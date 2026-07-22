// @ts-nocheck
import { Card, Text, XStack, YStack } from "tamagui";
import { Clock } from "@tamagui/lucide-icons";
import type { SellerOrder } from "@/types/api/seller.api";

interface CalloutCardProps {
  order: SellerOrder;
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const STATUS_STYLES: Record<string, { border: string; bg: string; badgeBg: string; label: string }> = {
  pending: { border: "$orange8", bg: "$orange2", badgeBg: "$orange10", label: "Pending" },
  accepted: { border: "$orange8", bg: "$orange2", badgeBg: "$orange10", label: "Pending" },
  preparing: { border: "$blue8", bg: "$blue2", badgeBg: "$blue10", label: "Preparing" },
  ready: { border: "$green8", bg: "$green2", badgeBg: "$green10", label: "Ready" },
};

export function CalloutCard({ order }: CalloutCardProps) {
  const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;

  return (
    <Card
      padding="$5"
      backgroundColor={style.bg}
      borderLeftWidth={8}
      borderLeftColor={style.border}
      borderRadius="$5"
      elevate
    >
      <YStack gap="$2" alignItems="center">
        <Text fontSize="$9" fontWeight="900" fontFamily="$heading" color="$color" letterSpacing={3}>
          #{order.callout_number}
        </Text>
        {order.customer_name && (
          <Text fontSize="$5" fontFamily="$body" color="$colorSecondary" numberOfLines={1}>
            {order.customer_name}
          </Text>
        )}
        <XStack
          backgroundColor={style.badgeBg}
          paddingHorizontal="$3"
          paddingVertical="$1"
          borderRadius="$full"
        >
          <Text color="white" fontSize="$3" fontWeight="700" textTransform="uppercase">
            {style.label}
          </Text>
        </XStack>
        <XStack gap="$1" alignItems="center" marginTop="$1">
          <Clock size={14} color="$colorMuted" />
          <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
            {timeAgo(order.inserted_at)}
          </Text>
        </XStack>
      </YStack>
    </Card>
  );
}
