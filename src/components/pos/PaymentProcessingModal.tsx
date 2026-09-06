// @ts-nocheck
import { Modal } from "react-native";
import { ActivityIndicator } from "react-native";
import { YStack, XStack, Text, Button } from "tamagui";
import { CheckCircle, XCircle } from "@tamagui/lucide-icons";
import { formatPriceFromMinor } from "@teincfood/core";
import type { POSPaymentState } from "@/hooks/usePOSPaymentFlow";

interface PaymentProcessingModalProps {
  open: boolean;
  state: POSPaymentState;
  errorMsg: string | null;
  orderNumber?: string | null;
  amountMinor: number;
  currency?: string;
  onClose: () => void;
}

export function PaymentProcessingModal({
  open,
  state,
  errorMsg,
  orderNumber,
  amountMinor,
  currency = "GHS",
  onClose,
}: PaymentProcessingModalProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" alignItems="center" justifyContent="center" padding="$5">
        <YStack
          width="100%"
          maxWidth={360}
          backgroundColor="$background"
          borderRadius="$6"
          padding="$5"
          gap="$4"
          alignItems="center"
        >
          {state === "initiating" && (
            <>
              <ActivityIndicator size="large" color="$primary" />
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color" textAlign="center">
                Initiating Payment
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
                Please wait...
              </Text>
            </>
          )}

          {state === "awaiting_confirmation" && (
            <>
              <ActivityIndicator size="large" color="$primary" />
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color" textAlign="center">
                Processing Payment
              </Text>
              {orderNumber && (
                <Text fontSize="$4" fontFamily="$body" color="$colorSecondary" textAlign="center">
                  Order #{orderNumber}
                </Text>
              )}
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$primary" textAlign="center">
                {formatPriceFromMinor(amountMinor, currency)}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
                Paystack checkout is open in your browser. Please wait while we verify your payment.
              </Text>
              <Button
                backgroundColor="$red"
                height={44}
                width="100%"
                pressStyle={{ backgroundColor: "$red10" }}
                onPress={onClose}
              >
                <Text color="white" fontSize="$4" fontWeight="700" fontFamily="$body">
                  Cancel
                </Text>
              </Button>
            </>
          )}

          {state === "success" && (
            <>
              <YStack backgroundColor="$success" padding="$3" borderRadius="$full">
                <CheckCircle size={36} color="white" />
              </YStack>
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color" textAlign="center">
                Payment Confirmed
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
                {formatPriceFromMinor(amountMinor, currency)} received
              </Text>
            </>
          )}

          {state === "failed" && (
            <>
              <YStack backgroundColor="$red" padding="$3" borderRadius="$full">
                <XCircle size={36} color="white" />
              </YStack>
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color" textAlign="center">
                Payment Failed
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
                {errorMsg || "Payment could not be completed. The order is still in progress."}
              </Text>
              <Button
                backgroundColor="$primary"
                height={44}
                width="100%"
                pressStyle={{ opacity: 0.8 }}
                onPress={onClose}
              >
                <Text color="white" fontSize="$4" fontWeight="700" fontFamily="$body">
                  Done
                </Text>
              </Button>
            </>
          )}
        </YStack>
      </YStack>
    </Modal>
  );
}
