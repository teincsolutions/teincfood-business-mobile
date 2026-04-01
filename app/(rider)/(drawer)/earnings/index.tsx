// @ts-nocheck
import { YStack, Text, Card, XStack, Separator } from 'tamagui';
import { DollarSign, TrendingUp, Clock, Wallet, Calendar } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useRiderEarningsQuery, useRecentTransactionsQuery, useEarningsBreakdownQuery } from '@/hooks/rider.hooks';

/**
 * Rider Earnings Screen
 */
export default function RiderEarnings() {
  // TanStack Query hooks
  const { data: earnings, isLoading: earningsLoading } = useRiderEarningsQuery();
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useRecentTransactionsQuery();
  const { data: breakdown, isLoading: breakdownLoading } = useEarningsBreakdownQuery();

  if (!earnings) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <Text>Loading...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$6" fontWeight="bold">Earnings</Text>

          {/* Earnings Summary */}
          <XStack gap="$3" flexWrap="wrap">
            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <DollarSign size={20} color="$green10" />
                  <Text fontSize="$3" color="$colorMuted">Today</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">GHS {earnings.today.toFixed(2)}</Text>
              </YStack>
            </Card>

            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <Calendar size={20} color="$blue10" />
                  <Text fontSize="$3" color="$colorMuted">This Week</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">GHS {earnings.thisWeek.toFixed(2)}</Text>
              </YStack>
            </Card>

            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <TrendingUp size={20} color="$yellow10" />
                  <Text fontSize="$3" color="$colorMuted">This Month</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">GHS {earnings.thisMonth.toFixed(2)}</Text>
              </YStack>
            </Card>

            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <Wallet size={20} color="$purple10" />
                  <Text fontSize="$3" color="$colorMuted">Total</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">GHS {earnings.total.toFixed(2)}</Text>
              </YStack>
            </Card>
          </XStack>

          {/* Pending Payout */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack>
                <Text fontWeight="bold">Pending Payout</Text>
                <Text color="$colorMuted" fontSize="$3">Available for withdrawal</Text>
              </YStack>
              <Text fontSize="$6" fontWeight="bold" color="$blue10">
                GHS {earnings.pendingPayout.toFixed(2)}
              </Text>
            </XStack>
          </Card>

          {/* Recent Transactions */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Recent Transactions</Text>
              <Separator />
              {recentTransactions.map((transaction, index) => (
                <YStack key={transaction.id}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <Text fontWeight="bold">{transaction.orderId}</Text>
                      <Text color="$colorMuted" fontSize="$2">{transaction.date}</Text>
                    </YStack>
                    <Text fontWeight="bold" color="$green10">
                      +GHS {transaction.amount.toFixed(2)}
                    </Text>
                  </XStack>
                  {index < recentTransactions.length - 1 && <Separator marginTop="$3" />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Earnings Breakdown */}
          {breakdown && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold">Earnings Breakdown</Text>
                <Separator />
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">Base delivery fees</Text>
                  <Text>GHS {breakdown.baseDeliveryFees.toFixed(2)}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">Tips received</Text>
                  <Text>GHS {breakdown.tipsReceived.toFixed(2)}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">Bonuses</Text>
                  <Text>GHS {breakdown.bonuses.toFixed(2)}</Text>
                </XStack>
                <Separator />
                <XStack justifyContent="space-between">
                  <Text fontWeight="bold">Total This Week</Text>
                  <Text fontWeight="bold">GHS {breakdown.totalThisWeek.toFixed(2)}</Text>
                </XStack>
              </YStack>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}