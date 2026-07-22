// @ts-nocheck
import { Card, Text, XStack, YStack } from "tamagui";
import type { SellerOrder } from "@/types/api/seller.api";

interface CalloutCardProps {
  order: SellerOrder;
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
      padding="$1.5"
      backgroundColor={style.bg}
      borderLeftWidth={4}
      borderLeftColor={style.border}
      borderRadius="$3"
    >
      <YStack gap="$1" alignItems="center">
        <Text fontSize="$10" fontWeight="800" fontFamily="$heading" color="$color" letterSpacing={2}>
          #{order.callout_number}
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