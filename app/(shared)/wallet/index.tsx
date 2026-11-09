// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Spinner,
  Separator,
  useMedia,
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
} from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton, Button } from "@/components/ui";
import {
  WALLET_KEYS,
  useAllBalancesQuery,
  useBusinessWalletBalanceQuery,
  useWalletHistoryQuery,
} from "@teincfood/core";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { usePaymentSettingsQuery } from "@/hooks/usePaymentSettings";
import { WithdrawSheet } from "@/components/wallet/WithdrawSheet";

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
            <Text
              fontSize="$8"
              fontWeight="bold"
              fontFamily="$heading"
              color="$color"
            >
              Wallet
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              {isRider
                ? "Your delivery balance and transactions"
                : "Balance and transactions"}
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
                          ? formatMinor(
                              bizBalance.amount_minor,
                              bizBalance.currency,
                            )
                          : formatMinor(0, walletCurrency)
                        : riderBalance
                          ? formatMinor(
                              riderBalance.amount_minor,
                              riderBalance.currency,
                            )
                          : formatMinor(0, walletCurrency)}
                    </Text>
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      Balance
                    </Text>
                    {isSellerOrFleet && activeBusiness && canWithdraw ? (
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
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Business balances are visible to managers.
                  </Text>
                )}
              </YStack>
            </Card>

            {/* Payout and tax summary */}
            {isSellerOrFleet && showBusinessBalance ? (
              <YStack gap="$3">
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
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      Net received from completed withdrawals and instant payouts
                    </Text>
                    <Separator marginVertical="$2" />
                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                    >
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
                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      Provider fees deducted from your wallet
                    </Text>
                  </YStack>
                </Card>

                {taxWallet ? (
                  <Card
                    padding="$4"
                    bordered
                    borderColor="$warning"
                    backgroundColor="$yellow2"
                  >
                    <YStack gap="$2">
                      <XStack
                        alignItems="center"
                        justifyContent="space-between"
                      >
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
                      <Text
                        fontSize="$8"
                        fontWeight="bold"
                        fontFamily="$heading"
                        color="$color"
                      >
                        {formatMinor(
                          taxWallet.balance_minor ??
                            taxWallet.amount_minor ??
                            0,
                          taxWallet.currency,
                        )}
                      </Text>
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
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
                ) : null}
              </YStack>
            ) : null}

            {/* Quick actions */}
            {(!isSellerOrFleet || canFinanceRead) && (
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
            )}
          </ScrollView>
        )}
      </YStack>

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
