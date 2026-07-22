// @ts-nocheck
import { useState } from "react";
import { YStack, XStack, Text, Button, Separator, Sheet, Input } from "tamagui";
import { Contact, Phone } from "@tamagui/lucide-icons";
import { NumericKeypad } from "./NumericKeypad";
import { formatPriceFromMinor } from "@/utils/currency";

interface MobileMoneySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalMinor: number;
  currency?: string;
  customerName: string;
  onConfirm: (phoneNumber: string) => void;
  isProcessing?: boolean;
}

export function MobileMoneySheet({
  open,
  onOpenChange,
  totalMinor,
  currency = "GHS",
  customerName,
  onConfirm,
  isProcessing,
}: MobileMoneySheetProps) {
  const [phone, setPhone] = useState("");
  const [inputMode, setInputMode] = useState<"keypad" | "text">("keypad");

  const isValidPhone = phone.length >= 10;

  const handleConfirm = () => {
    if (!isValidPhone) return;
    onConfirm(phone);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) setPhone("");
    onOpenChange(o);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={handleOpenChange}
      snapPoints={[70]}
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
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
        <YStack gap="$4" flex={1}>
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading" textAlign="center">
            Mobile Money Payment
          </Text>

          <YStack backgroundColor="$backgroundSoft" borderRadius="$4" padding="$4" gap="$1">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" fontFamily="$body" color="$colorSecondary">Customer</Text>
              <Text fontSize="$4" fontWeight="600" fontFamily="$body">{customerName}</Text>
            </XStack>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" fontFamily="$body" color="$colorSecondary">Amount</Text>
              <Text fontSize="$6" fontWeight="900" fontFamily="$heading" color="$color">
                {formatPriceFromMinor(totalMinor, currency)}
              </Text>
            </XStack>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading">
                Customer Phone Number
              </Text>
              <Button
                size="$2"
                chromeless
                icon={inputMode === "keypad" ? <Contact size={16} /> : <Phone size={16} />}
                onPress={() => setInputMode(inputMode === "keypad" ? "text" : "keypad")}
              >
                <Text fontSize="$2" fontFamily="$body">
                  {inputMode === "keypad" ? "Full keyboard" : "Keypad"}
                </Text>
              </Button>
            </XStack>

            {inputMode === "keypad" ? (
              <YStack alignItems="center" gap="$4">
                <Text
                  fontSize="$7"
                  fontWeight="800"
                  fontFamily="$heading"
                  color={isValidPhone ? "$color" : phone ? "$red9" : "$colorSecondary"}
                  minHeight={40}
                  letterSpacing={2}
                >
                  {phone || "Enter phone"}
                </Text>
                <NumericKeypad value={phone} onChange={setPhone} maxDecimals={0} />
              </YStack>
            ) : (
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="055 123 4567"
                keyboardType="phone-pad"
                size="$5"
              />
            )}

            <Text fontSize="$3" fontFamily="$body" color="$colorSecondary" textAlign="center">
              A USSD prompt will be sent to this number
            </Text>
          </YStack>

          <YStack flex={1} justifyContent="flex-end" gap="$3">
            <Button
              backgroundColor="$primary"
              height={52}
              disabled={!isValidPhone || isProcessing}
              pressStyle={{ opacity: 0.8 }}
              onPress={handleConfirm}
            >
              <Text color="white" fontWeight="700" fontSize="$5" fontFamily="$body">
                {isProcessing
                  ? "Processing..."
                  : `Send Payment Prompt — ${formatPriceFromMinor(totalMinor, currency)}`}
              </Text>
            </Button>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
