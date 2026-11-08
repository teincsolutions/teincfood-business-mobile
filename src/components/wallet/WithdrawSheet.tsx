// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { Sheet, YStack, XStack, Text, Separator, useMedia } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "@tamagui/lucide-icons";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { formatPriceFromMinor } from "@teincfood/core";
import { Button, Input } from "@/components/ui";
import * as walletService from "@/services/wallet.service";
import type { BusinessPaymentSettings } from "@/services/business.service";

const PROVIDERS = [
  { value: "mtn", label: "MTN MoMo" },
  { value: "vod", label: "Telecel Cash" },
  { value: "atl", label: "AirtelTigo" },
];

type PayoutMethod = "mobile_money" | "bank";

export function WithdrawSheet({
  open,
  onOpenChange,
  businessId,
  balanceMinor,
  currency,
  settings,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: string;
  balanceMinor: number;
  currency: string;
  settings?: BusinessPaymentSettings | null;
  onSuccess?: () => void;
}) {
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayoutMethod>("mobile_money");
  const [momoNumber, setMomoNumber] = useState("");
  const [provider, setProvider] = useState("mtn");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setMethod(settings?.payout_method === "bank" ? "bank" : "mobile_money");
    setMomoNumber(settings?.payout_momo_number ?? "");
    setProvider(settings?.payout_provider ?? "mtn");
    setBankCode(settings?.payout_bank_code ?? "");
    setAccountNumber(settings?.payout_account_number ?? "");
    setAccountName(settings?.payout_account_name ?? "");
  }, [open, settings]);

  const amountMinor = useMemo(() => {
    const value = Number.parseFloat(amount.replace(/,/g, ""));
    return Number.isFinite(value) ? Math.round(value * 100) : 0;
  }, [amount]);

  const feeMinor =
    method === "bank"
      ? settings?.bank_payout_fee_minor ?? 800
      : settings?.payout_fee_minor ?? 100;
  const totalMinor = amountMinor + feeMinor;
  const insufficient = amountMinor > 0 && totalMinor > balanceMinor;

  const mutation = useMutation({
    mutationFn: () => {
      if (!businessId) throw new Error("No active business");
      return walletService.withdrawFromWallet({
        businessId,
        amountMinor,
        payoutMethod: method,
        ...(method === "mobile_money"
          ? { momoNumber: momoNumber.trim(), provider }
          : {
              bankCode: bankCode.trim(),
              accountNumber: accountNumber.trim(),
              accountName: accountName.trim(),
            }),
      });
    },
    onSuccess: (response) => {
      toast.success(response.data.message || "Withdrawal queued");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.debug("[WithdrawSheet] withdrawal failed", error);
      toast.error(error?.message || "Could not start the withdrawal");
    },
  });

  const validDetails =
    method === "mobile_money"
      ? momoNumber.replace(/\D/g, "").length >= 9
      : bankCode.trim().length > 0 && accountNumber.trim().length > 0;

  const canSubmit =
    Boolean(businessId) &&
    amountMinor > 0 &&
    !insufficient &&
    validDetails &&
    !mutation.isPending;

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[86]}
      dismissOnSnapToBottom
      dismissOnOverlayPress
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
        overflow="hidden"
        {...(media.md || media.lg
          ? { maxWidth: 600, alignSelf: "center" }
          : {})}
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
        <XStack
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$5"
          paddingTop="$2"
          paddingBottom="$2"
        >
          <YStack gap="$1" flex={1}>
            <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
              Withdraw funds
            </Text>
            <Text fontSize="$3" color="$colorSecondary">
              Available: {formatPriceFromMinor(balanceMinor, currency)}
            </Text>
          </YStack>
          <Button
            width={40}
            height={40}
            circular
            variant="ghost"
            backgroundColor="transparent"
            padding={0}
            onPress={() => {
              Keyboard.dismiss();
              onOpenChange(false);
            }}
            icon={<X size={22} color="$color" />}
          />
        </XStack>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Sheet.ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 24),
            }}
          >
          <YStack paddingHorizontal="$5" paddingTop="$2" gap="$4">
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="700" color="$colorSecondary">
                Amount ({currency})
              </Text>
              <Input
                keyboardType="decimal-pad"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </YStack>

            <XStack gap="$2">
              {(["mobile_money", "bank"] as PayoutMethod[]).map((value) => (
                <Button
                  key={value}
                  flex={1}
                  variant={method === value ? "primary" : "outline"}
                  onPress={() => setMethod(value)}
                >
                  {value === "mobile_money" ? "Mobile Money" : "Bank"}
                </Button>
              ))}
            </XStack>

            <Separator />

            {method === "mobile_money" ? (
              <YStack gap="$3">
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="700" color="$colorSecondary">
                    Mobile money number
                  </Text>
                  <Input
                    keyboardType="phone-pad"
                    placeholder="024 000 0000"
                    value={momoNumber}
                    onChangeText={setMomoNumber}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </YStack>
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="700" color="$colorSecondary">
                    Provider
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    {PROVIDERS.map((item) => (
                      <Button
                        key={item.value}
                        size="$3"
                        variant={
                          provider === item.value ? "primary" : "outline"
                        }
                        onPress={() => setProvider(item.value)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </XStack>
                </YStack>
              </YStack>
            ) : (
              <YStack gap="$3">
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="700" color="$colorSecondary">
                    Bank code
                  </Text>
                  <Input
                    placeholder="e.g. 058"
                    value={bankCode}
                    onChangeText={setBankCode}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </YStack>
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="700" color="$colorSecondary">
                    Account number
                  </Text>
                  <Input
                    keyboardType="number-pad"
                    placeholder="Account number"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </YStack>
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="700" color="$colorSecondary">
                    Account name
                  </Text>
                  <Input
                    placeholder="Name on account"
                    value={accountName}
                    onChangeText={setAccountName}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </YStack>
              </YStack>
            )}

            <YStack gap="$1">
              <XStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorMuted">
                  Provider fee
                </Text>
                <Text fontSize="$3">
                  {formatPriceFromMinor(feeMinor, currency)}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize="$4" fontWeight="700">
                  Total debit
                </Text>
                <Text fontSize="$4" fontWeight="700">
                  {formatPriceFromMinor(totalMinor, currency)}
                </Text>
              </XStack>
              {insufficient ? (
                <Text fontSize="$3" color="$red10">
                  Your balance does not cover the amount plus the fee.
                </Text>
              ) : null}
            </YStack>

            <Button
              variant="primary"
              height={48}
              disabled={!canSubmit}
              loading={mutation.isPending}
              onPress={() => {
                Keyboard.dismiss();
                mutation.mutate();
              }}
            >
              {mutation.isPending ? "Starting withdrawal..." : "Withdraw"}
            </Button>
          </YStack>
          </Sheet.ScrollView>
        </KeyboardAvoidingView>
      </Sheet.Frame>
    </Sheet>
  );
}
