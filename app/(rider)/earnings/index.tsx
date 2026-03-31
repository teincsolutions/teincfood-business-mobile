// @ts-nocheck
import { YStack, Text, Card, XStack, Separator } from 'tamagui';
import { DollarSign, TrendingUp, Clock, Wallet, Calendar } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';

/**
 * Rider Earnings Screen
 */
export default function RiderEarnings() {
  const earnings = {
    today: 85.50,
    thisWeek: 420.00,
    thisMonth: 1250.00,
    total: 5680.00,
    pendingPayout: 320.00,
  };

  const recentTransactions = [
    { id: '1', orderId: '#ORD-001', amount: 12.50, date: 'Today, 2:30 PM', type: 'delivery' },
    { id: '2', orderId: '#ORD-002', amount: 15.00, date: 'Today, 1:15 PM', type: 'delivery' },
    { id: '3', orderId: '#ORD-003', amount: 10.00, date: 'Today, 11:45 AM', type: 'delivery' },
    { id: '4', orderId: '#ORD-004', amount: 18.75, date: 'Yesterday, 6:20 PM', type: 'delivery' },
    { id: '5', orderId: 'Bonus', amount: 25.00, date: 'Yesterday, 5:00 PM', type: 'bonus' },
  ];

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
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Earnings Breakdown</Text>
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Base delivery fees</Text>
                <Text>GHS 380.00</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Tips received</Text>
                <Text>GHS 25.00</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Bonuses</Text>
                <Text>GHS 15.00</Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontWeight="bold">Total This Week</Text>
                <Text fontWeight="bold">GHS 420.00</Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}