// @ts-nocheck
import { useState } from "react";
import { FlatList, ScrollView, TouchableOpacity } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Spinner,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  TrendingUp,
  Building,
  Bike,
  Wallet,
  Lock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton, Button, DrawerToggleButton } from "@/components/ui";
import {
  WALLET_KEYS,
  formatDate,
  useAllBalancesQuery,
  useBusinessWalletBalanceQuery,
  useWalletHistoryQuery,
} from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { usePaymentSettingsQuery } from "@/hooks/usePaymentSettings";
import { WithdrawSheet } from "@/components/wallet/WithdrawSheet";
import { useResponsive } from "@/utils/responsive";

function formatMinor(amount: number, currency = "GHS") {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

export default function WalletScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useRoleStore((s) => s.role);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const { isTablet, isLandscape } = useResponsive();
  const isWide = isTablet && isLandscape;
  const { data: allBalances, isLoading: loadingAll } = useAllBalancesQuery();
  const { data: businessBalance, isLoading: loadingBiz } =
    useBusinessWalletBalanceQuery(Boolean(activeBusiness?.id));
  const { data: walletHistory } = useWalletHistoryQuery(
    Boolean(activeBusiness?.id),
  );
  const { data: paymentSettings } = usePaymentSettingsQuery(
    activeBusiness?.id,
  );
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);

  const isLoading = loadingAll || (Boolean(activeBusiness?.id) && loadingBiz);
  const balances = allBalances?.data.balances ?? [];
  const bizBalance = businessBalance?.data.balances?.[0];
  const riderBalance = balances.find((b) => b.type === "rider");
  const taxWallet = (businessBalance?.data as { tax_wallet?: any })?.tax_wallet;
  const payoutTotalFromApi = (
    businessBalance?.data as { payout_total_minor?: number }
  )?.payout_total_minor;
  const payoutFeesFromApi = (
    businessBalance?.data as { payout_fee_total_minor?: number }
  )?.payout_fee_total_minor;
  const walletCurrency =
    (businessBalance?.data as { currency?: string })?.currency ??
    bizBalance?.currency ??
    "GHS";

  const historyEntries: any[] = Array.isArray(walletHistory)
    ? walletHistory
    : (walletHistory as any)?.entries ??
      (walletHistory as any)?.pages?.flatMap(
        (page: any) => page?.data?.entries ?? [],
      ) ??
      [];

  const totalPaidOut = historyEntries
    .filter(
      (entry) =>
        entry?.type === "debit" &&
        entry?.metadata?.payout_status === "paid" &&
        (entry?.metadata?.payout_kind === "withdrawal" ||
          entry?.metadata?.payout_kind === "instant"),
    )
    .reduce(
      (sum, entry) =>
        sum +
        (entry?.metadata?.transfer_amount_minor ?? entry?.amount_minor ?? 0),
      0,
    );

  const payoutFee = (entry: any) => {
    const metadata = entry?.metadata ?? {};
    if (typeof metadata.fee_minor === "number") return metadata.fee_minor;
    const net = metadata.transfer_amount_minor ?? entry?.amount_minor ?? 0;
    return Math.max((entry?.amount_minor ?? 0) - net, 0);
  };

  const totalCharges = historyEntries
    .filter(
      (entry) =>
        entry?.type === "debit" &&
        entry?.metadata?.payout_status === "paid" &&
        (entry?.metadata?.payout_kind === "withdrawal" ||
          entry?.metadata?.payout_kind === "instant"),
    )
    .reduce((sum, entry) => sum + payoutFee(entry), 0);

  const totalPaidOutDisplay = payoutTotalFromApi ?? totalPaidOut;
  const totalChargesDisplay = payoutFeesFromApi ?? totalCharges;

  const taxStatusLabel: Record<string, string> = {
    none: "No certificate uploaded",
    pending: "Certificate under review",
    approved: "Certificate approved",
    rejected: "Certificate rejected",
  };

  const isRider = role === "rider";
  const isSellerOrFleet = role === "seller" || role === "fleet_manager";
  const canFinanceRead = useHasCapability("finance_read");
  const canWithdraw = useHasCapability("finance_withdraw");
  const showBusinessBalance = !isSellerOrFleet || canFinanceRead;

  const balanceCard = (
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
            {isSellerOrFleet && activeBusiness ? activeBusiness.name : "Rider"}
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
                  : formatMinor(0, walletCurrency)
                : riderBalance
                  ? formatMinor(riderBalance.amount_minor, riderBalance.currency)
                  : formatMinor(0, walletCurrency)}
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Balance
            </Text>
            {!isWide && isSellerOrFleet && activeBusiness && canWithdraw ? (
              <Button
                variant="primary"
                height={46}
                icon={<ArrowUpRight size={18} />}
                onPress={() => setWithdrawOpen(true)}
              >
                Withdraw
              </Button>
            ) : null}
          </>
        ) : (
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            Business balances are visible to managers.
          </Text>
        )}
      </YStack>
    </Card>
  );

  const payoutCard =
    isSellerOrFleet && showBusinessBalance ? (
      <Card padding="$4" bordered>
        <YStack gap="$1">
          <Text
            fontSize="$4"
            fontWeight="600"
            fontFamily="$heading"
            color="$colorSecondary"
          >
            Total paid out
          </Text>
          <Text
            fontSize="$8"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color"
          >
            {formatMinor(totalPaidOutDisplay, walletCurrency)}
          </Text>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            Net received from completed withdrawals and instant payouts
          </Text>
          <Separator marginVertical="$2" />
          <TouchableOpacity
            onPress={() => setChargesOpen((value) => !value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              chargesOpen ? "Hide charges" : "View charges"
            }
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Text
                fontSize="$3"
                fontWeight="600"
                fontFamily="$heading"
                color="$primary"
              >
                {chargesOpen ? "Hide charges" : "View charges"}
              </Text>
              {chargesOpen ? (
                <ChevronUp size={16} color="$primary" />
              ) : (
                <ChevronDown size={16} color="$primary" />
              )}
            </XStack>
          </TouchableOpacity>
          {chargesOpen ? (
            <YStack gap="$1">
              <XStack alignItems="center" justifyContent="space-between">
                <Text
                  fontSize="$4"
                  fontWeight="600"
                  fontFamily="$heading"
                  color="$colorSecondary"
                >
                  Charges
                </Text>
                <Text
                  fontSize="$5"
                  fontWeight="600"
                  fontFamily="$heading"
                  color="$color"
                >
                  {formatMinor(totalChargesDisplay, walletCurrency)}
                </Text>
              </XStack>
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                Provider fees deducted from your wallet
              </Text>
            </YStack>
          ) : null}
        </YStack>
      </Card>
    ) : null;

  const taxCard = taxWallet ? (
    <Card
      padding="$4"
      bordered
      borderColor="$warning"
      backgroundColor="$yellow2"
    >
      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <XStack gap="$2" alignItems="center">
            <Lock size={18} color="$warning" />
            <Text
              fontSize="$4"
              fontWeight="600"
              fontFamily="$heading"
              color="$color"
            >
              Tax wallet
            </Text>
          </XStack>
          <Text
            fontSize="$2"
            fontWeight="700"
            color="$warning"
            fontFamily="$body"
          >
            LOCKED
          </Text>
        </XStack>
        <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
          {formatMinor(
            taxWallet.balance_minor ?? taxWallet.amount_minor ?? 0,
            taxWallet.currency,
          )}
        </Text>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          {taxStatusLabel[taxWallet.tax_certificate_status] ??
            "Not withdrawable. Upload a tax certificate to request a transfer."}
        </Text>
        <Button
          variant="outline"
          size="$3"
          onPress={() => router.push("/(shared)/kyc")}
        >
          {taxWallet.tax_certificate_status === "pending"
            ? "View tax certificate"
            : "Upload tax certificate"}
        </Button>
      </YStack>
    </Card>
  ) : null;

  const quickActionsCard =
    !isSellerOrFleet || canFinanceRead ? (
      <Card padding="$4" bordered>
        <YStack gap="$3">
          <Text
            fontSize="$5"
            fontWeight="600"
            fontFamily="$heading"
            color="$color"
          >
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
    ) : null;

  const historyCard = (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text
          fontSize="$5"
          fontWeight="600"
          fontFamily="$heading"
          color="$color"
        >
          Transaction history
        </Text>
        <Button
          variant="ghost"
          size="$3"
          onPress={() => router.push("/(shared)/wallet/transactions")}
        >
          View all
        </Button>
      </XStack>

      <Card bordered overflow="hidden">
        {historyEntries.length === 0 ? (
          <YStack alignItems="center" justifyContent="center" padding="$8" gap="$2">
            <TrendingUp size={40} color="$colorMuted" />
            <Text fontSize="$4" color="$colorMuted" fontFamily="$body">
              No transactions yet
            </Text>
          </YStack>
        ) : (
          historyEntries.map((entry: any, index: number) => {
            const credit = entry.type === "credit";
            return (
              <XStack
                key={entry?.id ?? String(index)}
                alignItems="center"
                gap="$3"
                paddingHorizontal="$4"
                paddingVertical="$3"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
              >
                <YStack flex={1} minWidth={0} gap="$0.5">
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    fontFamily="$body"
                    color="$color"
                    numberOfLines={1}
                  >
                    {entry.description ?? "Transaction"}
                  </Text>
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                    numberOfLines={1}
                  >
                    {`${String(entry.type).replace(/_/g, " ")} · ${formatDate(entry.inserted_at)}`}
                  </Text>
                </YStack>
                <Text
                  fontSize="$3"
                  fontWeight="700"
                  fontFamily="$heading"
                  color={credit ? "$success" : "$error"}
                  flexShrink={0}
                >
                  {`${credit ? "+" : "−"}${formatMinor(Math.abs(entry.amount_minor ?? 0), entry.currency ?? walletCurrency)}`}
                </Text>
              </XStack>
            );
          })
        )}
      </Card>
    </YStack>
  );

  const summaryCards = (
    <XStack flexWrap="wrap" gap="$3" alignItems="flex-start">
      <YStack width={isWide ? "32%" : "100%"}>{balanceCard}</YStack>
      {payoutCard ? (
        <YStack width={isWide ? "32%" : "100%"}>{payoutCard}</YStack>
      ) : null}
      {taxCard ? (
        <YStack width={isWide ? "32%" : "100%"}>{taxCard}</YStack>
      ) : null}
      <YStack width="100%">{quickActionsCard}</YStack>
    </XStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        {embedded ? <DrawerToggleButton /> : <BackButton />}
        <YStack gap="$1" flex={1} minWidth={0}>
          <Text
            fontSize="$6"
            fontWeight="800"
            fontFamily="$heading"
            color="$color"
          >
            Wallet
          </Text>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            {isRider
              ? "Your delivery balance and transactions"
              : "Balance and transactions"}
          </Text>
        </YStack>
        {isWide && isSellerOrFleet && activeBusiness && canWithdraw ? (
          <Button
            variant="primary"
            height={46}
            icon={<ArrowUpRight size={18} />}
            onPress={() => setWithdrawOpen(true)}
          >
            Withdraw
          </Button>
        ) : null}
      </XStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: isWide ? 20 : 16,
            paddingBottom: insets.bottom + 32,
          }}
        >
          <YStack
            width="100%"
            maxWidth={isWide ? 1100 : 600}
            alignSelf="center"
            gap="$4"
          >
            {summaryCards}
            {isWide ? historyCard : null}
          </YStack>
        </ScrollView>
      )}

      {isSellerOrFleet && activeBusiness && canWithdraw ? (
        <WithdrawSheet
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          businessId={activeBusiness.id}
          balanceMinor={bizBalance?.amount_minor ?? 0}
          currency={walletCurrency}
          settings={paymentSettings?.data}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: WALLET_KEYS.all });
          }}
        />
      ) : null}
    </YStack>
  );
}
