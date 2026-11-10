// @ts-nocheck
import { YStack, XStack, Text, Card } from "tamagui";
import { Rocket, ChevronRight, CheckCircle } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import { SELLER_SETUP_STEPS } from "@/constants/seller-setup";
import type { SellerSetupGuide } from "@/hooks/useSellerSetupGuide";

export function SellerSetupCard({
  guide,
  onOpen,
}: {
  guide: SellerSetupGuide;
  onOpen: () => void;
}) {
  if (guide.hidden || guide.allAnswered) return null;
  const next = SELLER_SETUP_STEPS.find((step) => step.id === guide.nextStepId);

  return (
    <Card
      padding="$4"
      bordered
      borderColor="$primary"
      backgroundColor="$backgroundSoft"
    >
      <YStack gap="$3">
        <XStack gap="$3" alignItems="center">
          <YStack
            width={38}
            height={38}
            borderRadius="$full"
            backgroundColor="$green3"
            alignItems="center"
            justifyContent="center"
          >
            <Rocket size={20} color="$green10" />
          </YStack>
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
              Finish setting up
            </Text>
            <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
              {guide.completedCount} of {guide.totalCount} steps done
            </Text>
          </YStack>
          <Text fontSize="$4" fontWeight="800" color="$primary" fontFamily="$heading">
            {guide.percent}%
          </Text>
        </XStack>

        <XStack height={6} borderRadius="$full" backgroundColor="$background" overflow="hidden">
          <YStack width={`${guide.percent}%`} height="100%" backgroundColor="$primary" />
        </XStack>

        {next ? (
          <XStack gap="$2" alignItems="center">
            <CheckCircle size={16} color="$colorMuted" />
            <Text flex={1} fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Next: {next.title}
            </Text>
          </XStack>
        ) : null}

        <Button variant="primary" onPress={onOpen}>
          <XStack gap="$2" alignItems="center">
            <Text color="$white" fontWeight="700" fontFamily="$body">
              Continue setup
            </Text>
            <ChevronRight size={18} color="$white" />
          </XStack>
        </Button>
      </YStack>
    </Card>
  );
}
