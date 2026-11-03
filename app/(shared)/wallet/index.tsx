// @ts-nocheck
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Spinner, Separator, useMedia } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { TrendingUp, Building, Bike, Crown, Wallet } from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import {
  useAllBalancesQuery,
  useBusinessWalletBalanceQuery,
  useIsEffectivelyOnline,
} from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useBillingQuery } from "@/hooks/useSubscription";

function formatMinor(amount: number, currency = "GHS") {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Seller/fleet billing snapshot. Riders have no subscription, so this is never
 * mounted for the rider wallet.
 */
function BillingSnapshot() {
  const router = useRouter();
  const online = useIsEffectivelyOnline();
  const billing = useBillingQuery();
  const data = billing.data;
  const upcoming = data?.upcoming_invoice;
  const lastPaid = (data?.invoices ?? []).find(
    (invoice) => invoice.status === "paid" && invoice.paid_at,
  );

  const billLabel =
    upcoming?.status === "open"
      ? "Payment due"
      : upcoming?.status === "payment_pending"
        ? "Awaiting approval"
        : "Next bill";

  return (
    <Card padding="$4" bordered>
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center" gap="$2">
          <XStack gap="$2" alignItems="center">
            <Crown size={18} />
            <Text
              fontSize="$5"
              fontWeight="600"
              fontFamily="$heading"
              color="$color"
            >
              Bills &amp; payments
            </Text>
          </XStack>
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push("/(shared)/wallet/plans" as never)}
          >
            View
          </Button>
        </XStack>

        <Separator />

        {!online ? (
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            Reconnect to view bills and payments.
          </Text>
        ) : billing.isLoading ? (
          <YStack alignItems="center" padding="$2">
            <Spinner color="$primary" />
          </YStack>
        ) : billing.isError ? (
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            Could not load bills. Open Manage plan to retry.
          </Text>
        ) : (
          <YStack gap="$2">
            {upcoming ? (
              <YStack gap="$0.5">
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  {billLabel}
                </Text>
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$heading"
                  color={upcoming.status === "open" ? "$warning" : "$color"}
                >
                  {formatMinor(upcoming.amount_minor, upcoming.currency)}
                </Text>
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  Due {formatShortDate(upcoming.due_at)}
                </Text>
              </YStack>
            ) : (
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                No bill due right now.
              </Text>
            )}

            {lastPaid ? (
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                Last payment: {formatMinor(lastPaid.amount_minor, lastPaid.currency)} on{" "}
                {formatShortDate(lastPaid.paid_at)}
              </Text>
            ) : (
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                No subscription payments yet.
              </Text>
            )}
          </YStack>
        )}
      </YStack>
    </Card>
  );
}

/**
 * Business-only subscription/billing section. Kept out of the rider tree.
 */
function BusinessBillingSection() {
  const router = useRouter();
  const ent = useEntitlements();
  const entData = ent.data as Record<string, unknown> | undefined;
  const entEvaluation = ent.evaluation;
  const isTrial = entData?.subscription_status === "trialing";
  const periodEnd = entData?.current_period_end as string | undefined;

  return (
    <>
      <Card padding="$4" bordered>
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600" fontFamily="$heading" color="$color">
            Billing & Subscription
          </Text>
          <Separator />
          {entData ? (
            <YStack gap="$1">
              <Text fontSize="$3" color="$color" fontFamily="$body">
                Commission: {String(entData.commission_rate_percent ?? 0)}% • Status: {String(entData.subscription_status ?? "none")}
              </Text>
              {isTrial && periodEnd ? (
                <Text fontSize="$3" color="$warning" fontFamily="$body">
                  Trial ends {new Date(periodEnd).toLocaleDateString()}
                </Text>
              ) : null}
              {entEvaluation.state === "expired" ? (
                <Text fontSize="$3" color="$error" fontFamily="$body">
                  Subscription expired — open Manage plan to renew
                </Text>
              ) : null}
              {entEvaluation.state === "grace" ? (
                <Text fontSize="$3" color="$warning" fontFamily="$body">
                  Payment overdue — renew soon to keep features
                </Text>
              ) : null}
              {entEvaluation.mustReconnect ? (
                <Text fontSize="$3" color="$error" fontFamily="$body">
                  Reconnect to verify your subscription
                </Text>
              ) : null}
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Menus: {String(entData["limits.menu_items"] ?? "—")} • Members: {String(entData["limits.members"] ?? "—")} • Terminals: {String(entData["limits.terminals_linked"] ?? "—")}
              </Text>
              <Button
                variant="outline"
                onPress={() => router.push("/(shared)/wallet/plans" as never)}
              >
                Manage plan &amp; bills
              </Button>
            </YStack>
          ) : (
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Loading entitlements…
            </Text>
          )}
        </YStack>
      </Card>
      <BillingSnapshot />
    </>
  );
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const media = useMedia();
  const role = useRoleStore((s) => s.role);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const { data: allBalances, isLoading: loadingAll } = useAllBalancesQuery();
  const { data: businessBalance, isLoading: loadingBiz } =
    useBusinessWalletBalanceQuery(Boolean(activeBusiness?.id));

  const isLoading = loadingAll || (Boolean(activeBusiness?.id) && loadingBiz);
  const balances = allBalances?.data.balances ?? [];
  const bizBalance = businessBalance?.data.balances?.[0];
  const riderBalance = balances.find((b) => b.type === "rider");

  const isRider = role === "rider";
  const isSellerOrFleet = role === "seller" || role === "fleet_manager";
  const canFinanceRead = useHasCapability("finance_read");
  const canManageBilling = useHasCapability("finance_billing_manage");
  const showBusinessBalance = !isSellerOrFleet || canFinanceRead;
  const showBilling = !isRider && canManageBilling;

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 16)}
        gap="$4"
        alignSelf="center"
        width="100%"
        flex={1}
        {...(media.md || media.lg ? { maxWidth: 600 } : {})}
      >
        <XStack gap="$2" alignItems="center">
          <BackButton />
          <YStack gap="$1" flex={1}>
            <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
              {isRider ? "Wallet" : "Wallet & Billing"}
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              {isRider
                ? "Your delivery balance and transactions"
                : "Balance, transactions, and billing"}
            </Text>
          </YStack>
        </XStack>

        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="large" color="$primary" />
          </YStack>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: "$4", paddingBottom: 40 }}
          >
            {/* Balance card */}
            <Card
              padding="$4"
              bordered
              backgroundColor="$primaryLight"
              borderColor="$primary"
            >
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  {isRider ? (
                    <Bike size={20} color="$primary" />
                  ) : (
                    <Building size={20} color="$primary" />
                  )}
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$heading"
                    color="$primary"
                  >
                    {isSellerOrFleet && activeBusiness
                      ? activeBusiness.name
                      : "Rider"}
                  </Text>
                </XStack>
                {showBusinessBalance ? (
                  <>
                    <Text
                      fontSize="$8"
                      fontWeight="bold"
                      fontFamily="$heading"
                      color="$color"
                    >
                      {isSellerOrFleet
                        ? bizBalance
                          ? formatMinor(bizBalance.amount_minor, bizBalance.currency)
                          : "GHS 0.00"
                        : riderBalance
                          ? formatMinor(riderBalance.amount_minor, riderBalance.currency)
                          : "GHS 0.00"}
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      Balance
                    </Text>
                  </>
                ) : (
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    Business balances are visible to managers.
                  </Text>
                )}
              </YStack>
            </Card>

            {/* Quick actions */}
            {(!isSellerOrFleet || canFinanceRead) && (
              <Card padding="$4" bordered>
                <YStack gap="$3">
                  <Text fontSize="$5" fontWeight="600" fontFamily="$heading" color="$color">
                    Quick Actions
                  </Text>
                  <Separator />
                  <Button
                    variant="outline"
                    icon={<TrendingUp size={18} />}
                    onPress={() => router.push("/(shared)/wallet/transactions")}
                  >
                    Transactions
                  </Button>
                  {isRider ? (
                    <Button
                      variant="outline"
                      icon={<Wallet size={18} />}
                      onPress={() => router.push("/(rider)/earnings")}
                    >
                      Earnings
                    </Button>
                  ) : null}
                </YStack>
              </Card>
            )}

            {/* Subscription/billing is business-only, never shown to riders. */}
            {showBilling ? <BusinessBillingSection /> : null}
          </ScrollView>
        )}
      </YStack>
    </YStack>
  );
}
