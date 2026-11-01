// @ts-nocheck — Tamagui stack props don't typecheck under this repo's tsconfig.
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  Spinner,
  Switch,
} from "tamagui";
import { Crown, CreditCard, RefreshCw } from "@tamagui/lucide-icons";
import { toast } from "sonner-native";
import { Button, Input } from "@/components/ui";
import { MomoChargeSheet } from "@/components/subscription/MomoChargeSheet";
import {
  useBillingQuery,
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
  useUpdateBillingProfileMutation,
} from "@/hooks/useSubscription";
import { useBusinessStore } from "@/stores/business.store";
import { paymentService } from "@/services/payment.service";
import { useIsEffectivelyOnline } from "@teincfood/core";
import type { MomoProvider } from "@/types/payment";
import type { SubscriptionInvoice } from "@/services/subscription.service";

function formatMoney(minor: number, currency = "GHS") {
  return `${currency} ${((minor || 0) / 100).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BillingCard() {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const online = useIsEffectivelyOnline();
  const billing = useBillingQuery();
  const updateProfile = useUpdateBillingProfileMutation();
  const cancel = useCancelSubscriptionMutation();
  const resume = useResumeSubscriptionMutation();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<MomoProvider>("mtn");
  const [email, setEmail] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [payingInvoice, setPayingInvoice] =
    useState<SubscriptionInvoice | null>(null);

  const data = billing.data;
  const profile = data?.billing_profile;
  const config = data?.configuration;
  const upcoming = data?.upcoming_invoice;

  useEffect(() => {
    if (!profile) return;
    setPhone(profile.momo_phone ?? "");
    setProvider(
      profile.momo_provider === "vod" || profile.momo_provider === "atl"
        ? profile.momo_provider
        : "mtn",
    );
    setEmail(profile.billing_email ?? "");
    setAutoRenew(profile.auto_renew ?? true);
  }, [
    profile?.momo_phone,
    profile?.momo_provider,
    profile?.billing_email,
    profile?.auto_renew,
  ]);

  const saveProfile = async () => {
    try {
      const trimmedPhone = phone.trim();
      await updateProfile.mutateAsync({
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
        provider,
        billing_email: email.trim() || undefined,
        auto_renew: autoRenew,
        consent_version: "2026-10",
      });
      toast.success("Billing details saved");
      setEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save billing details",
      );
    }
  };

  const refreshAfterPayment = () => {
    void billing.refetch();
    queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    queryClient.invalidateQueries({ queryKey: ["billing"] });
    toast.success("Subscription payment confirmed");
  };

  if (!online) {
    return (
      <Card bordered padding="$4" gap="$2">
        <XStack gap="$2" alignItems="center">
          <Crown size={18} />
          <Text
            fontSize="$4"
            fontWeight="700"
            fontFamily="$heading"
            color="$color"
          >
            Billing
          </Text>
        </XStack>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          Reconnect to view your upcoming bill and mobile-money settings.
        </Text>
      </Card>
    );
  }

  if (billing.isLoading) {
    return (
      <Card bordered padding="$4" alignItems="center">
        <Spinner color="$primary" />
      </Card>
    );
  }

  if (billing.isError || !data) {
    return (
      <Card bordered padding="$4" gap="$3">
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          Could not load billing details.
        </Text>
        <Button variant="outline" onPress={() => void billing.refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card bordered padding="$4" gap="$3">
        <XStack justifyContent="space-between" alignItems="center" gap="$2">
          <XStack gap="$2" alignItems="center">
            <Crown size={18} />
            <Text
              fontSize="$4"
              fontWeight="700"
              fontFamily="$heading"
              color="$color"
            >
              Billing
            </Text>
          </XStack>
          <Button
            variant="outline"
            size="sm"
            onPress={() => setEditing((v) => !v)}
          >
            {editing ? "Close" : "Edit"}
          </Button>
        </XStack>

        <XStack justifyContent="space-between" gap="$2">
          <YStack gap="$0.5">
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              Auto-renew
            </Text>
            <Text
              fontSize="$3"
              fontWeight="600"
              fontFamily="$body"
              color="$color"
            >
              {profile?.auto_renew
                ? "On — we send a prompt before the due date"
                : "Off — pay manually"}
            </Text>
          </YStack>
          <Switch
            size="$5"
            checked={autoRenew}
            onCheckedChange={setAutoRenew}
            backgroundColor={autoRenew ? "$primary" : "$gray5"}
          >
            <Switch.Thumb animation="quick" backgroundColor="white" />
          </Switch>
        </XStack>

        {editing ? (
          <YStack gap="$3">
            <XStack gap="$2">
              {(
                [
                  { key: "mtn" as MomoProvider, label: "MTN" },
                  { key: "vod" as MomoProvider, label: "Telecel" },
                  { key: "atl" as MomoProvider, label: "AirtelTigo" },
                ] as const
              ).map((item) => {
                const selected = provider === item.key;
                return (
                  <YStack
                    key={item.key}
                    flex={1}
                    alignItems="center"
                    paddingVertical="$2.5"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor={selected ? "$primary" : "$borderColor"}
                    backgroundColor={selected ? "$primary" : "$backgroundSoft"}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => setProvider(item.key)}
                  >
                    <Text
                      fontSize="$2"
                      fontWeight="700"
                      fontFamily="$body"
                      color={selected ? "$white" : "$color"}
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
            />
            <Input
              label="Billing email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="billing@business.com"
            />
            <Button
              variant="primary"
              height={46}
              loading={updateProfile.isPending}
              disabled={updateProfile.isPending}
              onPress={() => void saveProfile()}
            >
              Save billing details
            </Button>
          </YStack>
        ) : (
          <YStack gap="$1">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {profile?.has_momo
                ? `${profile.momo_provider === "vod" ? "Telecel Cash" : profile.momo_provider === "atl" ? "AirtelTigo" : "MTN MoMo"} •••• ${profile.momo_phone_last4 ?? ""}`
                : "No mobile-money number saved"}
            </Text>
            {profile?.billing_email ? (
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                {profile.billing_email}
              </Text>
            ) : null}
          </YStack>
        )}

        <Separator />

        {upcoming ? (
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <CreditCard size={16} />
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$color"
                >
                  {upcoming.status === "open" ? "Payment due" : "Upcoming bill"}
                </Text>
              </XStack>
              <Text
                fontSize="$2"
                color={
                  upcoming.status === "open" ? "$warning" : "$colorSecondary"
                }
                fontFamily="$body"
              >
                Due {formatDate(upcoming.due_at)}
              </Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Plan
              </Text>
              <Text fontSize="$3" color="$color" fontFamily="$body">
                {formatMoney(upcoming.base_amount_minor, upcoming.currency)}
              </Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Mobile Money Charge
              </Text>
              <Text fontSize="$3" color="$color" fontFamily="$body">
                {formatMoney(upcoming.fee_minor, upcoming.currency)}
              </Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text
                fontSize="$4"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                Total
              </Text>
              <Text
                fontSize="$4"
                fontWeight="800"
                fontFamily="$heading"
                color="$primary"
              >
                {formatMoney(upcoming.amount_minor, upcoming.currency)}
              </Text>
            </XStack>
            <Button
              variant="primary"
              height={46}
              disabled={upcoming.status === "payment_pending"}
              onPress={() => setPayingInvoice(upcoming)}
            >
              {upcoming.status === "payment_pending"
                ? "Waiting for approval"
                : "Pay now"}
            </Button>
          </YStack>
        ) : (
          <YStack gap="$1">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              No upcoming bill right now.
            </Text>
            {config?.current_period_end ? (
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                Current period ends {formatDate(config.current_period_end)}.
              </Text>
            ) : null}
          </YStack>
        )}

        <XStack gap="$2">
          <Button
            variant="outline"
            size="sm"
            flex={1}
            loading={cancel.isPending}
            disabled={cancel.isPending || config?.cancel_at_period_end}
            onPress={() => {
              cancel.mutate(undefined, {
                onSuccess: () =>
                  toast.success("Subscription will cancel at period end"),
                onError: (e) =>
                  toast.error(
                    e instanceof Error ? e.message : "Could not cancel",
                  ),
              });
            }}
          >
            Cancel at period end
          </Button>
          <Button
            variant="outline"
            size="sm"
            flex={1}
            loading={resume.isPending}
            disabled={resume.isPending || !config?.cancel_at_period_end}
            icon={<RefreshCw size={14} />}
            onPress={() => {
              resume.mutate(undefined, {
                onSuccess: () => toast.success("Subscription resumed"),
                onError: (e) =>
                  toast.error(
                    e instanceof Error ? e.message : "Could not resume",
                  ),
              });
            }}
          >
            Resume
          </Button>
        </XStack>
      </Card>

      <MomoChargeSheet
        open={!!payingInvoice}
        title="Pay subscription"
        subtitle={
          payingInvoice ? `Due ${formatDate(payingInvoice.due_at)}` : undefined
        }
        baseMinor={payingInvoice?.base_amount_minor ?? 0}
        feeMinor={payingInvoice?.fee_minor ?? 0}
        currency={payingInvoice?.currency ?? "GHS"}
        defaultPhone={profile?.momo_phone}
        defaultProvider={profile?.momo_provider}
        onStart={async (nextPhone, nextProvider) => {
          if (!payingInvoice || !businessId)
            return { charge: null, done: true };
          await updateProfile.mutateAsync({
            phone: nextPhone,
            provider: nextProvider,
            consent_version: "2026-10",
          });
          const response = await paymentService.chargeMomo({
            invoice_id: payingInvoice.id,
            phone: nextPhone,
            provider: nextProvider,
            idempotency_key: `invoice-${payingInvoice.id}-${Date.now()}`,
          });
          return { charge: response.data };
        }}
        onSuccess={refreshAfterPayment}
        onClose={() => setPayingInvoice(null)}
      />
    </>
  );
}
