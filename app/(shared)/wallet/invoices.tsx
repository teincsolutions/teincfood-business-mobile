// @ts-nocheck — Tamagui stack props don't typecheck under this repo's tsconfig.
import { useMemo, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card, Spinner } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, RefreshCw } from "@tamagui/lucide-icons";
import { toast } from "sonner-native";
import { BackButton, Button } from "@/components/ui";
import { MomoChargeSheet } from "@/components/subscription/MomoChargeSheet";
import {
  useBillingQuery,
  useCancelSubscriptionInvoiceMutation,
  useChargeInvoiceMutation,
  useInvoicesQuery,
  useUpdateBillingProfileMutation,
} from "@/hooks/useSubscription";
import { useBusinessStore } from "@/stores/business.store";
import { useIsEffectivelyOnline } from "@teincfood/core";
import type { SubscriptionInvoice } from "@/services/subscription.service";

type InvoiceFilter = "all" | "pending" | "paid";

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

function isListed(invoice: SubscriptionInvoice) {
  return invoice.status !== "scheduled";
}

function isPending(invoice: SubscriptionInvoice) {
  return ["open", "payment_pending", "failed"].includes(invoice.status);
}

function canPay(invoice: SubscriptionInvoice) {
  return invoice.status === "open" || invoice.status === "failed";
}

function statusBadge(invoice: SubscriptionInvoice): {
  label: string;
  color: string;
  background: string;
} {
  switch (invoice.status) {
    case "paid":
      return { label: "Paid", color: "$success", background: "$successMuted" };
    case "open":
      return new Date(invoice.due_at).getTime() <= Date.now()
        ? {
            label: "Payment due",
            color: "$warning",
            background: "$warningMuted",
          }
        : {
            label: "Bill ready",
            color: "$primary",
            background: "$primaryLight",
          };
    case "payment_pending":
      return {
        label: "Awaiting approval",
        color: "$warning",
        background: "$warningMuted",
      };
    case "failed":
      return {
        label: "Payment failed",
        color: "$error",
        background: "$errorMuted",
      };
    case "scheduled":
      return {
        label: "Upcoming",
        color: "$colorSecondary",
        background: "$backgroundSoft",
      };
    case "void":
      return {
        label: "Void",
        color: "$colorSecondary",
        background: "$backgroundSoft",
      };
    default:
      return {
        label: invoice.status,
        color: "$colorSecondary",
        background: "$backgroundSoft",
      };
  }
}

function InvoiceRow({
  invoice,
  onPay,
  onCancel,
  cancelling,
}: {
  invoice: SubscriptionInvoice;
  onPay: () => void;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const badge = statusBadge(invoice);

  return (
    <Card bordered padding="$4" gap="$2">
      <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
        <YStack flex={1} gap="$1">
          <XStack gap="$2" alignItems="center" flexWrap="wrap">
            <Text
              fontSize="$1"
              fontWeight="700"
              fontFamily="$body"
              color={badge.color}
              backgroundColor={badge.background}
              paddingHorizontal="$2"
              paddingVertical="$0.5"
              borderRadius="$2"
            >
              {badge.label}
            </Text>
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              {invoice.billing_cycle === "year"
                ? "Yearly plan"
                : "Monthly plan"}
            </Text>
          </XStack>

          <Text
            fontSize="$3"
            fontWeight="600"
            fontFamily="$body"
            color="$color"
          >
            {invoice.status === "paid" && invoice.paid_at
              ? `Paid ${formatDate(invoice.paid_at)}`
              : `Due ${formatDate(invoice.due_at)}`}
          </Text>
          <Text
            fontSize="$2"
            color="$colorSecondary"
            fontFamily="$body"
            numberOfLines={1}
          >
            {invoice.reference}
          </Text>
          {invoice.payment_reference ? (
            <Text
              fontSize="$1"
              color="$colorSecondary"
              fontFamily="$body"
              numberOfLines={1}
            >
              Payment: {invoice.payment_reference}
            </Text>
          ) : null}
        </YStack>

        <Text
          fontSize="$4"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
        >
          {formatMoney(invoice.amount_minor, invoice.currency)}
        </Text>
      </XStack>

      {canPay(invoice) || invoice.status === "payment_pending" ? (
        <XStack justifyContent="flex-end">
          {canPay(invoice) ? (
            <Button size="sm" height={44} onPress={onPay}>
              {invoice.status === "failed" ? "Retry payment" : "Pay now"}
            </Button>
          ) : (
            <XStack gap="$2" alignItems="center">
              <Text
                fontSize="$2"
                fontWeight="700"
                color="$warning"
                fontFamily="$body"
                paddingVertical="$2"
              >
                Awaiting approval
              </Text>
              <Button
                size="sm"
                height={44}
                variant="outline"
                loading={cancelling}
                disabled={cancelling}
                onPress={onCancel}
              >
                Cancel
              </Button>
            </XStack>
          )}
        </XStack>
      ) : null}
    </Card>
  );
}

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const online = useIsEffectivelyOnline();
  const invoicesQuery = useInvoicesQuery();
  const billing = useBillingQuery();
  const updateProfile = useUpdateBillingProfileMutation();
  const chargeInvoice = useChargeInvoiceMutation();
  const cancelInvoice = useCancelSubscriptionInvoiceMutation();
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const [filter, setFilter] = useState<InvoiceFilter>("all");
  const [payingInvoice, setPayingInvoice] =
    useState<SubscriptionInvoice | null>(null);

  const invoices = useMemo(
    () => (invoicesQuery.data ?? []).filter(isListed),
    [invoicesQuery.data],
  );

  const counts = useMemo(
    () => ({
      all: invoices.length,
      pending: invoices.filter(isPending).length,
      paid: invoices.filter((invoice) => invoice.status === "paid").length,
    }),
    [invoices],
  );

  const visible = useMemo(() => {
    if (filter === "paid") {
      return invoices.filter((invoice) => invoice.status === "paid");
    }
    if (filter === "pending") {
      return invoices.filter(isPending);
    }
    return invoices;
  }, [filter, invoices]);

  const handlePaymentSuccess = () => {
    void invoicesQuery.refetch();
    void billing.refetch();
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["billing"] });
    queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    toast.success("Subscription payment confirmed");
  };

  const tabs: { key: InvoiceFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack padding="$4" alignItems="center" gap="$3">
        <BackButton />
        <YStack flex={1}>
          <Text
            fontSize="$7"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color"
          >
            Invoices
          </Text>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            Paid and pending subscription bills
          </Text>
        </YStack>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={14} />}
          loading={invoicesQuery.isRefetching}
          onPress={() => void invoicesQuery.refetch()}
        >
          Refresh
        </Button>
      </XStack>

      <XStack
        backgroundColor="$backgroundSoft"
        borderRadius="$4"
        padding="$1"
        gap="$1"
        marginHorizontal="$4"
      >
        {tabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <Button
              key={tab.key}
              size="sm"
              flex={1}
              variant={active ? "primary" : "ghost"}
              onPress={() => setFilter(tab.key)}
            >
              {`${tab.label} ${counts[tab.key]}`}
            </Button>
          );
        })}
      </XStack>

      <FlatList
        data={visible}
        keyExtractor={(invoice) => invoice.id}
        renderItem={({ item }) => (
          <InvoiceRow
            invoice={item}
            onPay={() => setPayingInvoice(item)}
            cancelling={cancelInvoice.isPending}
            onCancel={() =>
              cancelInvoice.mutate(item.id, {
                onSuccess: () => {
                  toast.success(
                    "Pending payment cancelled. You can choose another plan.",
                  );
                  void invoicesQuery.refetch();
                  void billing.refetch();
                },
                onError: (e) =>
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Could not cancel pending payment",
                  ),
              })
            }
          />
        )}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom + 20, 24),
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={invoicesQuery.isRefetching}
            onRefresh={() => void invoicesQuery.refetch()}
          />
        }
        ListHeaderComponent={
          !online ? (
            <Card bordered padding="$4">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Reconnect to view your subscription invoices.
              </Text>
            </Card>
          ) : invoicesQuery.isLoading ? (
            <YStack alignItems="center" padding="$6">
              <Spinner color="$primary" />
            </YStack>
          ) : invoicesQuery.isError ? (
            <Card bordered padding="$4" gap="$3">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Could not load invoices. Check your connection and retry.
              </Text>
              <Button
                variant="outline"
                onPress={() => void invoicesQuery.refetch()}
              >
                Retry
              </Button>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          !invoicesQuery.isLoading && !invoicesQuery.isError ? (
            <Card bordered padding="$6">
              <YStack alignItems="center" gap="$2">
                <FileText size={40} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="700" fontFamily="$heading">
                  {filter === "paid"
                    ? "No paid invoices yet"
                    : filter === "pending"
                      ? "No pending invoices"
                      : "No invoices yet"}
                </Text>
                <Text
                  fontSize="$3"
                  color="$colorSecondary"
                  textAlign="center"
                  fontFamily="$body"
                >
                  {filter === "pending"
                    ? "Bills appear here after the current period ends and become payable until the grace date."
                    : "Your next bill will appear here when your current period ends."}
                </Text>
              </YStack>
            </Card>
          ) : null
        }
      />

      <MomoChargeSheet
        open={Boolean(payingInvoice)}
        title="Pay subscription"
        subtitle={
          payingInvoice ? `Due ${formatDate(payingInvoice.due_at)}` : undefined
        }
        baseMinor={payingInvoice?.base_amount_minor ?? 0}
        feeMinor={payingInvoice?.fee_minor ?? 0}
        currency={payingInvoice?.currency ?? "GHS"}
        defaultPhone={billing.data?.billing_profile?.momo_phone}
        defaultProvider={billing.data?.billing_profile?.momo_provider}
        onStart={async (phone, provider) => {
          if (!payingInvoice || !businessId) {
            return { charge: null, done: true };
          }
          await updateProfile.mutateAsync({
            phone,
            provider,
            consent_version: "2026-10",
          });
          const response = await chargeInvoice.mutateAsync({
            invoiceId: payingInvoice.id,
            phone,
            provider,
            attemptCount: payingInvoice.attempt_count ?? 0,
          });
          return { charge: response.data };
        }}
        onSuccess={handlePaymentSuccess}
        onClose={() => {
          setPayingInvoice(null);
          void invoicesQuery.refetch();
          void billing.refetch();
          queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
        }}
      />
    </YStack>
  );
}
