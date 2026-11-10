// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  Sheet,
  Separator,
  Spinner,
} from "tamagui";
import {
  Check,
  ChevronRight,
  Circle,
  SkipForward,
  X,
  Rocket,
  Clock,
  CreditCard,
  Utensils,
  Banknote,
  Crown,
  Store,
} from "@tamagui/lucide-icons";
import { toast } from "sonner-native";
import { Button } from "@/components/ui";
import { useSellerSetupStore } from "@/stores/seller-setup.store";
import { SELLER_SETUP_STEPS } from "@/constants/seller-setup";
import {
  useEnableOnlineOrdering,
  type SellerSetupGuide,
} from "@/hooks/useSellerSetupGuide";

const STEP_ICONS = {
  profile: Store,
  hours: Clock,
  plan: Crown,
  payments: CreditCard,
  menu: Utensils,
  cash_sale: Banknote,
  online_ordering: Rocket,
};

const BLOCKER_LABELS: Record<string, string> = {
  business_inactive: "Your business is waiting for approval.",
  kyc_not_approved: "Business verification must be approved first.",
  plan_missing_online_orders: "Your current plan does not include online orders.",
  operating_hours_missing: "Set your operating hours first.",
  cash_payment_not_enabled: "Enable cash in payment settings first.",
  menu_empty: "Add at least one menu item first.",
};

function blockerRoute(blocker: string, businessId: string) {
  switch (blocker) {
    case "kyc_not_approved":
      return `/(shared)/kyc?type=business&id=${businessId}`;
    case "plan_missing_online_orders":
      return "/(shared)/wallet/plans";
    case "operating_hours_missing":
      return "/(shared)/settings/operating-hours";
    case "cash_payment_not_enabled":
      return "/(seller)/settings/payment-settings";
    case "menu_empty":
      return "/(seller)/(drawer)/menu";
    default:
      return null;
  }
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <YStack gap="$2">
      <XStack height={8} borderRadius="$full" backgroundColor="$backgroundSoft" overflow="hidden">
        <YStack width={`${percent}%`} height="100%" backgroundColor="$primary" />
      </XStack>
      <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
        {percent}% complete
      </Text>
    </YStack>
  );
}

function StepRow({
  step,
  state,
  active,
  onPress,
  onSkip,
}: {
  step: (typeof SELLER_SETUP_STEPS)[number];
  state: "complete" | "skipped" | "pending";
  active: boolean;
  onPress: () => void;
  onSkip?: () => void;
}) {
  const Icon = STEP_ICONS[step.id] ?? Circle;
  const complete = state === "complete";
  const skipped = state === "skipped";

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <XStack
        gap="$3"
        alignItems="center"
        paddingVertical="$3"
        paddingHorizontal="$2"
        borderRadius="$3"
        backgroundColor={active ? "$backgroundSoft" : "transparent"}
      >
        <YStack
          width={34}
          height={34}
          borderRadius="$full"
          alignItems="center"
          justifyContent="center"
          backgroundColor={complete ? "$green3" : skipped ? "$backgroundSoft" : "$backgroundSoft"}
        >
          {complete ? (
            <Check size={18} color="$green10" />
          ) : skipped ? (
            <SkipForward size={16} color="$colorMuted" />
          ) : (
            <Icon size={18} color={active ? "$primary" : "$colorMuted"} />
          )}
        </YStack>

        <YStack flex={1} gap="$0.5">
          <Text
            fontSize="$4"
            fontWeight={active ? "700" : "600"}
            color={skipped ? "$colorMuted" : "$color"}
            fontFamily="$heading"
            textDecorationLine={skipped ? "line-through" : "none"}
          >
            {step.title}
          </Text>
          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
            {skipped ? "Skipped" : step.description}
          </Text>
        </YStack>

        {complete ? null : (
          <XStack gap="$1" alignItems="center">
            {active ? <ChevronRight size={18} color="$primary" /> : null}
            {onSkip ? (
              <Button
                size="$2"
                variant="ghost"
                onPress={(event) => {
                  event.stopPropagation?.();
                  onSkip();
                }}
              >
                <Text fontSize="$2" color="$colorMuted">
                  Skip
                </Text>
              </Button>
            ) : null}
          </XStack>
        )}
      </XStack>
    </Pressable>
  );
}

export function SellerSetupGuideSheet({
  open,
  onOpenChange,
  businessId,
  businessName,
  guide,
  startWithOnlinePrompt = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName?: string;
  guide: SellerSetupGuide;
  startWithOnlinePrompt?: boolean;
}) {
  const router = useRouter();
  const [onlinePromptOpen, setOnlinePromptOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const enableOnlineOrderingMutation = useEnableOnlineOrdering(businessId);

  const markWelcomeSeen = useSellerSetupStore((s) => s.markWelcomeSeen);
  const markProfileReviewed = useSellerSetupStore((s) => s.markProfileReviewed);
  const markStepComplete = useSellerSetupStore((s) => s.markStepComplete);
  const skipStep = useSellerSetupStore((s) => s.skipStep);
  const declineOnlineOrdering = useSellerSetupStore((s) => s.declineOnlineOrdering);
  const completeGuide = useSellerSetupStore((s) => s.completeGuide);
  const dismissGuide = useSellerSetupStore((s) => s.dismissGuide);

  const blockers = guide.status?.blockers ?? [];
  const actionableBlocker = useMemo(
    () => blockers.find((blocker) => blockerRoute(blocker, businessId)),
    [blockers, businessId],
  );

  useEffect(() => {
    if (!open) return;
    if (!guide.progress.welcomeSeenAt) {
      setShowWelcome(true);
      markWelcomeSeen(businessId);
    }
    if (startWithOnlinePrompt) {
      setOnlinePromptOpen(true);
    }
  }, [open, startWithOnlinePrompt, businessId, guide.progress.welcomeSeenAt, markWelcomeSeen]);

  useEffect(() => {
    if (guide.allAnswered && guide.progress.startedAt && !guide.progress.completedAt && !guide.progress.dismissedAt) {
      completeGuide(businessId);
    }
  }, [guide.allAnswered, guide.progress.startedAt, guide.progress.completedAt, guide.progress.dismissedAt, businessId, completeGuide]);

  const close = () => {
    setOnlinePromptOpen(false);
    onOpenChange(false);
  };

  const handleStep = (stepId: string) => {
    switch (stepId) {
      case "profile":
        markProfileReviewed(businessId);
        close();
        router.push(`/(shared)/businesses/${businessId}`);
        break;
      case "hours":
        close();
        router.push("/(shared)/settings/operating-hours");
        break;
      case "plan":
        close();
        router.push("/(shared)/wallet/plans");
        break;
      case "payments":
        close();
        router.push("/(seller)/settings/payment-settings");
        break;
      case "menu":
        close();
        router.push("/(seller)/(drawer)/menu");
        break;
      case "cash_sale":
        close();
        router.push("/(seller)/pos");
        break;
      case "online_ordering":
        setOnlinePromptOpen(true);
        break;
    }
  };

  const handleSkipStep = (stepId: string) => {
    if (stepId === "online_ordering") {
      declineOnlineOrdering(businessId);
      completeGuide(businessId);
      toast("You can turn on online ordering any time from the dashboard.");
      close();
      return;
    }
    skipStep(businessId, stepId);
    toast(`${SELLER_SETUP_STEPS.find((step) => step.id === stepId)?.title ?? "Step"} skipped.`);
  };

  const enableOnlineOrdering = async () => {
    try {
      await enableOnlineOrderingMutation.mutateAsync();
      toast.success("Online ordering is on. You're live!");
      setOnlinePromptOpen(false);
      close();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not enable online ordering.",
      );
    }
  };

  const acceptOnlineOrdering = () => {
    if (guide.status?.online_ordering_enabled) {
      markStepComplete(businessId, "online_ordering");
      completeGuide(businessId);
      setOnlinePromptOpen(false);
      close();
      return;
    }
    if (guide.status?.ready_for_online_orders) {
      void enableOnlineOrdering();
      return;
    }
    if (actionableBlocker) {
      const route = blockerRoute(actionableBlocker, businessId);
      setOnlinePromptOpen(false);
      close();
      if (route) router.push(route);
      return;
    }
    toast.error("Setup is not ready for online orders yet. Check the items above.");
  };

  return (
    <>
      <Sheet
        modal
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(true) : close())}
        snapPoints={[88]}
        position={0}
        dismissOnSnapToBottom
        zIndex={300_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(15, 23, 42, 0.45)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$8"
          borderTopRightRadius="$8"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <Sheet.ScrollView showsVerticalScrollIndicator={false}>
            <YStack padding="$5" paddingBottom="$10" gap="$4">
              <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
                <YStack flex={1} gap="$1">
                  <Text fontSize="$2" color="$primary" fontWeight="700" fontFamily="$body">
                    FIRST-TIME SETUP
                  </Text>
                  <Text fontSize="$7" fontWeight="800" fontFamily="$heading">
                    {businessName ? `Get ${businessName} ready` : "Get your business ready"}
                  </Text>
                </YStack>
                <Button
                  circular
                  size="$3"
                  variant="ghost"
                  icon={<X size={20} />}
                  onPress={close}
                />
              </XStack>

              {showWelcome ? (
                <YStack
                  padding="$4"
                  gap="$2"
                  backgroundColor="$orangeMuted"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$orange"
                >
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                    Welcome! This takes about 5 minutes.
                  </Text>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    Work through the checklist at your own pace. You can skip
                    optional steps and come back to this guide from Settings.
                  </Text>
                  <Button
                    size="$3"
                    variant="ghost"
                    alignSelf="flex-start"
                    onPress={() => setShowWelcome(false)}
                  >
                    Got it
                  </Button>
                </YStack>
              ) : null}

              <ProgressBar percent={guide.percent} />

              <YStack>
                {SELLER_SETUP_STEPS.map((step, index) => {
                  const state = guide.stepStates[step.id];
                  const isNext = guide.nextStepId === step.id;
                  return (
                    <YStack key={step.id}>
                      <StepRow
                        step={step}
                        state={state}
                        active={isNext}
                        onPress={() => handleStep(step.id)}
                        onSkip={
                          step.optional && state === "pending"
                            ? () => handleSkipStep(step.id)
                            : undefined
                        }
                      />
                      {index < SELLER_SETUP_STEPS.length - 1 ? <Separator /> : null}
                    </YStack>
                  );
                })}
              </YStack>

              {guide.nextStepId ? (
                <Button
                  variant="primary"
                  onPress={() => handleStep(guide.nextStepId as string)}
                >
                  Continue setup
                </Button>
              ) : (
                <YStack
                  padding="$4"
                  gap="$2"
                  backgroundColor="$green3"
                  borderRadius="$4"
                >
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                    You're all set
                  </Text>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    Your checklist is complete. You can still change these
                    settings any time.
                  </Text>
                </YStack>
              )}

              <Button
                variant="ghost"
                onPress={() => {
                  dismissGuide(businessId);
                  toast("Setup guide skipped. You can reopen it from Settings.");
                  close();
                }}
              >
                <Text color="$colorMuted">Skip setup</Text>
              </Button>
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>

      <Sheet
        modal
        open={onlinePromptOpen}
        onOpenChange={setOnlinePromptOpen}
        snapPoints={[65]}
        position={0}
        dismissOnSnapToBottom
        zIndex={310_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(15, 23, 42, 0.45)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$8"
          borderTopRightRadius="$8"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <Sheet.ScrollView>
            <YStack padding="$5" paddingBottom="$10" gap="$4">
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={44}
                  height={44}
                  borderRadius="$full"
                  backgroundColor="$green3"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Rocket size={22} color="$green10" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
                    Accept online orders?
                  </Text>
                  <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
                    You can turn this on now and start receiving orders.
                  </Text>
                </YStack>
              </XStack>

              {guide.isLoading ? (
                <XStack gap="$2" alignItems="center">
                  <Spinner size="small" />
                  <Text color="$colorMuted">Checking your setup…</Text>
                </XStack>
              ) : blockers.length > 0 ? (
                <YStack gap="$2" padding="$4" backgroundColor="$backgroundSoft" borderRadius="$4">
                  <Text fontSize="$3" fontWeight="700" fontFamily="$heading">
                    A few things first
                  </Text>
                  {blockers.map((blocker) => (
                    <XStack key={blocker} gap="$2" alignItems="flex-start">
                      <Circle size={8} color="$star" marginTop={6} />
                      <Text flex={1} fontSize="$3" color="$colorSecondary" fontFamily="$body">
                        {BLOCKER_LABELS[blocker] ?? blocker}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              ) : guide.status?.online_ordering_enabled ? (
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Online ordering is already on. You're live.
                </Text>
              ) : (
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Your profile, hours, payments and menu are ready. Turn on
                  online ordering to go live.
                </Text>
              )}

              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  disabled={enableOnlineOrderingMutation.isPending}
                  onPress={() => {
                    declineOnlineOrdering(businessId);
                    completeGuide(businessId);
                    setOnlinePromptOpen(false);
                    close();
                    toast("No problem. You can turn on online ordering later.");
                  }}
                >
                  Not now
                </Button>
                <Button
                  flex={1}
                  variant="success"
                  loading={enableOnlineOrderingMutation.isPending}
                  disabled={guide.isLoading}
                  onPress={acceptOnlineOrdering}
                >
                  {blockers.length > 0 && actionableBlocker ? "Fix now" : "Yes, go live"}
                </Button>
              </XStack>
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}
