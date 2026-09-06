// @ts-nocheck
import { Card, Text, XStack, YStack } from "tamagui";
import type { SellerOrder } from "@teincfood/core";

interface CalloutCardProps {
  order: SellerOrder;
}

const STATUS_STYLES: Record<string, { border: string; bg: string; badgeBg: string; label: string }> = {
  pending: { border: "$primary", bg: "$backgroundOrange", badgeBg: "$primary", label: "Pending" },
  accepted: { border: "$primary", bg: "$backgroundOrange", badgeBg: "$primary", label: "Pending" },
  preparing: { border: "$info", bg: "$infoMuted", badgeBg: "$info", label: "Preparing" },
  ready: { border: "$success", bg: "$successMuted", badgeBg: "$success", label: "Ready" },
};

export function CalloutCard({ order }: CalloutCardProps) {
  const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const displayNumber =
    order.callout_number != null && order.callout_number !== 0
      ? String(order.callout_number)
      : order.order_number
        ? order.order_number.slice(-3)
        : "--";

  return (
    <Card
      padding="$1.5"
      backgroundColor={style.bg}
      borderLeftWidth={4}
      borderLeftColor={style.border}
      borderRadius="$3"
      bordered
    >
      <YStack gap="$1" alignItems="center">
        <Text fontSize="$10" fontWeight="800" fontFamily="$heading" color="$color" letterSpacing={2}>
          {`#${displayNumber}`}
        </Text>
        <XStack
          backgroundColor={style.badgeBg}
          paddingHorizontal="$1.5"
          paddingVertical="$0.5"
          borderRadius="$full"
        >
          <Text color="white" fontSize="$1" fontWeight="700" textTransform="uppercase">
            {style.label}
          </Text>
        </XStack>
      </YStack>
    </Card>
  );
}