// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button as TamaguiButton,
  Switch,
  Separator,
} from 'tamagui';
import { ArrowLeft, Save, CreditCard, Building, Clock } from '@tamagui/lucide-icons';
import { Button, FormInput } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveBusiness } from '@/hooks/useActiveBusiness';
import * as businessService from '@/services/business.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function PaymentSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBusiness, activeBusinessId } = useActiveBusiness();
  const queryClient = useQueryClient();

  const settings = activeBusiness?.paymentSettings || {};
  const [acceptCash, setAcceptCash] = useState(settings.acceptCash ?? true);
  const [acceptMobileMoney, setAcceptMobileMoney] = useState(settings.acceptMobileMoney ?? true);
  const [acceptCard, setAcceptCard] = useState(settings.acceptCard ?? true);
  const [bankName, setBankName] = useState(settings.bankName || '');
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber || '');
  const [accountName, setAccountName] = useState(settings.accountName || '');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState(settings.mobileMoneyNumber || '');
  const [payoutSchedule, setPayoutSchedule] = useState(settings.payoutSchedule || 'daily');

  const saveMutation = useMutation({
    mutationFn: () =>
      businessService.updateBusiness(activeBusinessId!, {
        paymentSettings: {
          acceptCash,
          acceptMobileMoney,
          acceptCard,
          bankName,
          accountNumber,
          accountName,
          mobileMoneyNumber,
          payoutSchedule,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      Alert.alert('Success', 'Payment settings updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update payment settings');
    },
  });

  const payoutOptions = [
    { value: 'daily', label: 'Daily', description: 'Receive payouts every day' },
    { value: 'weekly', label: 'Weekly', description: 'Receive payouts every Monday' },
    { value: 'biweekly', label: 'Bi-weekly', description: 'Receive payouts every 2 weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Receive payouts on the 1st of each month' },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <TamaguiButton
            width={40}
            height={40}
            circular
            backgroundColor="$backgroundSoft"
            onPress={() => router.dismiss()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Payment Settings</Text>
        </XStack>
        <TamaguiButton
          height={44}
          paddingHorizontal="$4"
          backgroundColor="$primary"
          borderRadius="$3"
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          icon={<Save size={18} color="white" />}
        >
          <Text color="white" fontWeight="bold">
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TamaguiButton>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">Accepted Payment Methods</Text>
              <Separator />
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontWeight="bold">Cash</Text>
                  <Text color="$colorMuted" fontSize="$3">Accept cash payments</Text>
                </YStack>
                <Switch checked={acceptCash} onCheckedChange={setAcceptCash} backgroundColor={acceptCash ? '$green10' : '$gray800'}>
                  <Switch.Thumb backgroundColor="$background" />
                </Switch>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontWeight="bold">Mobile Money</Text>
                  <Text color="$colorMuted" fontSize="$3">MTN, Vodafone, AirtelTigo</Text>
                </YStack>
                <Switch checked={acceptMobileMoney} onCheckedChange={setAcceptMobileMoney} backgroundColor={acceptMobileMoney ? '$green10' : '$gray800'}>
                  <Switch.Thumb backgroundColor="$background" />
                </Switch>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontWeight="bold">Card Payment</Text>
                  <Text color="$colorMuted" fontSize="$3">Visa, Mastercard</Text>
                </YStack>
                <Switch checked={acceptCard} onCheckedChange={setAcceptCard} backgroundColor={acceptCard ? '$green10' : '$gray800'}>
                  <Switch.Thumb backgroundColor="$background" />
                </Switch>
              </XStack>
            </YStack>
          </Card>

          <Card padding="$4" bordered>
            <YStack gap="$4">
              <XStack gap="$3" alignItems="center">
                <Building size={20} color="$primary" />
                <Text fontWeight="bold" fontSize="$5">Bank Account</Text>
              </XStack>
              <Separator />
              <FormInput label="Bank Name" placeholder="Select your bank" value={bankName} onChangeText={setBankName} />
              <FormInput label="Account Number" placeholder="Enter account number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
              <FormInput label="Account Name" placeholder="Enter account holder name" value={accountName} onChangeText={setAccountName} />
            </YStack>
          </Card>

          {acceptMobileMoney && (
            <Card padding="$4" bordered>
              <YStack gap="$4">
                <XStack gap="$3" alignItems="center">
                  <CreditCard size={20} color="$primary" />
                  <Text fontWeight="bold" fontSize="$5">Mobile Money Account</Text>
                </XStack>
                <Separator />
                <FormInput label="Mobile Money Number" placeholder="+233 XX XXX XXXX" value={mobileMoneyNumber} onChangeText={setMobileMoneyNumber} keyboardType="phone-pad" />
              </YStack>
            </Card>
          )}

          <Card padding="$4" bordered>
            <YStack gap="$4">
              <XStack gap="$3" alignItems="center">
                <Clock size={20} color="$primary" />
                <Text fontWeight="bold" fontSize="$5">Payout Schedule</Text>
              </XStack>
              <Separator />
              {payoutOptions.map((option) => (
                <TamaguiButton
                  key={option.value}
                  unstyled
                  padding="$3"
                  backgroundColor={payoutSchedule === option.value ? '$primaryLight' : 'transparent'}
                  borderWidth={1}
                  borderColor={payoutSchedule === option.value ? '$primary' : '$borderColor'}
                  borderRadius="$3"
                  onPress={() => setPayoutSchedule(option.value)}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <Text fontWeight="bold">{option.label}</Text>
                      <Text fontSize="$2" color="$colorMuted">{option.description}</Text>
                    </YStack>
                    {payoutSchedule === option.value && (
                      <YStack width={20} height={20} borderRadius="$10" backgroundColor="$primary" alignItems="center" justifyContent="center">
                        <Text color="$background" fontSize="$1">✓</Text>
                      </YStack>
                    )}
                  </XStack>
                </TamaguiButton>
              ))}
            </YStack>
          </Card>

          <Button variant="primary" onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Text color="white" fontWeight="bold">{saveMutation.isPending ? 'Saving Changes...' : 'Save Changes'}</Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
