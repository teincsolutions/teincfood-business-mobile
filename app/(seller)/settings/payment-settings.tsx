// @ts-nocheck
import { useEffect, useState } from 'react';
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
  useMedia,
} from 'tamagui';
import { ArrowLeft, Save, CreditCard, Building, Clock } from '@tamagui/lucide-icons';
import { Button, FormInput } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveBusiness } from '@/hooks/useActiveBusiness';
import {
  buildPaymentMethodSettings,
  usePaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
} from '@/hooks/usePaymentSettings';
import { useHasCapability } from '@/hooks/useMyBusinessCapabilities';

export default function PaymentSettings() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const { activeBusinessId } = useActiveBusiness();
  const canEdit = useHasCapability("business_profile_manage");
  const paymentSettingsQuery = usePaymentSettingsQuery(activeBusinessId);
  const saveMutation = useUpdatePaymentSettingsMutation(activeBusinessId);

  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptMobileMoney, setAcceptMobileMoney] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [payoutProvider, setPayoutProvider] = useState('mtn');
  const [payoutSchedule, setPayoutSchedule] = useState('daily');
  const [instantPayoutEnabled, setInstantPayoutEnabled] = useState(false);
  const [payoutFeeMinor, setPayoutFeeMinor] = useState(100);

  useEffect(() => {
    const settings = paymentSettingsQuery.data?.data;
    if (!settings) return;
    const methods = settings.payment_methods ?? [];
    if (!settings.configured) {
      setAcceptCash(true);
      setAcceptMobileMoney(true);
      setAcceptCard(true);
    } else {
      setAcceptCash(
        methods.includes('cash') || methods.includes('pay_on_delivery'),
      );
      setAcceptMobileMoney(methods.includes('mobile_money'));
      setAcceptCard(methods.includes('card'));
    }
    setBankName(settings.payout_bank_name ?? settings.payout_bank_code ?? '');
    setAccountNumber(settings.payout_account_number ?? '');
    setAccountName(settings.payout_account_name ?? '');
    setMobileMoneyNumber(settings.payout_momo_number ?? '');
    setPayoutProvider(settings.payout_provider ?? 'mtn');
    setPayoutSchedule(settings.payout_schedule ?? 'daily');
    setInstantPayoutEnabled(settings.instant_payout_enabled ?? false);
    setPayoutFeeMinor(settings.payout_fee_minor ?? 100);
  }, [paymentSettingsQuery.data]);

  const handleSave = () => {
    if (!activeBusinessId) return;
    saveMutation.mutate(
      {
        payment_methods: buildPaymentMethodSettings(
          acceptCash,
          acceptMobileMoney,
          acceptCard,
        ),
        payout_bank_name: bankName,
        payout_account_name: accountName,
        payout_account_number: accountNumber,
        payout_momo_number: mobileMoneyNumber,
        payout_provider: payoutProvider,
        payout_schedule: payoutSchedule,
        instant_payout_enabled: instantPayoutEnabled,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Payment settings updated', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (error) => {
          console.debug('[payment-settings] save failed', error);
          Alert.alert('Error', 'Failed to update payment settings');
        },
      },
    );
  };

  const payoutOptions = [
    { value: 'daily', label: 'Daily', description: 'Receive payouts every day' },
    { value: 'weekly', label: 'Weekly', description: 'Receive payouts every Monday' },
    { value: 'biweekly', label: 'Bi-weekly', description: 'Receive payouts every 2 weeks' },
    { value: 'monthly', label: 'Monthly', description: 'Receive payouts on the 1st of each month' },
  ];

  return (
    <YStack flex={1} backgroundColor="$background" {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center", width: "100%" } : {})}>
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
        {canEdit && (
          <TamaguiButton
            height={44}
            paddingHorizontal="$4"
            backgroundColor="$primary"
            borderRadius="$3"
            onPress={handleSave}
            disabled={saveMutation.isPending}
            icon={<Save size={18} color="white" />}
          >
            <Text color="white" fontWeight="bold">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Text>
          </TamaguiButton>
        )}
      </XStack>

      {!canEdit ? (
        <YStack padding="$4">
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <Text fontSize="$3" color="$yellow10">
              Only business managers can change payment settings.
            </Text>
          </Card>
        </YStack>
      ) : (

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
                <Text fontSize="$3" fontWeight="bold" color="$colorMuted">Provider</Text>
                <XStack gap="$2">
                  {[
                    ['mtn', 'MTN'],
                    ['vod', 'Telecel'],
                    ['atl', 'AirtelTigo'],
                  ].map(([value, label]) => (
                    <TamaguiButton
                      key={value}
                      flex={1}
                      height={42}
                      backgroundColor={payoutProvider === value ? '$primaryLight' : 'transparent'}
                      borderWidth={1}
                      borderColor={payoutProvider === value ? '$primary' : '$borderColor'}
                      borderRadius="$3"
                      onPress={() => setPayoutProvider(value)}
                    >
                      <Text fontSize="$2" fontWeight="bold">{label}</Text>
                    </TamaguiButton>
                  ))}
                </XStack>
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

          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center" gap="$3">
                <YStack flex={1}>
                  <Text fontWeight="bold" fontSize="$5">Instant Payout</Text>
                  <Text fontSize="$2" color="$colorMuted" marginTop="$1">
                    Send each order&apos;s settled amount straight to MoMo.
                    Paystack charges GH₵{(payoutFeeMinor / 100).toFixed(2)} per
                    transfer, deducted from the payout. Off keeps money in your
                    wallet.
                  </Text>
                </YStack>
                <Switch
                  size="$3"
                  checked={instantPayoutEnabled}
                  onCheckedChange={setInstantPayoutEnabled}
                >
                  <Switch.Thumb animation="quick" />
                </Switch>
              </XStack>
              <Text fontSize="$1" color="$colorMuted">
                Wallet is credited first. A failed transfer never blocks the
                order and is refunded to the wallet automatically.
              </Text>
            </YStack>
          </Card>

          <Button variant="primary" onPress={handleSave} disabled={saveMutation.isPending}>
            <Text color="white" fontWeight="bold">{saveMutation.isPending ? 'Saving Changes...' : 'Save Changes'}</Text>
          </Button>
        </YStack>
      </ScrollView>
      )}
    </YStack>
  );
}
