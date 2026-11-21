// @ts-nocheck
import { useState } from "react";
import { Modal } from "react-native";
import { ActivityIndicator } from "react-native";
import { YStack, XStack, Text, Button } from "tamagui";
import { CheckCircle, X, XCircle } from "@tamagui/lucide-icons";
import { formatPriceFromMinor } from "@teincfood/core";
import { OTPInput } from "@/components/ui/OTPInput";
import type { POSPaymentState } from "@/hooks/usePOSPaymentFlow";

interface PaymentProcessingModalProps {
  open: boolean;
  state: POSPaymentState;
  errorMsg: string | null;
  orderNumber?: string | null;
  amountMinor: number;
  currency?: string;
  nextAction?: string | null;
  displayText?: string | null;
  isSubmittingOtp?: boolean;
  onSubmitOtp?: (otp: string) => void;
  /** Hide the modal but keep the charge polling in the background. */
  onDismiss: () => void;
  /** Abandon/reset the charge. */
  onCancel: () => void;
  /** Dismiss after a terminal (success/failed) state. */
  onClose: () => void;
}

export function PaymentProcessingModal({
  open,
  state,
  errorMsg,
  orderNumber,
  amountMinor,
  currency = "GHS",
  nextAction,
  displayText,
  isSubmittingOtp,
  onSubmitOtp,
  onDismiss,
  onCancel,
  onClose,
}: PaymentProcessingModalProps) {
  const [otp, setOtp] = useState("");
  const isPending =
    state === "initiating" || state === "awaiting_confirmation";

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={isPending ? onDismiss : onClose}
    >
      <YStack
        flex={1}
        backgroundColor="rgba(0,0,0,0.45)"
        alignItems="center"
        justifyContent="center"
        padding="$5"
      >
        <YStack
          width="100%"
          maxWidth={360}
          backgroundColor="$background"
          borderRadius="$6"
          padding="$5"
          paddingTop="$6"
          gap="$4"
          alignItems="center"
          position="relative"
        >
          {isPending ? (
            <XStack position="absolute" top="$2" right="$2" zIndex={10}>
              <Button
                chromeless
                circular
                size="$4"
                padding={0}
                accessibilityLabel="Hide payment status"
                icon={<X size={20} color="$color" />}
                onPress={onDismiss}
              />
            </XStack>
          ) : null}

          {state === "initiating" && (
            <>
              <ActivityIndicator size="large" color="$primary" />
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
                textAlign="center"
              >
                Initiating Payment
              </Text>
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$primary"
                textAlign="center"
              >
                {formatPriceFromMinor(amountMinor, currency)}
              </Text>
              <Text
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                Please wait...
              </Text>
              <Button
                variant="outline"
                height={44}
                width="100%"
                onPress={onDismiss}
              >
                Continue in background
              </Button>
            </>
          )}

          {state === "awaiting_confirmation" && (
            <>
              {nextAction === "submit_otp" ? (
                <Text
                  fontSize="$5"
                  fontWeight="800"
                  fontFamily="$heading"
                  color="$color"
                  textAlign="center"
                >
                  Enter Payment OTP
                </Text>
              ) : (
                <>
                  <ActivityIndicator size="large" color="$primary" />
                  <Text
                    fontSize="$5"
                    fontWeight="800"
                    fontFamily="$heading"
                    color="$color"
                    textAlign="center"
                  >
                    Approve on Customer&apos;s Phone
                  </Text>
                </>
              )}
              {orderNumber && (
                <Text
                  fontSize="$4"
                  fontFamily="$body"
                  color="$colorSecondary"
                  textAlign="center"
                >
                  Order #{orderNumber}
                </Text>
              )}
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$primary"
                textAlign="center"
              >
                {formatPriceFromMinor(amountMinor, currency)}
              </Text>
              <Text
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                {displayText ||
                  (nextAction === "submit_otp"
                    ? "Ask the customer for the OTP sent to their phone."
                    : "Ask the customer to approve the mobile-money prompt on their phone. This screen updates automatically.")}
              </Text>
              <Text
                fontSize="$2"
                color="$colorMuted"
                fontFamily="$body"
                textAlign="center"
              >
                You can hide this and keep taking orders while the customer
                approves.
              </Text>
              {nextAction === "submit_otp" ? (
                <>
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={(code) => onSubmitOtp?.(code)}
                  />
                  <Button
                    backgroundColor="$primary"
                    height={44}
                    width="100%"
                    disabled={otp.length < 4 || isSubmittingOtp}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => onSubmitOtp?.(otp)}
                  >
                    <Text
                      color="white"
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$body"
                    >
                      {isSubmittingOtp ? "VERIFYING..." : "SUBMIT OTP"}
                    </Text>
                  </Button>
                </>
              ) : null}
              <Button
                variant="outline"
                height={44}
                width="100%"
                disabled={isSubmittingOtp}
                onPress={onDismiss}
              >
                Continue in background
              </Button>
              <Button
                backgroundColor="$red"
                height={44}
                width="100%"
                disabled={isSubmittingOtp}
                pressStyle={{ backgroundColor: "$red10" }}
                onPress={onCancel}
              >
                <Text
                  color="white"
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$body"
                >
                  Cancel payment
                </Text>
              </Button>
            </>
          )}

          {state === "success" && (
            <>
              <YStack
                backgroundColor="$success"
                padding="$3"
                borderRadius="$full"
              >
                <CheckCircle size={36} color="white" />
              </YStack>
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
                textAlign="center"
              >
                Payment Confirmed
              </Text>
              <Text
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                {formatPriceFromMinor(amountMinor, currency)} received
              </Text>
            </>
          )}

          {state === "failed" && (
            <>
              <YStack backgroundColor="$red" padding="$3" borderRadius="$full">
                <XCircle size={36} color="white" />
              </YStack>
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
                textAlign="center"
              >
                Payment Failed
              </Text>
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$primary"
                textAlign="center"
              >
                {formatPriceFromMinor(amountMinor, currency)}
              </Text>
              <Text
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                {errorMsg ||
                  "Payment could not be completed. The order is still in progress."}
              </Text>
              <Button
                backgroundColor="$primary"
                height={44}
                width="100%"
                pressStyle={{ opacity: 0.8 }}
                onPress={onClose}
              >
                <Text
                  color="white"
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$body"
                >
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
