// @ts-nocheck
import { useState, useMemo } from "react";
import {
  YStack,
  XStack,
  Text,
  Button,
  Separator,
  Sheet,
  useMedia,
} from "tamagui";
import { NumericKeypad } from "./NumericKeypad";
import { formatPriceFromMinor } from "@teincfood/core";

interface CashPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalMinor: number;
  currency?: string;
  onConfirm: (tenderedMinor: number) => void;
  isProcessing?: boolean;
}

export function CashPaymentSheet({
  open,
  onOpenChange,
  totalMinor,
  currency = "GHS",
  onConfirm,
  isProcessing,
}: CashPaymentSheetProps) {
  const media = useMedia();
  const [tenderedText, setTenderedText] = useState("");

  const tenderedMinor = useMemo(() => {
    if (!tenderedText) return 0;
    const num = parseFloat(tenderedText);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }, [tenderedText]);

  const changeMinor = useMemo(() => {
    if (tenderedMinor < totalMinor) return 0;
    return tenderedMinor - totalMinor;
  }, [tenderedMinor, totalMinor]);

  const sufficient = tenderedMinor >= totalMinor;

  const handleConfirm = () => {
    if (!sufficient) return;
    onConfirm(tenderedMinor);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) setTenderedText("");
    onOpenChange(o);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={handleOpenChange}
      snapPoints={[80]}
      dismissOnSnapToBottom
      zIndex={200_000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.5)"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        padding="$5"
        {...(media.md || media.lg
          ? { maxWidth: 600, alignSelf: "center" }
          : {})}
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
        <YStack gap="$4" flex={1}>
          <Text
            fontSize="$6"
            fontWeight="800"
            fontFamily="$heading"
            textAlign="center"
          >
            Cash Payment
          </Text>

          <YStack
            backgroundColor="$backgroundSoft"
            borderRadius="$4"
            padding="$4"
            alignItems="center"
            gap="$2"
          >
            <Text fontSize="$4" fontFamily="$body" color="$colorSecondary">
              Amount Due
            </Text>
            <Text
              fontSize="$8"
              fontWeight="900"
              fontFamily="$heading"
              color="$color"
            >
              {formatPriceFromMinor(totalMinor, currency)}
            </Text>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <Text
              fontSize="$5"
              fontWeight="700"
              fontFamily="$heading"
              textAlign="center"
            >
              Amount Tendered
            </Text>
            <Text
              fontSize="$8"
              fontWeight="900"
              fontFamily="$heading"
              textAlign="center"
              color={
                sufficient
                  ? "$color"
                  : tenderedText
                    ? "$red9"
                    : "$colorSecondary"
              }
              minHeight={48}
            >
              {tenderedText
                ? formatPriceFromMinor(tenderedMinor, currency)
                : "—"}
            </Text>
            {tenderedMinor > 0 && (
              <XStack justifyContent="center" gap="$2">
                <Text fontSize="$4" fontFamily="$body" color="$colorSecondary">
                  Change:
                </Text>
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$heading"
                  color={sufficient ? "$success" : "$red9"}
                >
                  {sufficient
                    ? formatPriceFromMinor(changeMinor, currency)
                    : `Need ${formatPriceFromMinor(totalMinor - tenderedMinor, currency)} more`}
                </Text>
              </XStack>
            )}
          </YStack>

          <YStack flex={1} justifyContent="flex-end" gap="$3">
            <NumericKeypad value={tenderedText} onChange={setTenderedText} />
            <Button
              backgroundColor="$primary"
              height={52}
              disabled={!sufficient || isProcessing}
              pressStyle={{ opacity: 0.8 }}
              onPress={handleConfirm}
            >
              <Text
                color="white"
                fontWeight="700"
                fontSize="$5"
                fontFamily="$body"
              >
                {isProcessing
                  ? "Processing..."
                  : `Confirm — ${formatPriceFromMinor(totalMinor, currency)}`}
              </Text>
            </Button>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
