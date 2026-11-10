// @ts-nocheck
import { YStack, XStack, Text, Card } from "tamagui";
import { Rocket, SkipForward, ChevronRight } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import { SELLER_SETUP_STEPS } from "@/constants/seller-setup";
import { useSellerSetupGuide } from "@/hooks/useSellerSetupGuide";
import { useSellerSetupStore } from "@/stores/seller-setup.store";

/**
 * A small contextual banner for a target screen. It only appears when this
 * step is the seller's next pending step, so it never covers unrelated work.
 */
export function SetupStepHint({
  stepId,
  businessId,
  onSkip,
  showAction = false,
}: {
  stepId: string;
  businessId?: string | null;
  onSkip?: () => void;
  showAction?: boolean;
}) {
  const router = useRouter();
  const guide = useSellerSetupGuide(businessId, Boolean(businessId));
  const skipStep = useSellerSetupStore((s) => s.skipStep);

  if (!guide.active || guide.nextStepId !== stepId) return null;

  const step = SELLER_SETUP_STEPS.find((item) => item.id === stepId);
  if (!step) return null;

  const handleSkip = () => {
    skipStep(businessId as string, step.id);
    onSkip?.();
  };

  return (
    <Card padding="$3" bordered borderColor="$primary" backgroundColor="$backgroundSoft">
      <XStack gap="$3" alignItems="center">
        <YStack
          width={34}
          height={34}
          borderRadius="$full"
          backgroundColor="$green3"
          alignItems="center"
          justifyContent="center"
        >
          <Rocket size={18} color="$green10" />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <Text fontSize="$2" color="$primary" fontWeight="700" fontFamily="$body">
            SETUP STEP
          </Text>
          <Text fontSize="$3" fontWeight="700" fontFamily="$heading">
            {step.title}
          </Text>
          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
            {step.description}
          </Text>
        </YStack>
        {step.optional ? (
          <Button size="$2" variant="ghost" onPress={handleSkip}>
            <XStack gap="$1" alignItems="center">
              <SkipForward size={14} color="$colorMuted" />
              <Text fontSize="$2" color="$colorMuted">
                Skip
              </Text>
            </XStack>
          </Button>
        ) : showAction ? (
          <Button
            size="$2"
            circular
            variant="ghost"
            icon={<ChevronRight size={18} color="$primary" />}
            onPress={() => router.push(step.id === "plan" ? "/(shared)/wallet/plans" : "/(seller)/(drawer)/dashboard")}
          />
        ) : null}
      </XStack>
    </Card>
  );
}
