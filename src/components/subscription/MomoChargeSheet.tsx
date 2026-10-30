// @ts-nocheck — Tamagui stack props (alignItems/padding/etc.) don't typecheck under this repo's tsconfig.
import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Sheet, YStack, XStack, Text, Spinner, Separator } from "tamagui";
import { Button, Input } from "@/components/ui";
import { OTPInput } from "@/components/ui/OTPInput";
import { paymentService } from "@/services/payment.service";
import type { MomoCharge, MomoProvider } from "@/types/payment";

export type MomoStartResult = {
  charge: MomoCharge | null;
  done?: boolean;
};

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  baseMinor: number;
  feeMinor: number;
  currency: string;
  defaultPhone?: string | null;
  defaultProvider?: string | null;
  onStart: (phone: string, provider: MomoProvider) => Promise<MomoStartResult>;
  onSuccess: () => void;
  onClose: () => void;
};

function formatMoney(minor: number, currency: string) {
  return `${currency} ${((minor || 0) / 100).toFixed(2)}`;
}

const PROVIDERS: { key: MomoProvider; label: string }[] = [
  { key: "mtn", label: "MTN MoMo" },
  { key: "vod", label: "Telecel Cash" },
  { key: "atl", label: "AirtelTigo" },
];

const POLL_MS = 4000;

export function MomoChargeSheet({
  open,
  title,
  subtitle,
  baseMinor,
  feeMinor,
  currency,
  defaultPhone,
  defaultProvider,
  onStart,
  onSuccess,
  onClose,
}: Props) {
  const normalizedDefaultProvider = useMemo<MomoProvider>(() => {
    if (defaultProvider === "vod" || defaultProvider === "atl") {
      return defaultProvider;
    }
    return "mtn";
  }, [defaultProvider]);

  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [provider, setProvider] = useState<MomoProvider>(
    normalizedDefaultProvider,
  );
  const [charge, setCharge] = useState<MomoCharge | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhone(defaultPhone ?? "");
    setProvider(normalizedDefaultProvider);
    setCharge(null);
    setOtp("");
    setBusy(false);
    setError(null);
  }, [open, defaultPhone, normalizedDefaultProvider]);

  const applyCharge = (next: MomoCharge) => {
    setCharge(next);
    if (next.status === "success") {
      onSuccess();
      onClose();
    } else if (
      next.status === "failed" ||
      next.status === "expired" ||
      next.status === "abandoned"
    ) {
      setError(next.display_text || "Payment could not be completed.");
    }
  };

  useEffect(() => {
    if (!open || !charge) return;
    if (charge.status !== "pending" && charge.status !== "otp_required") return;

    let stopped = false;
    const tick = async () => {
      try {
        const response = await paymentService.getMomoCharge(charge.reference);
        if (!stopped) applyCharge(response.data);
      } catch {
        // Keep waiting for webhook/poll.
      }
    };
    const timer = setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, charge?.reference, charge?.status]);

  const start = async () => {
    if (phone.replace(/\D/g, "").length < 9) {
      setError("Enter a valid Ghana mobile-money number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await onStart(phone, provider);
      if (result.done || !result.charge) {
        onSuccess();
        onClose();
      } else {
        applyCharge(result.charge);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start the payment.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (code: string) => {
    if (!charge) return;
    setBusy(true);
    setError(null);
    try {
      const response = await paymentService.submitMomoOtp(
        charge.reference,
        code,
      );
      applyCharge(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit the OTP.",
      );
    } finally {
      setBusy(false);
    }
  };

  const awaiting =
    charge && (charge.status === "pending" || charge.status === "otp_required");

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
      snapPoints={[78]}
      dismissOnSnapToBottom
      zIndex={100_000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.55)"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
      >
        <Sheet.Handle backgroundColor="$gray200" marginTop="$2" />
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack px="$5" pt="$3" pb="$8" gap="$4">
            <YStack gap="$1">
              <Text
                fontSize="$6"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                {title}
              </Text>
              {subtitle ? (
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  {subtitle}
                </Text>
              ) : null}
            </YStack>

            <YStack
              backgroundColor="$backgroundSoft"
              borderRadius="$4"
              p="$4"
              gap="$2"
            >
              <XStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Plan amount
                </Text>
                <Text fontSize="$3" color="$color" fontFamily="$body">
                  {formatMoney(baseMinor, currency)}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Mobile Money Charge
                </Text>
                <Text fontSize="$3" color="$color" fontFamily="$body">
                  {formatMoney(feeMinor, currency)}
                </Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text
                  fontSize="$4"
                  fontWeight="800"
                  fontFamily="$heading"
                  color="$color"
                >
                  Pay total
                </Text>
                <Text
                  fontSize="$4"
                  fontWeight="800"
                  fontFamily="$heading"
                  color="$primary"
                >
                  {formatMoney(baseMinor + feeMinor, currency)}
                </Text>
              </XStack>
            </YStack>

            {awaiting ? (
              <YStack gap="$3" alignItems="center">
                {charge.next_action === "submit_otp" ? (
                  <>
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$heading"
                      color="$color"
                    >
                      Enter payment OTP
                    </Text>
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                      textAlign="center"
                    >
                      {charge.display_text ||
                        "Enter the OTP sent to the owner's phone."}
                    </Text>
                    <OTPInput
                      length={6}
                      value={otp}
                      onChange={setOtp}
                      onComplete={(code) => void submitOtp(code)}
                    />
                    <Button
                      variant="primary"
                      height={48}
                      width="100%"
                      loading={busy}
                      disabled={otp.length < 4 || busy}
                      onPress={() => void submitOtp(otp)}
                    >
                      Submit OTP
                    </Button>
                  </>
                ) : (
                  <>
                    <Spinner size="large" color="$primary" />
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$heading"
                      color="$color"
                      textAlign="center"
                    >
                      Approve on the owner&apos;s phone
                    </Text>
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                      textAlign="center"
                    >
                      {charge.display_text ||
                        "Approve the mobile-money prompt on the owner's phone. This screen updates automatically."}
                    </Text>
                  </>
                )}
                {charge.reference ? (
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Ref: {charge.reference}
                  </Text>
                ) : null}
              </YStack>
            ) : (
              <YStack gap="$3">
                <Text
                  fontSize="$3"
                  fontWeight="600"
                  fontFamily="$body"
                  color="$colorSecondary"
                >
                  Mobile money provider
                </Text>
                <XStack gap="$2">
                  {PROVIDERS.map((item) => {
                    const selected = provider === item.key;
                    return (
                      <YStack
                        key={item.key}
                        flex={1}
                        alignItems="center"
                        justifyContent="center"
                        paddingVertical="$3"
                        paddingHorizontal="$1"
                        borderRadius="$3"
                        borderWidth={1}
                        borderColor={selected ? "$primary" : "$borderColor"}
                        backgroundColor={
                          selected ? "$primary" : "$backgroundSoft"
                        }
                        pressStyle={{ opacity: 0.8 }}
                        onPress={() => setProvider(item.key)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          fontSize="$2"
                          fontWeight="700"
                          fontFamily="$body"
                          color={selected ? "$white" : "$color"}
                          textAlign="center"
                        >
                          {item.label}
                        </Text>
                      </YStack>
                    );
                  })}
                </XStack>
                <Input
                  label="Mobile money number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="0551234987"
                  editable={!busy}
                />
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  The owner approves the charge on their phone. Auto-billing
                  sends this prompt three days before the due date.
                </Text>
                <Button
                  variant="primary"
                  height={50}
                  width="100%"
                  loading={busy}
                  disabled={busy || phone.replace(/\D/g, "").length < 9}
                  onPress={() => void start()}
                >
                  Send payment prompt
                </Button>
              </YStack>
            )}

            {error ? (
              <Text
                role="alert"
                fontSize="$3"
                color="$error"
                fontFamily="$body"
              >
                {error}
              </Text>
            ) : null}

            <Button
              variant="outline"
              height={44}
              width="100%"
              disabled={busy}
              onPress={onClose}
            >
              Cancel
            </Button>
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
}
