// @ts-nocheck
import { YStack, XStack, Text } from "tamagui";
import {
  ClipboardList,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
} from "@tamagui/lucide-icons";

const STEPS = [
  { key: "assigned", label: "Assigned", icon: ClipboardList },
  { key: "picked_up", label: "Picked Up", icon: Package },
  { key: "en_route", label: "En Route", icon: Truck },
  { key: "arrived", label: "Arrived", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export function getDeliveryStepIndex(status: string): number {
  return STEPS.findIndex((s) => s.key === status);
}

interface DeliveryTimelineProps {
  currentStep: number;
  status?: string;
}

export function DeliveryTimeline({ currentStep, status }: DeliveryTimelineProps) {
  const terminalStatus = status === "failed" || status === "returned_to_merchant" || status === "cancelled";

  if (terminalStatus) {
    const label =
      status === "cancelled" ? "Cancelled" :
      status === "returned_to_merchant" ? "Returned to Merchant" :
      "Delivery Failed";
    return (
      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
          Delivery Timeline
        </Text>
        <YStack alignItems="center" paddingVertical="$3" gap="$2">
          <YStack
            width={36}
            height={36}
            borderRadius="$full"
            backgroundColor="$red"
            justifyContent="center"
            alignItems="center"
          >
            <XCircle size={20} color="white" />
          </YStack>
          <Text fontSize="$3" fontWeight="700" color="$red">
            {label}
          </Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$2">
      <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
        Delivery Timeline
      </Text>
      <YStack>
        {STEPS.map((step, i) => {
          const completed = currentStep >= 0 && i <= currentStep;
          const current = i === currentStep;
          const StepIcon = step.icon;

          return (
            <XStack key={step.key} gap="$3" alignItems="flex-start">
              <YStack alignItems="center" width={28}>
                <YStack
                  width={28}
                  height={28}
                  borderRadius="$full"
                  backgroundColor={completed ? "$primary" : "$gray200"}
                  justifyContent="center"
                  alignItems="center"
                  borderWidth={current ? 2 : 0}
                  borderColor="$primary"
                >
                  <StepIcon
                    size={15}
                    color={completed ? "white" : "$gray400"}
                  />
                </YStack>
                {i < STEPS.length - 1 && (
                  <YStack
                    width={2}
                    height={20}
                    backgroundColor={completed ? "$primary" : "$gray200"}
                  />
                )}
              </YStack>
              <YStack flex={1} paddingBottom="$1" paddingTop="$1">
                <Text
                  fontSize="$3"
                  fontWeight={current ? "700" : "400"}
                  color={completed ? "$color" : "$colorSecondary"}
                >
                  {step.label}
                </Text>
                {current && (
                  <Text fontSize="$2" color="$primary">
                    Current status
                  </Text>
                )}
              </YStack>
            </XStack>
          );
        })}
      </YStack>
    </YStack>
  );
}
