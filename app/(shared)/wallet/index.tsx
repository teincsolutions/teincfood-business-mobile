// @ts-nocheck
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Spinner, Separator, useMedia } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  TrendingUp,
  Building,
  Bike,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { useAllBalancesQuery, useBusinessWalletBalanceQuery } from "@/hooks/useWallet";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useReferenceData } from "@/reference/hooks";

function formatMinor(amount: number, currency = "GHS") {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const media = useMedia();
  const role = useRoleStore((s) => s.role);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const { data: allBalances, isLoading: loadingAll } = useAllBalancesQuery();
  const { data: businessBalance, isLoading: loadingBiz } = useBusinessWalletBalanceQuery(
    Boolean(activeBusiness?.id),
  );

  const isLoading = loadingAll || (Boolean(activeBusiness?.id) && loadingBiz);
  const balances = allBalances?.data.balances ?? [];
  const bizBalance = businessBalance?.data.balances?.[0];
  const riderBalance = balances.find((b) => b.type === "rider");

  const isSellerOrFleet = role === "seller" || role === "fleet_manager";
  const ent = useEntitlements();
  const entData = ent.data as Record<string, unknown> | undefined;
  const isTrial = entData?.subscription_status === "trialing";
  const periodEnd = entData?.current_period_end as string | undefined;

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
              Wallet & Billing
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Balance, transactions, and billing
            </Text>
          </YStack>
        </XStack>

        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="large" color="$primary" />
          </YStack>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: "$4", paddingBottom: 40 }}>
            {/* Balance card */}
            <Card padding="$4" bordered backgroundColor="$primaryLight" borderColor="$primary">
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  {isSellerOrFleet ? (
                    <Building size={20} color="$primary" />
                  ) : (
                    <Bike size={20} color="$primary" />
                  )}
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading" color="$primary">
                    {isSellerOrFleet && activeBusiness
                      ? activeBusiness.name
                      : "Rider"}
                  </Text>
                </XStack>
                <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
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
              </YStack>
            </Card>

            {/* Quick actions */}
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
              </YStack>
            </Card>

            {/* Billing / subscription */}
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
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      Menus: {String(entData["limits.menu_items"] ?? "—")} • Members: {String(entData["limits.members"] ?? "—")} • Terminals: {String(entData["limits.terminals_linked"] ?? "—")}
                    </Text>
                    {role === "seller" || role === "fleet_manager" ? (
                      <Button variant="outline" onPress={() => router.push("/(shared)/wallet/plans" as never)}>
                        Manage plan
                      </Button>
                    ) : null}
                  </YStack>
                ) : (
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    Loading entitlements…
                  </Text>
                )}
              </YStack>
            </Card>
          </ScrollView>
        )}
      </YStack>
    </YStack>
  );
}
