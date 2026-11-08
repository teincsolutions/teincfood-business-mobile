// @ts-nocheck
import { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button as TamaguiButton,
  Switch,
  Separator,
  Sheet,
  useMedia,
} from 'tamagui';
import { extractApiErrorCode } from '@teincfood/core';
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
import { useAuthStore } from '@/stores/auth.store';
import { useProfileQuery } from '@/hooks/useProfile';

export default function PaymentSettings() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const { activeBusiness, activeBusinessId } = useActiveBusiness();
  const currency =
    (activeBusiness as unknown as { currency?: string })?.currency ?? 'GHS';
  const canEdit = useHasCapability("business_profile_manage");
  const paymentSettingsQuery = usePaymentSettingsQuery(activeBusinessId);
  const saveMutation = useUpdatePaymentSettingsMutation(activeBusinessId);
  const storeUser = useAuthStore((s) => s.user);
  const { data: profile } = useProfileQuery();
  const hasPassword = (profile ?? storeUser)?.has_password === true;

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptMobileMoney, setAcceptMobileMoney] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState<'mobile_money' | 'bank'>('mobile_money');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [payoutProvider, setPayoutProvider] = useState('mtn');
  const [payoutSchedule, setPayoutSchedule] = useState('daily');
  const [instantPayoutEnabled, setInstantPayoutEnabled] = useState(false);
  const [payoutFeeMinor, setPayoutFeeMinor] = useState(100);
  const [bankPayoutFeeMinor, setBankPayoutFeeMinor] = useState(800);

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
    setPayoutMethod(settings.payout_method === 'bank' ? 'bank' : 'mobile_money');
    setBankName(settings.payout_bank_name ?? '');
    setBankCode(settings.payout_bank_code ?? '');
    setAccountNumber(settings.payout_account_number ?? '');
    setAccountName(settings.payout_account_name ?? '');
    setMobileMoneyNumber(settings.payout_momo_number ?? '');
    setPayoutProvider(settings.payout_provider ?? 'mtn');
    setPayoutSchedule(settings.payout_schedule ?? 'daily');
    setInstantPayoutEnabled(settings.instant_payout_enabled ?? false);
    setPayoutFeeMinor(settings.payout_fee_minor ?? 100);
    setBankPayoutFeeMinor(settings.bank_payout_fee_minor ?? 800);
  }, [paymentSettingsQuery.data]);

  const settings = paymentSettingsQuery.data?.data;
  const payoutChanged =
    Boolean(settings) &&
    ((settings?.payout_method ?? 'mobile_money') !== payoutMethod ||
      (settings?.payout_bank_name ?? '') !== bankName.trim() ||
      (settings?.payout_bank_code ?? '') !== bankCode.trim() ||
      (settings?.payout_account_name ?? '') !== accountName.trim() ||
      (settings?.payout_account_number ?? '') !== accountNumber.trim() ||
      (settings?.payout_momo_number ?? '') !== mobileMoneyNumber.trim() ||
      (settings?.payout_provider ?? 'mtn') !== payoutProvider);

  const buildPayload = () => ({
    payment_methods: buildPaymentMethodSettings(
      acceptCash,
      acceptMobileMoney,
      acceptCard,
    ),
    payout_method: payoutMethod,
    payout_bank_name: bankName.trim(),
    payout_bank_code: bankCode.trim(),
    payout_account_name: accountName.trim(),
    payout_account_number: accountNumber.trim(),
    payout_momo_number: mobileMoneyNumber.trim(),
    payout_provider: payoutProvider,
    payout_schedule: payoutSchedule,
    instant_payout_enabled: instantPayoutEnabled,
  });

  const submitSave = async (
    verificationMethod?: 'password' | 'biometric',
    currentPassword?: string,
  ) => {
    if (!activeBusinessId) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      await saveMutation.mutateAsync({
        ...buildPayload(),
        ...(verificationMethod
          ? { verification_method: verificationMethod }
          : {}),
        ...(currentPassword ? { current_password: currentPassword } : {}),
      });
      setVerifyOpen(false);
      setVerifyPassword('');
      Alert.alert('Success', 'Payment settings updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.debug('[payment-settings] save failed', error);
      const code = extractApiErrorCode(error);
      if (code === 'PASSWORD_SETUP_REQUIRED') {
        setVerifyOpen(false);
        Alert.alert(
          'Set a password first',
          'Add a password in Privacy & Security so payout changes can be verified.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set password',
              onPress: () => router.push('/(shared)/profile/security'),
            },
          ],
        );
      } else if (code === 'INVALID_PASSWORD') {
        setVerifyError('Current password is incorrect.');
      } else if (code === 'VERIFICATION_REQUIRED') {
        setVerifyOpen(false);
        Alert.alert('Verification required', 'Verify again to change payout details.');
      } else {
        Alert.alert('Error', 'Failed to update payment settings');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!activeBusinessId) return;

    // Payment methods/schedule are routine. Payout account changes need
    // biometric or password confirmation.
    if (!payoutChanged) {
      await submitSave();
      return;
    }

    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm payout account change',
          fallbackLabel: 'Use password',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          await submitSave('biometric');
          return;
        }
      }
    } catch (error) {
      console.debug('[payment-settings] biometric check failed', error);
    }

    if (!hasPassword) {
      Alert.alert(
        'Protect payout changes',
        'Set a password in Privacy & Security first, or use biometrics when available.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set password',
            onPress: () => router.push('/(shared)/profile/security'),
          },
        ],
      );
      return;
    }

    setVerifyPassword('');
    setVerifyError(null);
    setVerifyOpen(true);
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
          {!hasPassword ? (
            <Card padding="$4" bordered backgroundColor="$yellow2" borderColor="$warning">
              <YStack gap="$2">
                <Text fontWeight="bold" fontSize="$4" color="$color">
                  Protect payout changes
                </Text>
                <Text fontSize="$3" color="$colorSecondary">
                  Set a password so changing your payout account always needs
                  your approval. Biometrics can also be used when available.
                </Text>
                <Button
                  variant="outline"
                  onPress={() => router.push('/(shared)/profile/security')}
                >
                  Set up password
                </Button>
              </YStack>
            </Card>
          ) : null}
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
            <YStack gap="$3">
              <Text fontWeight="bold" fontSize="$5">Payout Destination</Text>
              <Text fontSize="$2" color="$colorMuted">
                Where Paystack sends withdrawals and instant payouts.
              </Text>
              <XStack gap="$2">
                {[
                  ['mobile_money', 'Mobile Money', `${currency} ${(payoutFeeMinor / 100).toFixed(2)} fee`],
                  ['bank', 'Bank Account', `${currency} ${(bankPayoutFeeMinor / 100).toFixed(2)} fee`],
                ].map(([value, label, fee]) => (
                  <TamaguiButton
                    key={value}
                    flex={1}
                    height={56}
                    backgroundColor={payoutMethod === value ? '$primaryLight' : 'transparent'}
                    borderWidth={1}
                    borderColor={payoutMethod === value ? '$primary' : '$borderColor'}
                    borderRadius="$3"
                    onPress={() => setPayoutMethod(value as 'mobile_money' | 'bank')}
                  >
                    <YStack alignItems="center">
                      <Text fontSize="$2" fontWeight="bold">{label}</Text>
                      <Text fontSize="$1" color="$colorMuted">{fee}</Text>
                    </YStack>
                  </TamaguiButton>
                ))}
              </XStack>
            </YStack>
          </Card>

          {payoutMethod === 'bank' && (
            <Card padding="$4" bordered>
              <YStack gap="$4">
                <XStack gap="$3" alignItems="center">
                  <Building size={20} color="$primary" />
                  <Text fontWeight="bold" fontSize="$5">Bank Account</Text>
                </XStack>
                <Separator />
                <FormInput label="Bank Name" placeholder="e.g. GCB Bank" value={bankName} onChangeText={setBankName} />
                <FormInput label="Bank Code" placeholder="e.g. 030100" value={bankCode} onChangeText={setBankCode} keyboardType="numeric" />
                <FormInput label="Account Number" placeholder="Enter account number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
                <FormInput label="Account Name" placeholder="Enter account holder name" value={accountName} onChangeText={setAccountName} />
                <Text fontSize="$2" color="$colorMuted">
                  Bank payouts cost {currency} {(bankPayoutFeeMinor / 100).toFixed(2)} per transfer.
                </Text>
              </YStack>
            </Card>
          )}

          {payoutMethod === 'mobile_money' && acceptMobileMoney && (
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
                <Text fontSize="$2" color="$colorMuted">
                  Mobile-money payouts cost {currency} {(payoutFeeMinor / 100).toFixed(2)} per transfer.
                </Text>
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
                    Send each order&apos;s settled amount straight to your{' '}
                    {payoutMethod === 'bank' ? 'bank account' : 'mobile-money account'}.
                    Paystack charges {currency}{' '}
                    {((payoutMethod === 'bank' ? bankPayoutFeeMinor : payoutFeeMinor) / 100).toFixed(2)}{' '}
                    per transfer, deducted from the payout. Off keeps money in
                    your wallet.
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

      <Sheet
        modal
        open={verifyOpen}
        onOpenChange={(open) => {
          if (!open) setVerifyPassword('');
          setVerifyOpen(open);
        }}
        snapPoints={[48]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          padding="$5"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4">
            <YStack gap="$1">
              <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
                Confirm payout change
              </Text>
              <Text fontSize="$3" color="$colorSecondary">
                Enter your account password to approve this payout account change.
              </Text>
            </YStack>

            <FormInput
              label="Password"
              placeholder="Current password"
              value={verifyPassword}
              onChangeText={(value) => {
                setVerifyPassword(value);
                setVerifyError(null);
              }}
              isPassword
            />

            {verifyError ? (
              <Text fontSize="$3" color="$red10">
                {verifyError}
              </Text>
            ) : null}

            <Button
              variant="primary"
              height={46}
              loading={verifying}
              disabled={!verifyPassword || verifying}
              onPress={() => void submitSave('password', verifyPassword)}
            >
              Confirm and save
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
